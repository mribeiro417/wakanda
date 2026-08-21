// Worker único: serve os arquivos estáticos de /public (via binding ASSETS)
// e responde a API /api/state (GET/POST) usando o banco D1 como armazenamento
// compartilhado do estado da guild.

const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB de limite de segurança

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/state') {
      if (request.method === 'GET') return handleGet(env);
      if (request.method === 'POST') return handlePost(request, env);
      return new Response('Method not allowed', { status: 405 });
    }

    // Qualquer outra rota vira arquivo estático (public/index.html etc.)
    return env.ASSETS.fetch(request);
  }
};

async function handleGet(env) {
  try {
    const row = await env.DB
      .prepare('SELECT data FROM app_state WHERE id = 1')
      .first();

    const body = row ? row.data : 'null';
    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'db_read_failed', message: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePost(request, env) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ ok: false, error: 'payload_too_large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const now = new Date().toISOString();

  try {
    await env.DB
      .prepare(
        `INSERT INTO app_state (id, data, updated_at) VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
      )
      .bind(JSON.stringify(parsed), now)
      .run();

    return new Response(JSON.stringify({ ok: true, updated_at: now }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'db_write_failed', message: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
