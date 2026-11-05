import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createResearch, transition, DomainError } from './domain.mjs';
import { openStore } from './store.mjs';
import { createPlanClient } from './chatgpt-plan.mjs';
import { generateWithPlan } from './plan.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8']
};

function json(res, status, value) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff' });
  res.end(JSON.stringify(value));
}

async function body(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 65536) throw new DomainError('Запрос слишком велик.', 413);
  }
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw new DomainError('Ожидается корректный JSON.'); }
}

const generativeActions = new Set(['propose-tasks', 'propose-segments', 'propose-personas', 'propose-questions', 'run']);

export function createApp({ dbPath = join(here, '.data', 'research.sqlite'), mode = process.env.SSL_MODE || 'chatgpt',
  planClient } = {}) {
  if (!['rules', 'chatgpt'].includes(mode)) throw new Error('SSL_MODE must be rules or chatgpt.');
  const store = openStore(dbPath);
  const plan = mode === 'chatgpt' ? (planClient || createPlanClient()) : null;
  const server = createServer(async (req, res) => {
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && assets[path]) {
        const [file, mime] = assets[path];
        const content = await readFile(join(here, 'public', file));
        res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-store',
          'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'",
          'x-content-type-options': 'nosniff' });
        res.end(content); return;
      }
      if (req.method === 'GET' && path === '/api/ai/status')
        return json(res, 200, mode === 'chatgpt' ? { mode, ...(await plan.status()) } : { mode, session: null, models: [] });
      if (req.method === 'GET' && path === '/api/ai/connect' && plan) {
        const location = await plan.beginSignIn();
        res.writeHead(302, { location, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' });
        res.end(); return;
      }
      if (req.method === 'POST' && path === '/api/ai/cancel' && plan)
        return json(res, 200, { mode, ...(await plan.cancelSignIn()) });
      if (req.method === 'GET' && path === '/api/research') return json(res, 200, store.list());
      if (req.method === 'POST' && path === '/api/research') {
        const input = await body(req);
        return json(res, 201, store.create(createResearch(input.problem, input.audienceDescription, mode)));
      }
      const match = /^\/api\/research\/([a-f0-9-]+)(?:\/actions)?$/.exec(path);
      if (match) {
        const study = store.get(match[1]);
        if (!study) return json(res, 404, { error: 'Исследование не найдено.' });
        if (req.method === 'GET' && !path.endsWith('/actions')) return json(res, 200, study);
        if (req.method === 'POST' && path.endsWith('/actions')) {
          const input = await body(req);
          if (input.revision !== study.revision) return json(res, 409, { error: 'Исследование изменилось в другой вкладке. Обновите страницу.' });
          let payload = input.payload || {};
          if (study.mode === 'chatgpt' && generativeActions.has(input.action)) {
            if (!plan) throw new DomainError('Для этого исследования нужен режим ChatGPT.', 503);
            const model = await plan.selectModel(input.model);
            const generated = await generateWithPlan(plan.client, model, input.action, study, payload);
            payload = { ...payload, generated, model };
          }
          const next = transition(study, input.action, payload);
          if (!store.save(next, study.revision)) return json(res, 409, { error: 'Исследование изменилось. Обновите страницу.' });
          return json(res, 200, next);
        }
      }
      json(res, 404, { error: 'Страница не найдена.' });
    } catch (error) {
      json(res, error instanceof DomainError ? error.status : 500,
        { error: error instanceof DomainError ? error.message : 'Внутренняя ошибка сервера.' });
      if (!(error instanceof DomainError)) console.error(error);
    }
  });
  return { server, store, async listen(port = 0) {
    await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}`;
  }, async close() { await new Promise(resolve => server.close(resolve)); store.close(); } };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const app = createApp({ dbPath: process.env.SSL_DB_PATH || join(here, '.data', 'research.sqlite') });
  const address = await app.listen(Number(process.env.PORT || 4173));
  console.log(`Synthetic Survey Lab: ${address}`);
  const shutdown = async () => { await app.close(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
