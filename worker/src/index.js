import { getAllowedOrigins, getRequiredEnv } from './env.js';
import { jsonError, jsonOk } from './json.js';
import {
  createAttachmentRecord,
  createActivityGraph,
  createCommentRecord,
  createSessionRecord,
  findMemberByPasscodeHash,
  getActivityById,
  getAttachmentById,
  getDefaultMember,
  getSessionByTokenHash,
  listActivities,
  revokeSession
} from './db/queries.js';
import { createSessionToken, hashPasscode, hashSessionToken } from './session.js';
import { putAttachmentObject, streamAttachmentObject } from './storage.js';

function attachmentsEnabled(envConfig) {
  return Boolean(envConfig.ATTACHMENTS);
}

function withCorsHeaders(request, response, env) {
  const origin = request.headers.get('origin');
  const headers = new Headers(response.headers);
  const allowedOrigins = getAllowedOrigins(env);

  if (origin && allowedOrigins.includes(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'origin');
  }

  headers.set('access-control-allow-headers', 'content-type, authorization');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function getBearerToken(request) {
  const value = request.headers.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : null;
}

async function requireSession(request, envConfig) {
  const token = getBearerToken(request);
  if (!token) {
    throw new Error('缺少会话令牌');
  }

  const tokenHash = await hashSessionToken(token, envConfig.SESSION_SECRET);
  const session = await getSessionByTokenHash(envConfig.DB, tokenHash);

  if (!session || session.revoked_at || new Date(session.expires_at).getTime() < Date.now()) {
    throw new Error('会话已失效，请重新输入口令');
  }

  return {
    member: {
      id: session.member_id,
      display_name: session.display_name,
      accent_key: session.accent_key
    },
    tokenHash
  };
}

async function getOptionalSession(request, envConfig) {
  const token = getBearerToken(request);
  if (!token) {
    return null;
  }

  try {
    return await requireSession(request, envConfig);
  } catch {
    return null;
  }
}

async function getPublicWriteMember(request, envConfig) {
  const session = await getOptionalSession(request, envConfig);
  if (session?.member) {
    return session.member;
  }

  const member = await getDefaultMember(envConfig.DB);
  if (!member) {
    throw new Error('没有可用的默认成员');
  }

  return member;
}

function buildAttachmentKey(activityId, attachmentKind, filename) {
  const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const bucketFolder = attachmentKind === 'photo' ? 'photos' : 'files';
  return `activities/${activityId}/${bucketFolder}/${crypto.randomUUID()}-${safeName}`;
}

async function handleLogin(request, envConfig) {
  const payload = await request.json();
  const passcode = String(payload?.passcode || '').trim();

  if (!passcode) {
    return jsonError('invalid_passcode', '请输入个人口令', 400);
  }

  const passcodeHash = await hashPasscode(passcode, envConfig.SESSION_SECRET);
  const member = await findMemberByPasscodeHash(envConfig.DB, passcodeHash);
  if (!member) {
    return jsonError('invalid_passcode', '口令不正确', 401);
  }

  const sessionToken = createSessionToken();
  const tokenHash = await hashSessionToken(sessionToken, envConfig.SESSION_SECRET);
  await createSessionRecord(envConfig.DB, member.id, tokenHash);

  return jsonOk({ member, sessionToken });
}

async function handleSessionMe(request, envConfig) {
  try {
    const session = await requireSession(request, envConfig);
    return jsonOk({ member: session.member });
  } catch (error) {
    return jsonError('unauthorized', error.message, 401);
  }
}

async function handleSessionLogout(request, envConfig) {
  const token = getBearerToken(request);
  if (token) {
    const tokenHash = await hashSessionToken(token, envConfig.SESSION_SECRET);
    await revokeSession(envConfig.DB, tokenHash);
  }

  return jsonOk({ revoked: true });
}

async function handleListActivities(envConfig) {
  const activities = await listActivities(envConfig.DB);
  return jsonOk({ activities });
}

async function handleGetActivity(envConfig, activityId) {
  const detail = await getActivityById(envConfig.DB, activityId);
  if (!detail) {
    return jsonError('not_found', '未找到该活动', 404);
  }

  return jsonOk(detail);
}

async function handleCreateActivity(request, envConfig) {
  try {
    const member = await getPublicWriteMember(request, envConfig);
    const payload = await request.json();
    const activity = await createActivityGraph(envConfig.DB, payload, member.id);
    return jsonOk({ activity }, { status: 201 });
  } catch (error) {
    return jsonError('create_activity_failed', error.message, 500);
  }
}

async function handleCreateComment(request, envConfig, activityId) {
  try {
    const member = await getPublicWriteMember(request, envConfig);
    const payload = await request.json();
    const body = String(payload?.body || '').trim();

    if (!body) {
      return jsonError('invalid_comment', '评论内容不能为空', 400);
    }

    const comment = await createCommentRecord(envConfig.DB, activityId, member.id, body);
    return jsonOk({ comment }, { status: 201 });
  } catch (error) {
    return jsonError('create_comment_failed', error.message, 500);
  }
}

async function handleCreateAttachment(request, envConfig, activityId) {
  if (!attachmentsEnabled(envConfig)) {
    return jsonError('attachments_disabled', '当前站点暂未开启附件上传功能', 503);
  }

  try {
    const session = await requireSession(request, envConfig);
    const form = await request.formData();
    const file = form.get('attachment');
    const attachmentKind = String(form.get('attachment_kind') || 'file');

    if (!(file instanceof File)) {
      return jsonError('invalid_upload', '未检测到可上传文件', 400);
    }

    const objectKey = buildAttachmentKey(activityId, attachmentKind, file.name);
    await putAttachmentObject(envConfig.ATTACHMENTS, objectKey, file);
    const attachment = await createAttachmentRecord(envConfig.DB, {
      activity_id: activityId,
      uploaded_by_member_id: session.member.id,
      r2_object_key: objectKey,
      original_filename: file.name,
      mime_type: file.type || 'application/octet-stream',
      byte_size: file.size,
      attachment_kind: attachmentKind
    });

    return jsonOk({ attachment }, { status: 201 });
  } catch (error) {
    return jsonError('unauthorized', error.message, 401);
  }
}

async function handleGetAttachment(request, envConfig, attachmentId) {
  if (!attachmentsEnabled(envConfig)) {
    return jsonError('attachments_disabled', '当前站点暂未开启附件读取功能', 404);
  }

  try {
    await requireSession(request, envConfig);
    const attachment = await getAttachmentById(envConfig.DB, attachmentId);

    if (!attachment) {
      return jsonError('not_found', '附件不存在', 404);
    }

    const object = await streamAttachmentObject(envConfig.ATTACHMENTS, attachment.r2_object_key);
    if (!object) {
      return jsonError('not_found', '附件文件不存在', 404);
    }

    return new Response(object.body, {
      headers: {
        'content-type': attachment.mime_type,
        'content-disposition': `inline; filename="${attachment.original_filename}"`
      }
    });
  } catch (error) {
    return jsonError('unauthorized', error.message, 401);
  }
}

export default {
  async fetch(request, env) {
    const envConfig = getRequiredEnv(env);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return withCorsHeaders(request, new Response(null, { status: 204 }), envConfig);
    }

    let response;

    if (url.pathname === '/api/health') {
      response = jsonOk({ service: 'friendcircle-api' });
      return withCorsHeaders(request, response, envConfig);
    }

    if (url.pathname === '/api/session/login' && request.method === 'POST') {
      response = await handleLogin(request, envConfig);
      return withCorsHeaders(request, response, envConfig);
    }

    if (url.pathname === '/api/session/me' && request.method === 'GET') {
      response = await handleSessionMe(request, envConfig);
      return withCorsHeaders(request, response, envConfig);
    }

    if (url.pathname === '/api/session/logout' && request.method === 'POST') {
      response = await handleSessionLogout(request, envConfig);
      return withCorsHeaders(request, response, envConfig);
    }

    if (url.pathname === '/api/activities' && request.method === 'GET') {
      response = await handleListActivities(envConfig);
      return withCorsHeaders(request, response, envConfig);
    }

    if (url.pathname === '/api/activities' && request.method === 'POST') {
      response = await handleCreateActivity(request, envConfig);
      return withCorsHeaders(request, response, envConfig);
    }

    const commentMatch = url.pathname.match(/^\/api\/activities\/([^/]+)\/comments$/);
    if (commentMatch && request.method === 'POST') {
      response = await handleCreateComment(request, envConfig, commentMatch[1]);
      return withCorsHeaders(request, response, envConfig);
    }

    const attachmentUploadMatch = url.pathname.match(/^\/api\/activities\/([^/]+)\/attachments$/);
    if (attachmentUploadMatch && request.method === 'POST') {
      response = await handleCreateAttachment(request, envConfig, attachmentUploadMatch[1]);
      return withCorsHeaders(request, response, envConfig);
    }

    const attachmentReadMatch = url.pathname.match(/^\/api\/attachments\/([^/]+)$/);
    if (attachmentReadMatch && request.method === 'GET') {
      response = await handleGetAttachment(request, envConfig, attachmentReadMatch[1]);
      return withCorsHeaders(request, response, envConfig);
    }

    const activityMatch = url.pathname.match(/^\/api\/activities\/([^/]+)$/);
    if (activityMatch && request.method === 'GET') {
      response = await handleGetActivity(envConfig, activityMatch[1]);
      return withCorsHeaders(request, response, envConfig);
    }

    response = jsonError('not_found', 'Route not found', 404);
    return withCorsHeaders(request, response, envConfig);
  }
};
