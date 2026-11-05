import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createResearch, transition, validateQuestions, evaluatePairedPersonaConditioning, evaluateQuestionPerturbation, evaluateRunReproducibility } from '../domain.mjs';
import { openStore } from '../store.mjs';
import { createApp } from '../server.mjs';
import { generateWithPlan } from '../plan.mjs';

const problem = 'Новые клиенты прекращают оформление заказа после выбора доставки.';
const audience = 'Новые покупатели, которым важна скорость оформления заказа.';
const next = (s, action, payload) => transition(s, action, payload);

function approvedStudy() {
  let s = createResearch(problem, audience);
  s = next(s, 'propose-tasks');
  s = next(s, 'confirm-tasks', { items: s.taskProposal });
  s = next(s, 'propose-segments');
  s = next(s, 'confirm-segments', { items: s.segmentProposal });
  s = next(s, 'propose-personas');
  s = next(s, 'confirm-personas', { items: s.personaProposal });
  return s;
}

function firstRun() {
  let s = approvedStudy();
  s = next(s, 'propose-questions');
  s = next(s, 'validate-questions');
  s = next(s, 'run', { sampleSize: 12, seed: 'fixture' });
  return s;
}

test('approval gates reject skips and preserve approved stages', () => {
  let s = createResearch(problem, audience);
  assert.throws(() => next(s, 'propose-segments'), /подтвердите.*задачи/i);
  s = next(s, 'propose-tasks');
  assert.throws(() => next(s, 'confirm-tasks', { items: [] }), /Задачи/);
  s = next(s, 'confirm-tasks', { items: s.taskProposal });
  assert.equal(s.tasks.length, 3);
  assert.throws(() => next(s, 'propose-personas'), /подтвердите сегменты/i);
});

test('formal validation blocks invalid questions and warns about ambiguity', () => {
  const taskIds = ['task-1', 'task-2'];
  const invalid = validateQuestions([{ id: 'q1', taskId: 'task-1', text: 'Коротко', options: ['Да', 'Да'] }], taskIds);
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /вариантов|различных/);
  const s = next(approvedStudy(), 'propose-questions');
  assert.throws(() => next(s, 'run', { sampleSize: 12 }), /формальную проверку/);
  const checked = next(s, 'validate-questions');
  assert.equal(checked.questionnaires[0].validation.valid, true);
  assert.ok(checked.questionnaires[0].validation.warnings.length);
});

test('persona profiles affect answers with the same question and seed', () => {
  let high = approvedStudy();
  high.personas = high.personas.map(p => ({ ...p, exposure: 'high' }));
  high = next(next(high, 'propose-questions'), 'validate-questions');
  high = next(high, 'run', { sampleSize: 60, seed: 'same' });
  let low = approvedStudy();
  low.personas = low.personas.map(p => ({ ...p, exposure: 'low' }));
  low = next(next(low, 'propose-questions'), 'validate-questions');
  low = next(low, 'run', { sampleSize: 60, seed: 'same' });
  assert.notDeepEqual(high.runs[0].summary[0].counts, low.runs[0].summary[0].counts);
  assert.ok(high.runs[0].answers.every(a => a.personaId && a.segmentId && a.questionnaireVersion === 1));
  assert.equal(high.runs[0].summary[0].counts.Часто > low.runs[0].summary[0].counts.Часто, true);
});

test('paired persona conditioning produces a provenance-rich evaluation result', () => {
  let s = approvedStudy();
  const segmentId = s.segments[0].id;
  s.personas = [
    { id: 'persona-fast', segmentId, name: 'Fast persona', description: 'Prioritizes speed', exposure: 'high', priority: 'speed' },
    { id: 'persona-careful', segmentId, name: 'Careful persona', description: 'Prioritizes careful review', exposure: 'high', priority: 'careful' }
  ];
  s = next(next(s, 'propose-questions'), 'validate-questions');
  s = next(s, 'run', { sampleSize: 60, seed: 'exp-001-fixed' });
  const result = evaluatePairedPersonaConditioning(s, {
    personaIds: ['persona-fast', 'persona-careful'],
    questionId: 'q2',
    expectedOptionByPersona: {
      'persona-fast': 'Быстро',
      'persona-careful': 'Тщательно'
    }
  });
  assert.equal(result.experimentId, 'EXP-001');
  assert.equal(result.status, 'pass');
  assert.equal(result.fixture.seed, 'exp-001-fixed');
  assert.equal(result.fixture.questionnaireVersion, 1);
  assert.equal(result.comparisons.length, 2);
  assert.ok(result.maxShareGap >= 0.2);
  assert.ok(result.comparisons.every(item => item.sampleSize > 0));
  assert.match(result.limitations[0], /не устанавливает соответствие ответов реальным людям/);
  assert.deepEqual(evaluatePairedPersonaConditioning(s, {
    personaIds: ['persona-fast', 'persona-careful'], questionId: 'q2',
    expectedOptionByPersona: { 'persona-fast': 'Быстро', 'persona-careful': 'Тщательно' }
  }), result);
});

test('question perturbation compares controlled runs and records option deltas', () => {
  const build = reorder => {
    let s = approvedStudy();
    s = next(next(s, 'propose-questions'), 'validate-questions');
    if (reorder) {
      const questions = structuredClone(s.questionnaires[0].questions);
      questions[1].options = [...questions[1].options].reverse();
      s.questionnaires[0].questions = questions;
      s = next(s, 'validate-questions');
    }
    return next(s, 'run', { sampleSize: 60, seed: 'exp-002-fixed' });
  };
  const baseline = build(false);
  const perturbed = build(true);
  const result = evaluateQuestionPerturbation({
    baselineStudy: baseline,
    perturbedStudy: perturbed,
    questionId: 'q2',
    perturbation: { type: 'option-order', description: 'Reversed q2 answer options' }
  });
  assert.equal(result.experimentId, 'EXP-002');
  assert.equal(result.status, 'diagnostic');
  assert.equal(result.perturbation.type, 'option-order');
  assert.equal(result.baseline.seed, 'exp-002-fixed');
  assert.equal(result.perturbed.seed, 'exp-002-fixed');
  assert.equal(result.baseline.sampleSize, result.perturbed.sampleSize);
  assert.ok(result.changed);
  assert.ok(result.changedOptions.length > 0);
  assert.match(result.limitations[1], /human fidelity/);
});

test('repeatability comparison distinguishes exact replay from changed seed', () => {
  const build = seed => {
    let s = approvedStudy();
    s = next(next(s, 'propose-questions'), 'validate-questions');
    return next(s, 'run', { sampleSize: 60, seed });
  };
  const baseline = build('exp-003-fixed');
  const repeat = build('exp-003-fixed');
  const replay = evaluateRunReproducibility({ baselineStudy: baseline, repeatStudy: repeat });
  assert.equal(replay.experimentId, 'EXP-003');
  assert.equal(replay.comparison, 'exact-replay');
  assert.equal(replay.status, 'pass');
  assert.equal(replay.answersEqual, true);
  assert.equal(replay.summaryEqual, true);
  assert.equal(replay.provenanceComplete, true);
  const changed = evaluateRunReproducibility({ baselineStudy: baseline, repeatStudy: build('exp-003-changed') });
  assert.equal(changed.comparison, 'changed-factor');
  assert.equal(changed.status, 'changed-factor');
  assert.equal(changed.baseline.seed, 'exp-003-fixed');
  assert.equal(changed.repeat.seed, 'exp-003-changed');
});

test('audience description changes proposed profile and answers', () => {
  const build = description => {
    let s = createResearch(problem, description);
    s = next(s, 'propose-tasks'); s = next(s, 'confirm-tasks', { items: s.taskProposal });
    s = next(s, 'propose-segments'); s = next(s, 'confirm-segments', { items: s.segmentProposal });
    s = next(s, 'propose-personas'); s = next(s, 'confirm-personas', { items: s.personaProposal });
    s = next(next(s, 'propose-questions'), 'validate-questions');
    return next(s, 'run', { sampleSize: 60, seed: 'same-audience-fixture' });
  };
  const fast = build('Покупатели хотят быстро оформить заказ без ожидания.');
  const careful = build('Покупатели хотят тщательно проверить условия доставки.');
  assert.equal(fast.personas[0].priority, 'speed');
  assert.equal(careful.personas[0].priority, 'careful');
  assert.notDeepEqual(fast.runs[0].answers.filter(a => a.personaId === 'persona-1-a' && a.questionId === 'q2').map(a => a.value),
    careful.runs[0].answers.filter(a => a.personaId === 'persona-1-a' && a.questionId === 'q2').map(a => a.value));
});

test('ChatGPT mode requires validated model output and keeps answer provenance', async () => {
  let s = createResearch(problem, audience, 'chatgpt');
  assert.throws(() => next(s, 'propose-tasks'), /Задачи/);
  const model = 'test-model';
  const generatedTasks = { items: [1, 2, 3].map(n => ({ id: `task-${n}`, title: `Уточнить поведение новых покупателей ${n}` })) };
  const mock = { async streamResponse({ model: requested, input }) {
    assert.equal(requested, model);
    assert.match(input, /Новые покупатели/);
    return { text: JSON.stringify(generatedTasks) };
  } };
  const fromModel = await generateWithPlan(mock, model, 'propose-tasks', s);
  s = next(s, 'propose-tasks', { generated: fromModel, model });
  s = next(s, 'confirm-tasks', { items: s.taskProposal });
  const segments = { items: [
    { id: 'segment-frequent', name: 'Частые покупатели', rationale: 'Регулярно оформляют заказ', exposure: 'high' },
    { id: 'segment-occasional', name: 'Редкие покупатели', rationale: 'Редко оформляют заказ', exposure: 'low' }
  ] };
  s = next(s, 'propose-segments', { generated: segments, model });
  s = next(s, 'confirm-segments', { items: s.segmentProposal });
  const personas = { items: s.segments.flatMap((segment, i) => ['a', 'b'].map((suffix, j) => ({
    id: `persona-${i + 1}-${suffix}`, segmentId: segment.id, name: `Покупатель ${i}-${j}`,
    description: 'Ценит скорость оформления', exposure: segment.exposure, priority: j ? 'careful' : 'speed'
  }))) };
  s = next(s, 'propose-personas', { generated: personas, model });
  s = next(s, 'confirm-personas', { items: s.personaProposal });
  const questions = { questions: s.tasks.map((task, i) => ({ id: `q${i + 1}`, taskId: task.id, kind: 'custom',
    text: `Какое решение вы выберете в ситуации ${i + 1}?`, options: ['Первый вариант', 'Второй вариант'] })) };
  s = next(s, 'propose-questions', { generated: questions, model });
  s = next(s, 'validate-questions');
  const answers = Array.from({ length: 12 }, (_, index) => {
    const persona = s.personas[index % s.personas.length];
    return s.questionnaires[0].questions.map(q => ({ respondent: index + 1, personaId: persona.id,
      questionId: q.id, value: persona.priority === 'speed' ? q.options[0] : q.options[1] }));
  }).flat();
  assert.throws(() => next(s, 'run', { sampleSize: 12, model, generated: { answers: answers.slice(1) } }), /неполный/);
  s = next(s, 'run', { sampleSize: 12, model, generated: { answers } });
  assert.equal(s.runs[0].method, 'chatgpt-plan:test-model');
  assert.equal(s.runs[0].answers.length, 36);
  assert.ok(s.runs[0].answers.every(answer => answer.personaId && answer.segmentId && answer.questionnaireVersion === 1));
  s = next(s, 'interview');
  const revised = structuredClone(s.questionnaires[0].questions);
  revised[1].text = 'Какая причина повлияла на ваш выбор варианта решения?';
  s = next(s, 'revise-questions', { questions: revised });
  s = next(s, 'validate-questions');
  s = next(s, 'run', { sampleSize: 12, model, generated: { answers } });
  s = next(s, 'screen-caricature');
  s = next(s, 'build-report');
  assert.match(s.report.limitations[0], /моделью ChatGPT/);
});

test('probe, revision, rerun, screening and report preserve provenance', () => {
  let s = firstRun();
  const originalRun = structuredClone(s.runs[0]);
  const originalForm = structuredClone(s.questionnaires[0]);
  s = next(s, 'interview');
  assert.equal(s.interview.type, 'synthetic-persona-post-run-probe');
  assert.ok(s.interview.findings.some(f => f.questionId === 'q2'));
  assert.ok(s.interview.entries.every(e => e.questionText && e.probe && e.answer && e.interpretation.includes(e.answer)));
  const revised = structuredClone(s.questionnaires[0].questions);
  revised[1].text = `Как вы решаете ситуацию: ${problem}`;
  s = next(s, 'revise-questions', { questions: revised });
  assert.equal(s.interview.disposition, 'reviewed-and-revised');
  s = next(s, 'validate-questions');
  s = next(s, 'run', { sampleSize: 12, seed: 'fixture-2' });
  assert.deepEqual(s.runs[0], originalRun);
  assert.deepEqual(s.questionnaires[0], originalForm);
  assert.equal(s.runs[1].questionnaireVersion, 2);
  s = next(s, 'screen-caricature');
  s = next(s, 'build-report');
  assert.deepEqual(s.report.runIds, ['run-1', 'run-2']);
  assert.deepEqual(s.report.questionnaireVersions, [1, 2]);
  assert.equal(s.report.status, 'synthetic-exploratory');
  assert.ok(s.report.limitations.some(x => x.includes('синтетическими')));
  for (const run of s.runs) for (const question of s.questionnaires[run.questionnaireVersion - 1].questions)
    assert.equal(Object.values(run.summary.find(x => x.questionId === question.id).counts).reduce((a, b) => a + b, 0), run.sampleSize);
});

test('invalid revision can be corrected before the rerun', () => {
  let s = next(firstRun(), 'interview');
  const revised = structuredClone(s.questionnaires[0].questions);
  revised[1].text = 'Новый вопрос';
  revised[1].options = ['Да', 'Да'];
  s = next(s, 'revise-questions', { questions: revised });
  s = next(s, 'validate-questions');
  assert.equal(s.questionnaires[1].validation.valid, false);
  assert.throws(() => next(s, 'run', { sampleSize: 12 }), /формальную проверку/);
  revised[1].options = ['Да', 'Нет'];
  s = next(s, 'update-questions', { questions: revised });
  s = next(s, 'validate-questions');
  assert.equal(s.questionnaires[1].validation.valid, true);
  s = next(s, 'run', { sampleSize: 12, seed: 'corrected' });
  assert.equal(s.runs.length, 2);
});

test('SQLite records survive reopening the store', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ssl-store-'));
  try {
    const path = join(dir, 'db.sqlite');
    const s = firstRun();
    let store = openStore(path);
    store.create(s);
    store.close();
    store = openStore(path);
    assert.deepEqual(store.get(s.id), s);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('HTTP Golden Path and restart serve the complete browser-backed record', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ssl-http-'));
  const path = join(dir, 'db.sqlite');
  let app;
  try {
    app = createApp({ dbPath: path, mode: 'rules' });
    let base = await app.listen();
    const page = await fetch(base);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Synthetic Survey Lab/);
    const asset = await fetch(`${base}/app.js`);
    assert.equal(asset.status, 200);
    assert.match(await asset.text(), /Подтвердить персоны/);
    const post = async (url, data) => { const response = await fetch(`${base}${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }); return { status: response.status, value: await response.json() }; };
    let { value: s } = await post('/api/research', { problem, audienceDescription: audience });
    const id = s.id;
    let skipped = await post(`/api/research/${id}/actions`, { revision: s.revision, action: 'propose-segments' });
    assert.equal(skipped.status, 400);
    const act = async (action, payload) => { const result = await post(`/api/research/${id}/actions`, { revision: s.revision, action, payload }); assert.equal(result.status, 200, JSON.stringify(result.value)); s = result.value; };
    await act('propose-tasks'); await act('confirm-tasks', { items: s.taskProposal });
    await act('propose-segments'); await act('confirm-segments', { items: s.segmentProposal });
    await act('propose-personas'); await act('confirm-personas', { items: s.personaProposal });
    await act('propose-questions'); await act('validate-questions');
    await act('run', { sampleSize: 12, seed: 'http-fixture' }); await act('interview');
    const revised = structuredClone(s.questionnaires[0].questions);
    revised[1].text = `Как вы решаете ситуацию: ${problem}`;
    await act('revise-questions', { questions: revised }); await act('validate-questions');
    await act('run', { sampleSize: 12, seed: 'http-fixture-2' }); await act('screen-caricature'); await act('build-report');
    const report = structuredClone(s.report);
    await app.close(); app = null;
    app = createApp({ dbPath: path, mode: 'rules' }); base = await app.listen();
    const reopened = await (await fetch(`${base}/api/research/${id}`)).json();
    assert.deepEqual(reopened.report, report);
    assert.equal(reopened.runs.length, 2);
    assert.equal(reopened.personas.length, 4);
    assert.equal(reopened.events.filter(x => x.type.endsWith('_confirmed')).length, 3);
    await app.close(); app = null;
  } finally { if (app) await app.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('HTTP ChatGPT connection and proposal use the selected plan model', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ssl-plan-'));
  const calls = [];
  const fakePlan = {
    async status() { return { session: { status: 'connected', sharing: true }, models: [{ slug: 'test-model', displayName: 'Test' }] }; },
    async beginSignIn() { return 'https://auth.openai.com/mock'; },
    async cancelSignIn() { return { session: { status: 'disconnected', sharing: false }, models: [] }; },
    async selectModel(model) { assert.equal(model, 'test-model'); return model; },
    client: { async streamResponse(request) { calls.push(request); return { text: JSON.stringify({ items: [1, 2, 3].map(n =>
      ({ id: `task-${n}`, title: `Изучить поведение покупателей ${n}` })) }) }; } }
  };
  const app = createApp({ dbPath: join(dir, 'db.sqlite'), mode: 'chatgpt', planClient: fakePlan });
  try {
    const base = await app.listen();
    const status = await (await fetch(`${base}/api/ai/status`)).json();
    assert.equal(status.session.sharing, true);
    const login = await fetch(`${base}/api/ai/connect`, { redirect: 'manual' });
    assert.equal(login.status, 302);
    assert.equal(login.headers.get('location'), 'https://auth.openai.com/mock');
    const cancelled = await fetch(`${base}/api/ai/cancel`, { method: 'POST' });
    assert.equal((await cancelled.json()).session.status, 'disconnected');
    const create = await fetch(`${base}/api/research`, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ problem, audienceDescription: audience }) });
    let study = await create.json();
    assert.equal(study.mode, 'chatgpt');
    const proposal = await fetch(`${base}/api/research/${study.id}/actions`, { method: 'POST',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ revision: study.revision,
        action: 'propose-tasks', model: 'test-model' }) });
    study = await proposal.json();
    assert.equal(proposal.status, 200, JSON.stringify(study));
    assert.equal(study.taskProposal.length, 3);
    assert.equal(study.events.at(-1).model, 'test-model');
    assert.equal(calls.length, 1);
  } finally { await app.close(); rmSync(dir, { recursive: true, force: true }); }
});
