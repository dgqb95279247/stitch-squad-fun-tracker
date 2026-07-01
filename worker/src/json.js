export function jsonOk(data, init = {}) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}

export function jsonError(code, message, status = 400, init = {}) {
  return new Response(JSON.stringify({ ok: false, error: { code, message } }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init.headers ?? {})
    }
  });
}
