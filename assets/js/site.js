import { fallbackMembers, fallbackTypes } from './data.js';

const SESSION_KEY = 'friendcircle_session_token';
const DEFAULT_DETAIL_ID = 'latest';

const TEXT = {
  navHome: '首页',
  navStats: '统计',
  navRecord: '记录',
  navDetail: '详情',
  unknownMember: '友圈成员',
  pending: '待补充',
  noActivities: '还没有活动记录',
  firstRecordHint: '等你创建第一条记录',
  requestFailed: '请求失败',
  saveInProgress: '正在保存记录...',
  saveSuccess: '记录已保存，所有成员刷新后都能看到',
  saveFailed: '保存失败，请稍后再试',
  commentSuccess: '评论已提交，刷新后可见',
  commentFailed: '评论提交失败',
  attachmentsDisabled: '当前先不开启附件功能，文字记录和评论仍可正常使用',
  noDetail: '当前还没有可查看的活动',
  noScores: '暂无得分数据',
  noSettlements: '暂无结算数据',
  attachmentPhoto: '照片',
  attachmentFile: '附件',
  createdBy: '发起人'
};

const TYPE_ICONS = {
  麻将: 'grid_view',
  扑克: 'style',
  桌游: 'casino',
  电玩: 'sports_esports',
  自定义: 'edit'
};

let currentSessionMember = null;

export function resolveApiBase(config = globalThis.FRIENDCIRCLE_CONFIG ?? {}, runtime = globalThis) {
  const mergedConfig = {
    ...(runtime?.FRIENDCIRCLE_CONFIG ?? {}),
    ...(config ?? {})
  };
  const value = typeof mergedConfig?.apiBase === 'string' ? mergedConfig.apiBase.trim() : '';
  if (!value) {
    const hostname = runtime?.location?.hostname || '';
    const localValue = typeof mergedConfig?.localApiBase === 'string' ? mergedConfig.localApiBase.trim() : '';
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && localValue) {
      return localValue.endsWith('/') ? localValue.slice(0, -1) : localValue;
    }

    return '';
  }

  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function getApiBase() {
  return resolveApiBase(globalThis.FRIENDCIRCLE_CONFIG ?? {});
}

export const API_BASE = getApiBase();

function hasDom() {
  return typeof document !== 'undefined';
}

function buildApiUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${getApiBase()}${path}`;
}

function messageOrFallback(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function balanceClass(value) {
  if (Number(value) > 0) {
    return 'balance-positive';
  }

  if (Number(value) < 0) {
    return 'balance-negative';
  }

  return 'balance-neutral';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function memberDisplayName(member) {
  return member?.display_name || member?.name || member?.member_name || TEXT.unknownMember;
}

function memberInitial(member) {
  return memberDisplayName(member).slice(0, 1).toUpperCase();
}

function accentKeyFor(memberOrName, fallback = 'blue') {
  if (typeof memberOrName === 'object' && memberOrName) {
    return memberOrName.accent_key || memberOrName.accent || fallback;
  }

  const normalized = String(memberOrName || '').toLowerCase();
  return fallbackMembers.find((member) => member.display_name.toLowerCase() === normalized || member.id === normalized)?.accent_key || fallback;
}

function avatarMarkup(memberOrName, extraClass = '') {
  const member =
    typeof memberOrName === 'object'
      ? memberOrName
      : fallbackMembers.find((item) => item.display_name === memberOrName || item.id === String(memberOrName).toLowerCase()) ?? {
          display_name: memberOrName
        };
  const accentKey = accentKeyFor(member);
  return `<span class="avatar avatar--${escapeHtml(accentKey)} ${escapeHtml(extraClass)}">${escapeHtml(memberInitial(member))}</span>`;
}

function activityIcon(activity) {
  return TYPE_ICONS[activity?.activity_type] || TYPE_ICONS[activity?.title] || 'view_comfy_alt';
}

export function getStoredSessionToken() {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(SESSION_KEY);
}

export function storeSessionToken(token) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, token);
  }
}

export function clearStoredSessionToken() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function getNavigationType(runtime = globalThis) {
  const navigationEntry = runtime?.performance?.getEntriesByType?.('navigation')?.[0];
  if (typeof navigationEntry?.type === 'string' && navigationEntry.type) {
    return navigationEntry.type;
  }

  return '';
}

export function shouldClearSessionOnReload(runtime = globalThis) {
  return getNavigationType(runtime) === 'reload';
}

export function getNavItems() {
  return [
    { href: 'index.html', label: TEXT.navHome, key: 'home', icon: 'home' },
    { href: 'stats.html', label: TEXT.navStats, key: 'stats', icon: 'leaderboard' },
    { href: 'record.html', label: TEXT.navRecord, key: 'record', icon: 'add_circle' },
    { href: 'detail.html', label: TEXT.navDetail, key: 'detail', icon: 'receipt_long' }
  ];
}

export function formatCurrency(value) {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount).toFixed(2);
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}$${absolute}`;
}

export function renderAvatarGroup(members) {
  const visibleMembers = members.slice(0, 3);
  const chips = visibleMembers
    .map((member) => {
      const isCurrent = currentSessionMember?.id && currentSessionMember.id === member.id;
      const suffix = isCurrent ? '（你）' : '';
      return `
        <div class="participant-chip">
          ${avatarMarkup(member)}
          <span>${escapeHtml(memberDisplayName(member))}${suffix}</span>
        </div>
      `;
    })
    .join('');

  return `
    ${chips}
    <div class="participant-chip participant-chip--add">
      <span class="avatar"><span class="material-symbols-outlined">add</span></span>
      <span>添加</span>
    </div>
  `;
}

export function renderBottomNav(currentPage) {
  return `
    <nav class="bottom-nav" aria-label="Page navigation">
      ${getNavItems()
        .map(
          (item) => `
            <a class="nav-link${item.key === currentPage ? ' is-active' : ''}" href="${item.href}">
              <span class="material-symbols-outlined">${escapeHtml(item.icon)}</span>
              <span>${escapeHtml(item.label)}</span>
            </a>
          `
        )
        .join('')}
    </nav>
  `;
}

export function renderActivityCards(activities) {
  if (!activities.length) {
    return `
      <article class="activity-card">
        <div class="activity-main">
          <span class="activity-icon"><span class="material-symbols-outlined">add_circle</span></span>
          <div>
            <h3>${TEXT.noActivities}</h3>
            <p>${TEXT.firstRecordHint}</p>
          </div>
        </div>
      </article>
    `;
  }

  return activities
    .map((activity, index) => {
      const title = escapeHtml(activity.title || TEXT.noActivities);
      const dateText = escapeHtml(activity.activity_date || activity.date || (index === 0 ? '昨天' : TEXT.pending));
      const location = escapeHtml(activity.location || TEXT.pending);
      const memberCount = Array.isArray(activity.participants) ? activity.participants.length : activity.players || 4;
      const winner = activity.winner || activity.created_by_name || activity.created_by || fallbackMembers[index % fallbackMembers.length].display_name;
      const metricLabel = activity.pot ? '总奖池' : index % 2 === 0 ? '总奖池' : '时长';
      const metricValue = activity.pot ? `$${Number(activity.pot).toFixed(2)}` : index % 2 === 0 ? '$120.00' : escapeHtml(activity.duration || '2.5 小时');
      const href = `detail.html?activity=${encodeURIComponent(activity.id || DEFAULT_DETAIL_ID)}`;

      return `
        <a class="activity-card" href="${href}">
          <div class="activity-main">
            <span class="activity-icon">
              <span class="material-symbols-outlined">${escapeHtml(activityIcon(activity))}</span>
            </span>
            <div>
              <h3>${title}</h3>
              <p>${dateText} · ${memberCount} 人 · ${location}</p>
            </div>
          </div>
          <hr />
          <div class="activity-meta-row">
            <span class="winner-chip">
              获胜者
              ${avatarMarkup(winner)}
            </span>
            <span class="activity-value">
              <span>${metricLabel}</span>
              <strong>${metricValue}</strong>
            </span>
          </div>
        </a>
      `;
    })
    .join('');
}

function getAuthHeaders() {
  const token = getStoredSessionToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

export async function fetchJson(path, init = {}) {
  const headers = new Headers(init.headers || {});
  Object.entries(getAuthHeaders()).forEach(([key, value]) => headers.set(key, value));

  if (init.body && !headers.has('content-type') && !(init.body instanceof FormData)) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === 'string' ? payload : payload?.error?.message || TEXT.requestFailed);
  }

  return payload;
}

export async function loginWithPasscode(passcode) {
  const payload = await fetchJson('/api/session/login', {
    method: 'POST',
    body: JSON.stringify({ passcode })
  });

  if (payload?.data?.sessionToken) {
    storeSessionToken(payload.data.sessionToken);
  }

  return payload?.data ?? null;
}

export async function loadSessionMember() {
  const token = getStoredSessionToken();
  if (!token) {
    return null;
  }

  try {
    const payload = await fetchJson('/api/session/me');
    return payload?.data?.member ?? null;
  } catch {
    clearStoredSessionToken();
    return null;
  }
}

export async function logoutCurrentMember() {
  try {
    await fetchJson('/api/session/logout', { method: 'POST' });
  } finally {
    clearStoredSessionToken();
  }
}

export async function loadActivities() {
  const payload = await fetchJson('/api/activities');
  return payload?.data?.activities ?? [];
}

export async function loadActivityDetail(activityId) {
  const payload = await fetchJson(`/api/activities/${activityId}`);
  return payload?.data ?? null;
}

export async function submitComment(activityId, body) {
  const payload = await fetchJson(`/api/activities/${activityId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body })
  });

  return payload?.data ?? null;
}

export async function submitActivity(activityInput) {
  const payload = await fetchJson('/api/activities', {
    method: 'POST',
    body: JSON.stringify(activityInput)
  });

  return payload?.data ?? null;
}

export async function uploadAttachment(activityId, file) {
  const formData = new FormData();
  formData.append('attachment', file);
  formData.append('attachment_kind', file.type.startsWith('image/') ? 'photo' : 'file');

  const payload = await fetchJson(`/api/activities/${activityId}/attachments`, {
    method: 'POST',
    body: formData
  });

  return payload?.data ?? null;
}

function isAttachmentFeatureDisabled(error) {
  return error instanceof Error && /attachments?_disabled|附件/.test(error.message);
}

export function getAttachmentUrl(id) {
  return buildApiUrl(`/api/attachments/${id}`);
}

function mountBottomNav(page) {
  const navTarget = document.querySelector('#bottom-nav');
  if (navTarget) {
    navTarget.innerHTML = renderBottomNav(page);
  }
}

function setInlineMessage(target, message, tone = 'info') {
  if (target) {
    target.textContent = message;
    target.dataset.tone = tone;
  }
}

function setMemberIdentity(member) {
  currentSessionMember = member;
  const targets = document.querySelectorAll('[data-member-name]');
  targets.forEach((target) => {
    target.textContent = target.classList.contains('avatar') ? memberInitial(member) : memberDisplayName(member);
  });
}

function renderMembers(members = fallbackMembers) {
  return members
    .map((member, index) => {
      const name = memberDisplayName(member);
      const isCurrent = currentSessionMember?.id && currentSessionMember.id === member.id;
      const displayName = `${name}${isCurrent ? ' (You)' : ''}`;
      const balance = formatCurrency(member.balance || 0);
      const winRate = member.winRate ?? 50 - index * 5;
      const trophy = index === 0 ? '<span class="material-symbols-outlined">emoji_events</span>' : '';

      return `
        <article class="member-card">
          <div class="member-avatar-wrap">
            ${avatarMarkup(member)}
            ${trophy ? `<span class="member-trophy">${trophy}</span>` : ''}
          </div>
          <h3>${escapeHtml(displayName)}</h3>
          <strong class="member-balance ${balanceClass(member.balance || 0)}">${balance}</strong>
          <span class="member-rate">${escapeHtml(`${winRate}% 胜率`)}</span>
        </article>
      `;
    })
    .join('');
}

function renderStatsSummary(activities) {
  const total = activities.length;
  const latest = activities[0];
  return {
    total,
    latestTitle: latest?.title || TEXT.noActivities,
    latestLocation: latest?.location || TEXT.firstRecordHint
  };
}

function renderBars(members = fallbackMembers) {
  return members
    .map((member, index) => {
      const percent = Number(member.winRate ?? 68 - index * 10);
      const height = Math.max(22, Math.min(92, percent));
      const fillClass = `bar-fill--${member.accent_key || 'blue'}`;

      return `
        <div class="bar-item">
          <div class="bar-shell">
            <div class="bar-fill ${fillClass}" style="height:${height}%"></div>
          </div>
          ${avatarMarkup(member)}
        </div>
      `;
    })
    .join('');
}

function renderLeaderboard(members = fallbackMembers) {
  return [...members]
    .sort((a, b) => Number(b.winRate || 0) - Number(a.winRate || 0))
    .map((member, index) => {
      const rowClass = index === 0 ? 'rank-row is-winner' : 'rank-row';
      const score = Number(member.winRate ?? 0);

      return `
        <li class="${rowClass}">
          <span class="rank-number">${index + 1}</span>
          ${avatarMarkup(member)}
          <span>
            <strong>${escapeHtml(memberDisplayName(member))}</strong>
            <span>${score}% Win Rate</span>
          </span>
        </li>
      `;
    })
    .join('');
}

function renderComments(comments = []) {
  if (!comments.length) {
    return `
      <article class="comment-card">
        ${avatarMarkup('Alex')}
        <div class="comment-bubble">
          <strong>Alex</strong>
          <p>I demand a rematch next week. The dice were clearly rigged!</p>
        </div>
      </article>
      <article class="comment-card">
        ${avatarMarkup('Sarah')}
        <div class="comment-bubble">
          <strong>Sarah</strong>
          <p>下次继续，我负责订零食。</p>
        </div>
      </article>
    `;
  }

  return comments
    .map((comment) => {
      const name = comment.member_name || comment.author || TEXT.unknownMember;
      return `
        <article class="comment-card">
          ${avatarMarkup(name)}
          <div class="comment-bubble">
            <strong>${escapeHtml(name)}</strong>
            <p>${escapeHtml(comment.body)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderAttachments(attachments = []) {
  if (!attachments.length) {
    return `
      <div class="memory-tile"></div>
      <div class="memory-tile"></div>
    `;
  }

  return attachments
    .map((attachment) => {
      const isPhoto = attachment.attachment_kind === 'photo';
      const label = isPhoto ? TEXT.attachmentPhoto : TEXT.attachmentFile;
      const fileName = escapeHtml(attachment.original_filename || label);

      if (isPhoto) {
        return `
          <a class="memory-tile" href="${getAttachmentUrl(attachment.id)}" target="_blank" rel="noreferrer">
            <img src="${getAttachmentUrl(attachment.id)}" alt="${fileName}" />
          </a>
        `;
      }

      return `
        <a class="attachment-card" href="${getAttachmentUrl(attachment.id)}" target="_blank" rel="noreferrer">
          <strong>${fileName}</strong>
          <span>${label}</span>
        </a>
      `;
    })
    .join('');
}

export function renderScoreRows(scores = []) {
  if (!scores.length) {
    return `
      <div class="score-row detail-score__row">
        <span class="score-person">
          ${avatarMarkup('Alex')}
          <strong>${TEXT.noScores}</strong>
        </span>
        <strong class="balance-neutral">$0.00</strong>
      </div>
    `;
  }

  return scores
    .map((score) => {
      const isWinner = Number(score.is_winner) === 1 || score.is_winner === true;
      const rowClass = isWinner ? 'score-row detail-score__row is-winner detail-score__row--winner' : 'score-row detail-score__row';
      const name = score.member_name || score.display_name || score.member_id || TEXT.unknownMember;
      const amount = Number(score.score_delta || 0);

      return `
        <div class="${rowClass}">
          <span class="score-person">
            ${avatarMarkup(name)}
            <span>
              <strong>${escapeHtml(name)}</strong>
              ${isWinner ? '<span>获胜者</span>' : ''}
            </span>
          </span>
          <strong class="${balanceClass(amount)}">${formatCurrency(amount)}</strong>
        </div>
      `;
    })
    .join('');
}

export function renderSettlementCards(settlements = []) {
  if (!settlements.length) {
    return `
      <article class="settlement-card">
        <div class="settlement-people">
          ${avatarMarkup('Mike')}
          <span class="settlement-arrow">一次</span>
          ${avatarMarkup('Maya')}
        </div>
        <div>
          <strong class="balance-negative">$45.00</strong>
          <p>晚餐 + 饮料</p>
        </div>
      </article>
      <article class="settlement-card">
        <div class="settlement-people">
          ${avatarMarkup('Sarah')}
          <span class="settlement-arrow">一次</span>
          ${avatarMarkup('Alex')}
        </div>
        <div>
          <strong class="balance-positive">+$12.50</strong>
          <p>麻将买入</p>
        </div>
      </article>
    `;
  }

  return settlements
    .map((settlement) => {
      const fromName = settlement.from_member_name || settlement.from_member_id || TEXT.unknownMember;
      const toName = settlement.to_member_name || settlement.to_member_id || TEXT.unknownMember;
      const note = settlement.note || `${fromName} → ${toName}`;
      const amount = Number(settlement.amount || 0);

      return `
        <article class="settlement-card">
          <div class="settlement-people">
            ${avatarMarkup(fromName)}
            <span class="settlement-arrow">一次</span>
            ${avatarMarkup(toName)}
            <span class="sr-only">${escapeHtml(fromName)} → ${escapeHtml(toName)}</span>
          </div>
          <div>
            <strong class="${balanceClass(amount)}">${formatCurrency(amount)}</strong>
            <p>${escapeHtml(note)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

async function loadHomePage() {
  const memberGrid = document.querySelector('[data-render="members"]');
  const activityGrid = document.querySelector('[data-render="activities"]');
  const activities = await loadActivities();

  if (memberGrid) {
    memberGrid.innerHTML = renderMembers();
  }

  if (activityGrid) {
    activityGrid.innerHTML = renderActivityCards(activities);
  }
}

async function loadStatsPage() {
  const activities = await loadActivities();
  const summary = renderStatsSummary(activities);
  const bars = document.querySelector('[data-render="bars"]');
  const leaderboard = document.querySelector('[data-render="leaderboard"]');
  const settlements = document.querySelector('[data-render="settlements"]');
  const summaryTargets = document.querySelectorAll('[data-render="stats-summary"]');
  let detail = null;

  try {
    if (activities[0]?.id) {
      detail = await loadActivityDetail(activities[0].id);
    }
  } catch {
    detail = null;
  }

  if (bars) {
    bars.innerHTML = renderBars();
  }

  if (leaderboard) {
    leaderboard.innerHTML = renderLeaderboard();
  }

  if (settlements) {
    settlements.innerHTML = renderSettlementCards(detail?.settlements || []);
  }

  summaryTargets.forEach((target) => {
    target.textContent = `已同步 ${summary.total} 场活动`;
  });
}

function collectRecordFormState(form) {
  const formData = new FormData(form);
  const selectedType = String(formData.get('activity_type') || fallbackTypes[0]);
  const title = String(formData.get('title') || `周末${selectedType}局`);
  const location = String(formData.get('location') || TEXT.pending);
  const notes = String(formData.get('notes') || '');
  const activityDate = String(formData.get('activity_date') || new Date().toISOString().slice(0, 10));
  const participantIds = fallbackMembers.map((member) => member.id);

  return {
    title,
    activity_type: selectedType,
    activity_date: activityDate,
    location,
    notes,
    participant_ids: participantIds,
    scores: fallbackMembers.map((member, index) => ({
      member_id: member.id,
      score_delta: index === 0 ? 80 : -20,
      rank_order: index + 1,
      is_winner: index === 0
    })),
    settlements: []
  };
}

function renderTypeOptions() {
  return fallbackTypes
    .map(
      (type, index) => `
        <button class="type-option${index === 0 ? ' is-active' : ''}" type="button" data-activity-type="${escapeHtml(type)}">
          <span class="type-icon"><span class="material-symbols-outlined">${escapeHtml(TYPE_ICONS[type] || 'edit')}</span></span>
          <span>${escapeHtml(type)}</span>
        </button>
      `
    )
    .join('');
}

function bindTypeOptions() {
  const typeInput = document.querySelector('[data-activity-type-input]');
  const titleInput = document.querySelector('[name="title"]');
  const options = document.querySelectorAll('[data-activity-type]');

  options.forEach((option) => {
    option.addEventListener('click', () => {
      options.forEach((item) => item.classList.remove('is-active'));
      option.classList.add('is-active');
      const nextType = option.dataset.activityType || fallbackTypes[0];
      if (typeInput) {
        typeInput.value = nextType;
      }
      if (titleInput) {
        titleInput.value = `周末${nextType}局`;
      }
    });
  });
}

async function loadRecordPage() {
  const avatarRow = document.querySelector('[data-render="avatars"]');
  if (avatarRow) {
    avatarRow.innerHTML = renderAvatarGroup(fallbackMembers);
  }

  const typeOptions = document.querySelector('[data-render="type-options"]');
  if (typeOptions) {
    typeOptions.innerHTML = renderTypeOptions();
    bindTypeOptions();
  }

  const dateInput = document.querySelector('[name="activity_date"]');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  const form = document.querySelector('[data-record-form]');
  const message = document.querySelector('[data-record-message]');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setInlineMessage(message, TEXT.saveInProgress);

    try {
      const created = await submitActivity(collectRecordFormState(form));
      const fileInput = form.querySelector('input[type="file"]');
      const activityId = created?.activity?.id;

      if (fileInput?.files?.length && activityId) {
        for (const file of fileInput.files) {
          await uploadAttachment(activityId, file);
        }
      }

      setInlineMessage(message, TEXT.saveSuccess, 'success');
    } catch (error) {
      if (isAttachmentFeatureDisabled(error)) {
        setInlineMessage(message, `${TEXT.saveSuccess} ${TEXT.attachmentsDisabled}`, 'success');
        return;
      }

      setInlineMessage(message, messageOrFallback(error, TEXT.saveFailed), 'error');
    }
  });
}

async function resolveRequestedActivityId(rawActivityId) {
  if (rawActivityId && rawActivityId !== DEFAULT_DETAIL_ID) {
    return rawActivityId;
  }

  const activities = await loadActivities();
  return activities[0]?.id ?? null;
}

async function loadDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedActivityId = params.get('activity') || DEFAULT_DETAIL_ID;
  const scoresTarget = document.querySelector('[data-render="scores"]');
  const settlementsTarget = document.querySelector('[data-render="settlements"]');
  const commentsTarget = document.querySelector('[data-render="comments"]');
  const attachmentsTarget = document.querySelector('[data-render="attachments"]');
  const titleTarget = document.querySelector('[data-render="activity-title"]');
  const metaTarget = document.querySelector('[data-render="activity-meta"]');

  let resolvedActivityId = null;
  let detail = null;

  try {
    resolvedActivityId = await resolveRequestedActivityId(requestedActivityId);
    if (resolvedActivityId) {
      detail = await loadActivityDetail(resolvedActivityId);
    }
  } catch {
    detail = null;
  }

  if (titleTarget) {
    titleTarget.textContent = detail?.activity?.title || TEXT.noDetail;
  }

  if (metaTarget) {
    const dateText = detail?.activity?.activity_date || '';
    const locationText = detail?.activity?.location || TEXT.firstRecordHint;
    metaTarget.textContent = dateText ? `${dateText} · ${locationText}` : locationText;
  }

  if (scoresTarget) {
    scoresTarget.innerHTML = renderScoreRows(detail?.scores || []);
  }

  if (settlementsTarget) {
    settlementsTarget.innerHTML = renderSettlementCards(detail?.settlements || []);
  }

  if (commentsTarget) {
    commentsTarget.innerHTML = renderComments(detail?.comments || []);
  }

  if (attachmentsTarget) {
    attachmentsTarget.innerHTML = renderAttachments(detail?.attachments || []);
  }

  const form = document.querySelector('[data-comment-form]');
  const input = document.querySelector('[name="comment_body"]');
  const message = document.querySelector('[data-comment-message]');

  if (!form || !input || !resolvedActivityId) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const body = input.value.trim();
    if (!body) {
      return;
    }

    try {
      await submitComment(resolvedActivityId, body);
      setInlineMessage(message, TEXT.commentSuccess, 'success');
      input.value = '';

      const refreshed = await loadActivityDetail(resolvedActivityId);
      if (commentsTarget) {
        commentsTarget.innerHTML = renderComments(refreshed?.comments || []);
      }
    } catch (error) {
      setInlineMessage(message, messageOrFallback(error, TEXT.commentFailed), 'error');
    }
  });
}

async function loadActivePage(page) {
  if (page === 'home') {
    await loadHomePage();
    return;
  }

  if (page === 'stats') {
    await loadStatsPage();
    return;
  }

  if (page === 'record') {
    await loadRecordPage();
    return;
  }

  if (page === 'detail') {
    await loadDetailPage();
  }
}

async function bootstrapPage() {
  if (!hasDom()) {
    return;
  }

  const page = document.body.dataset.page;
  mountBottomNav(page);
  const member = (await loadSessionMember()) || fallbackMembers[0];
  setMemberIdentity(member);
  await loadActivePage(page);
}

if (hasDom()) {
  document.addEventListener('DOMContentLoaded', () => {
    void bootstrapPage();
  });
}
