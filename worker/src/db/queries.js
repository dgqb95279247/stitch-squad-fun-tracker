function randomId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

export async function findMemberByPasscodeHash(DB, passcodeHash) {
  const result = await DB.prepare(
    `select m.id, m.slug, m.display_name, m.accent_key
     from member_credentials c
     join members m on m.id = c.member_id
     where c.passcode_hash = ? and m.is_active = 1`
  )
    .bind(passcodeHash)
    .first();

  return result ?? null;
}

export async function getDefaultMember(DB, preferredMemberId = 'alex') {
  const preferred = await DB.prepare(
    `select id, slug, display_name, accent_key
     from members
     where id = ? and is_active = 1`
  )
    .bind(preferredMemberId)
    .first();

  if (preferred) {
    return preferred;
  }

  const fallback = await DB.prepare(
    `select id, slug, display_name, accent_key
     from members
     where is_active = 1
     order by created_at asc
     limit 1`
  ).first();

  return fallback ?? null;
}

export async function createSessionRecord(DB, memberId, tokenHash, ttlHours = 168) {
  const id = randomId();
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString();

  await DB.prepare(
    `insert into sessions (id, member_id, token_hash, created_at, expires_at, last_seen_at)
     values (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, memberId, tokenHash, createdAt, expiresAt, createdAt)
    .run();

  return { id, member_id: memberId, expires_at: expiresAt };
}

export async function getSessionByTokenHash(DB, tokenHash) {
  const result = await DB.prepare(
    `select s.id, s.member_id, s.expires_at, s.revoked_at, m.display_name, m.accent_key
     from sessions s
     join members m on m.id = s.member_id
     where s.token_hash = ?`
  )
    .bind(tokenHash)
    .first();

  return result ?? null;
}

export async function revokeSession(DB, tokenHash) {
  await DB.prepare(`update sessions set revoked_at = ? where token_hash = ?`)
    .bind(nowIso(), tokenHash)
    .run();
}

export async function listActivities(DB) {
  const result = await DB.prepare(
    `select a.id, a.title, a.activity_type, a.activity_date, a.location, a.created_at,
            m.display_name as created_by_name
     from activities a
     join members m on m.id = a.created_by_member_id
     order by a.created_at desc
     limit 20`
  ).all();

  return result.results ?? [];
}

export async function getActivityById(DB, activityId) {
  const activity = await DB.prepare(
    `select a.*, m.display_name as created_by_name
     from activities a
     join members m on m.id = a.created_by_member_id
     where a.id = ?`
  )
    .bind(activityId)
    .first();

  if (!activity) {
    return null;
  }

  const comments = await DB.prepare(
    `select c.id, c.body, c.created_at, m.display_name as member_name
     from comments c
     join members m on m.id = c.member_id
     where c.activity_id = ?
     order by c.created_at asc`
  )
    .bind(activityId)
    .all();

  const attachments = await DB.prepare(
    `select id, original_filename, mime_type, byte_size, attachment_kind, created_at
     from attachments
     where activity_id = ?
     order by created_at asc`
  )
    .bind(activityId)
    .all();

  const scores = await DB.prepare(
    `select s.id, s.member_id, s.score_delta, s.rank_order, s.is_winner, m.display_name as member_name
     from activity_scores s
     join members m on m.id = s.member_id
     where s.activity_id = ?
     order by s.rank_order asc, s.id asc`
  )
    .bind(activityId)
    .all();

  const settlements = await DB.prepare(
    `select st.id, st.amount, st.note,
            st.from_member_id, st.to_member_id,
            mf.display_name as from_member_name,
            mt.display_name as to_member_name
     from activity_settlements st
     left join members mf on mf.id = st.from_member_id
     left join members mt on mt.id = st.to_member_id
     where st.activity_id = ?
     order by st.id asc`
  )
    .bind(activityId)
    .all();

  return {
    activity,
    scores: scores.results ?? [],
    settlements: settlements.results ?? [],
    comments: comments.results ?? [],
    attachments: attachments.results ?? []
  };
}

export async function createActivityGraph(DB, payload, memberId) {
  const activityId = randomId();
  const timestamp = nowIso();

  await DB.batch([
    DB.prepare(
      `insert into activities
      (id, title, activity_type, activity_date, location, notes, created_by_member_id, created_at, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      activityId,
      payload.title,
      payload.activity_type,
      payload.activity_date,
      payload.location,
      payload.notes || '',
      memberId,
      timestamp,
      timestamp
    ),
    ...(payload.participant_ids || []).map((participantId) =>
      DB.prepare(
        `insert into activity_participants (activity_id, member_id) values (?, ?)`
      ).bind(activityId, participantId)
    ),
    ...(payload.scores || []).map((score) =>
      DB.prepare(
        `insert into activity_scores (id, activity_id, member_id, score_delta, rank_order, is_winner)
         values (?, ?, ?, ?, ?, ?)`
      ).bind(randomId(), activityId, score.member_id, score.score_delta, score.rank_order, score.is_winner ? 1 : 0)
    ),
    ...(payload.settlements || []).map((settlement) =>
      DB.prepare(
        `insert into activity_settlements (id, activity_id, from_member_id, to_member_id, amount, note)
         values (?, ?, ?, ?, ?, ?)`
      ).bind(
        randomId(),
        activityId,
        settlement.from_member_id || null,
        settlement.to_member_id || null,
        settlement.amount,
        settlement.note || ''
      )
    )
  ]);

  return { id: activityId };
}

export async function createCommentRecord(DB, activityId, memberId, body) {
  const id = randomId();
  const createdAt = nowIso();

  await DB.prepare(
    `insert into comments (id, activity_id, member_id, body, created_at)
     values (?, ?, ?, ?, ?)`
  )
    .bind(id, activityId, memberId, body, createdAt)
    .run();

  return { id, activity_id: activityId, member_id: memberId, body, created_at: createdAt };
}

export async function createAttachmentRecord(DB, payload) {
  const id = randomId();
  const createdAt = nowIso();

  await DB.prepare(
    `insert into attachments
     (id, activity_id, uploaded_by_member_id, r2_object_key, original_filename, mime_type, byte_size, attachment_kind, created_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      id,
      payload.activity_id,
      payload.uploaded_by_member_id,
      payload.r2_object_key,
      payload.original_filename,
      payload.mime_type,
      payload.byte_size,
      payload.attachment_kind,
      createdAt
    )
    .run();

  return { id, created_at: createdAt };
}

export async function getAttachmentById(DB, attachmentId) {
  const result = await DB.prepare(
    `select * from attachments where id = ?`
  )
    .bind(attachmentId)
    .first();

  return result ?? null;
}
