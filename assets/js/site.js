import { fallbackMembers, fallbackTypes } from './data.js';

const SESSION_KEY = 'friendcircle_session_token';
const DEFAULT_DETAIL_ID = 'latest';

const TEXT = {
  navHome: '\u9996\u9875',
  navStats: '\u7edf\u8ba1',
  navRecord: '\u8bb0\u5f55',
  navDetail: '\u8be6\u60c5',
  unknownMember: '\u53cb\u5708\u6210\u5458',
  pending: '\u5f85\u8865\u5145',
  noActivities: '\u8fd8\u6ca1\u6709\u8bb0\u5f55',
  firstRecordHint: '\u7b49\u4f60\u521b\u5efa\u7b2c\u4e00\u6761\u8bb0\u5f55',
  requestFailed: '\u8bf7\u6c42\u5931\u8d25',
  invalidPasscode: '\u53e3\u4ee4\u65e0\u6548\uff0c\u8bf7\u91cd\u8bd5',
  loginInProgress: '\u6b63\u5728\u8bc6\u522b\u8eab\u4efd...',
  loginSuccess: '\u5df2\u6210\u529f\u8fdb\u5165\u53cb\u5708',
  loginPrompt: '\u8f93\u5165\u4f60\u7684\u4e13\u5c5e\u53e3\u4ee4\u540e\u5373\u53ef\u8fdb\u5165',
  saveInProgress: '\u6b63\u5728\u4fdd\u5b58\u8bb0\u5f55...',
  saveSuccess: '\u8bb0\u5f55\u5df2\u4fdd\u5b58\uff0c\u5237\u65b0\u540e\u6240\u6709\u4eba\u90fd\u80fd\u770b\u5230',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5',
  commentSuccess: '\u8bc4\u8bba\u5df2\u63d0\u4ea4\uff0c\u5237\u65b0\u540e\u53ef\u89c1',
  commentFailed: '\u8bc4\u8bba\u63d0\u4ea4\u5931\u8d25',
  attachmentsDisabled: '\u5f53\u524d\u5148\u4e0d\u5f00\u542f\u9644\u4ef6\u529f\u80fd\uff0c\u6587\u5b57\u8bb0\u5f55\u548c\u8bc4\u8bba\u4ecd\u53ef\u6b63\u5e38\u4f7f\u7528',
  noDetail: '\u5f53\u524d\u8fd8\u6ca1\u6709\u53ef\u67e5\u770b\u7684\u6d3b\u52a8',
  noScores: '\u6682\u65e0\u5f97\u5206\u6570\u636e',
  noSettlements: '\u6682\u65e0\u7ed3\u7b97\u6570\u636e',
  attachmentPhoto: '\u7167\u7247',
  attachmentFile: '\u9644\u4ef6',
  createdBy: '\u53d1\u8d77\u4eba'
};

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

function getAccentClass(accentKey) {
  return `avatar-chip avatar-chip--${accentKey ?? 'blue'}`;
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
    { href: 'index.html', label: TEXT.navHome, key: 'home' },
    { href: 'stats.html', label: TEXT.navStats, key: 'stats' },
    { href: 'record.html', label: TEXT.navRecord, key: 'record' },
    { href: 'detail.html', label: TEXT.navDetail, key: 'detail' }
  ];
}

export function formatCurrency(value) {
  const amount = Number(value || 0);
  const absolute = Math.abs(amount).toFixed(2);
  const sign = amount > 0 ? '+' : amount < 0 ? '-' : '';
  return `${sign}$${absolute}`;
}

export function renderAvatarGroup(members) {
  return members
    .map((member) => {
      const accentKey = member.accent_key || member.accent || 'blue';
      return `<span class="${getAccentClass(accentKey)}">${escapeHtml(memberDisplayName(member))}</span>`;
    })
    .join('');
}

export function renderBottomNav(currentPage) {
  return `
    <nav class="bottom-nav" aria-label="Page navigation">
      ${getNavItems()
        .map(
          (item) => `
            <a class="nav-link${item.key === currentPage ? ' is-active' : ''}" href="${item.href}">
              <span>${escapeHtml(item.label)}</span>
            </a>
          `
        )
        .join('')}
    </nav>
  `;
}

export function renderActivityCards(activities) {
  return activities
    .map((activity) => {
      const icon = escapeHtml(activity.icon || activity.activity_type?.slice(0, 1) || '\u5c40');
      const title = escapeHtml(activity.title || TEXT.noActivities);
      const dateText = escapeHtml(activity.activity_date || activity.date || TEXT.pending);
      const location = escapeHtml(activity.location || TEXT.pending);
      const memberCount = Array.isArray(activity.participants) ? activity.participants.length : activity.players || 0;
      const createdBy = escapeHtml(activity.created_by_name || activity.winner || TEXT.unknownMember);
      const metaRight = activity.pot ? `$${Number(activity.pot).toFixed(2)}` : escapeHtml(activity.duration || TEXT.pending);

      return `
        <article class="activity-card">
          <div class="activity-card__top">
            <div class="activity-icon">${icon}</div>
            <div>
              <h3>${title}</h3>
              <p>${dateText} · ${memberCount} · ${location}</p>
            </div>
          </div>
          <div class="activity-card__bottom">
            <span>${TEXT.createdBy} ${createdBy}</span>
            <a href="detail.html?activity=${encodeURIComponent(activity.id || DEFAULT_DETAIL_ID)}">${TEXT.navDetail}</a>
            <strong>${metaRight}</strong>
          </div>
        </article>
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
  return error instanceof Error && /attachments?_disabled|\u9644\u4ef6/.test(error.message);
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

function setAuthMessage(message, tone = 'info') {
  const target = document.querySelector('[data-auth-message]');
  if (target) {
    target.textContent = message;
    target.dataset.tone = tone;
  }
}

function setInlineMessage(target, message, tone = 'info') {
  if (target) {
    target.textContent = message;
    target.dataset.tone = tone;
  }
}

function hideAuthGate() {
  const gate = document.querySelector('[data-auth-gate]');
  if (gate) {
    gate.setAttribute('hidden', 'hidden');
  }
}

function showAuthGate() {
  const gate = document.querySelector('[data-auth-gate]');
  if (gate) {
    gate.removeAttribute('hidden');
  }
}

function setMemberIdentity(member) {
  const targets = document.querySelectorAll('[data-member-name]');
  targets.forEach((target) => {
    target.textContent = memberDisplayName(member);
  });
}

function bindLogoutAction() {
  const triggers = document.querySelectorAll('[data-logout]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', async (event) => {
      event.preventDefault();
      await logoutCurrentMember();
      showAuthGate();
      setAuthMessage(TEXT.loginPrompt);
      window.location.href = 'index.html';
    });
  });
}

function renderMembers(members = fallbackMembers) {
  return members
    .map((member) => {
      const name = memberDisplayName(member);
      const accentKey = member.accent_key || member.accent || 'blue';
      const balance = formatCurrency(member.balance || 0);
      const winRate = member.winRate ?? 0;

      return `
        <article class="member-card">
          <div class="member-card__badge member-card__badge--${accentKey}">\u53cb\u5708\u6210\u5458</div>
          <div class="member-card__avatar ${getAccentClass(accentKey)}">${escapeHtml(name.slice(0, 1))}</div>
          <h3>${escapeHtml(name)}</h3>
          <p class="member-role">${escapeHtml(member.role || '\u6210\u5458')}</p>
          <strong class="balance-neutral">${balance}</strong>
          <span>${escapeHtml(`${winRate}% \u80dc\u7387`)}</span>
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

function renderComments(comments = []) {
  if (!comments.length) {
    return `
      <article class="comment-card">
        <span class="comment-author">${TEXT.unknownMember}</span>
        <p>${TEXT.noDetail}</p>
      </article>
    `;
  }

  return comments
    .map(
      (comment) => `
        <article class="comment-card">
          <span class="comment-author">${escapeHtml(comment.member_name || comment.author || TEXT.unknownMember)}</span>
          <p>${escapeHtml(comment.body)}</p>
        </article>
      `
    )
    .join('');
}

function renderAttachments(attachments = []) {
  if (!attachments.length) {
    return `
      <article class="attachment-card">
        <strong>${TEXT.attachmentFile}</strong>
        <p>${TEXT.noDetail}</p>
      </article>
    `;
  }

  return attachments
    .map(
      (attachment) => `
        <article class="attachment-card">
          <strong>${escapeHtml(attachment.original_filename)}</strong>
          <p>${escapeHtml(attachment.attachment_kind === 'photo' ? TEXT.attachmentPhoto : TEXT.attachmentFile)} · ${Number(
            attachment.byte_size || 0
          )} bytes</p>
          <a class="text-link" href="${getAttachmentUrl(attachment.id)}" target="_blank" rel="noreferrer">\u6253\u5f00</a>
        </article>
      `
    )
    .join('');
}

export function renderScoreRows(scores = []) {
  if (!scores.length) {
    return `
      <div class="detail-score__row">
        <strong>${TEXT.noScores}</strong>
        <span class="balance-neutral">$0.00</span>
      </div>
    `;
  }

  return scores
    .map((score) => {
      const winnerClass = Number(score.is_winner) === 1 || score.is_winner === true ? ' detail-score__row--winner' : '';
      const name = escapeHtml(score.member_name || score.display_name || score.member_id || TEXT.unknownMember);
      const amount = Number(score.score_delta || 0);

      return `
        <div class="detail-score__row${winnerClass}">
          <strong>${name}</strong>
          <span class="${balanceClass(amount)}">${formatCurrency(amount)}</span>
        </div>
      `;
    })
    .join('');
}

export function renderSettlementCards(settlements = []) {
  if (!settlements.length) {
    return `
      <article class="settlement-card">
        <div>
          <h3>${TEXT.noSettlements}</h3>
          <p>${TEXT.firstRecordHint}</p>
        </div>
        <strong class="balance-neutral">$0.00</strong>
      </article>
    `;
  }

  return settlements
    .map((settlement) => {
      const fromName = escapeHtml(settlement.from_member_name || settlement.from_member_id || TEXT.unknownMember);
      const toName = escapeHtml(settlement.to_member_name || settlement.to_member_id || TEXT.unknownMember);
      const note = escapeHtml(settlement.note || `${fromName} → ${toName}`);
      const amount = Number(settlement.amount || 0);

      return `
        <article class="settlement-card">
          <div>
            <h3>${fromName} → ${toName}</h3>
            <p>${note}</p>
          </div>
          <strong class="${balanceClass(amount)}">${formatCurrency(amount)}</strong>
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
  const summaryTarget = document.querySelector('[data-render="stats-summary"]');

  if (bars) {
    bars.innerHTML = fallbackMembers
      .map(
        (member, index) => `
          <div class="bar-card">
            <span>${escapeHtml(member.display_name)}</span>
            <div class="bar-shell">
              <div class="bar-fill bar-fill--${member.accent_key}" style="height:${68 - index * 9}%"></div>
            </div>
            <strong>${68 - index * 9}%</strong>
          </div>
        `
      )
      .join('');
  }

  if (leaderboard) {
    leaderboard.innerHTML = fallbackMembers
      .map(
        (member, index) => `
          <li class="leaderboard-row${index === 0 ? ' leaderboard-row--highlight' : ''}">
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-name">${escapeHtml(member.display_name)}</span>
            <span class="leaderboard-score">${68 - index * 9}%</span>
          </li>
        `
      )
      .join('');
  }

  if (settlements) {
    settlements.innerHTML = `
      <article class="settlement-card">
        <div>
          <h3>${escapeHtml(summary.latestTitle)}</h3>
          <p>${escapeHtml(summary.latestLocation)}</p>
        </div>
        <strong class="balance-positive">${summary.total}</strong>
      </article>
    `;
  }

  if (summaryTarget) {
    summaryTarget.textContent = `\u5df2\u540c\u6b65 ${summary.total} \u573a\u6d3b\u52a8`;
  }
}

function collectRecordFormState(form) {
  const formData = new FormData(form);
  const selectedType = String(formData.get('activity_type') || fallbackTypes[0]);
  const title = String(formData.get('title') || `${selectedType} \u805a\u4f1a`);
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

async function loadRecordPage() {
  const avatarRow = document.querySelector('[data-render="avatars"]');
  if (avatarRow) {
    avatarRow.innerHTML = renderAvatarGroup(fallbackMembers);
  }

  const typeSelect = document.querySelector('[name="activity_type"]');
  if (typeSelect && typeSelect.children.length === 0) {
    typeSelect.innerHTML = fallbackTypes.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
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
  if (shouldClearSessionOnReload()) {
    clearStoredSessionToken();
  }
  mountBottomNav(page);
  bindLogoutAction();
  showAuthGate();

  const authForm = document.querySelector('[data-auth-form]');
  if (authForm) {
    authForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(authForm);
      const passcode = String(formData.get('passcode') || '').trim();
      setAuthMessage(TEXT.loginInProgress);

      try {
        const data = await loginWithPasscode(passcode);
        hideAuthGate();
        setMemberIdentity(data?.member);
        await loadActivePage(page);
        setAuthMessage(TEXT.loginSuccess, 'success');
      } catch (error) {
        setAuthMessage(messageOrFallback(error, TEXT.invalidPasscode), 'error');
      }
    });
  }

  const member = await loadSessionMember();
  if (!member) {
    setAuthMessage(TEXT.loginPrompt);
    return;
  }

  hideAuthGate();
  setMemberIdentity(member);
  await loadActivePage(page);
}

if (hasDom()) {
  document.addEventListener('DOMContentLoaded', () => {
    void bootstrapPage();
  });
}
