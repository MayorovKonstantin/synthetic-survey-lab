import { randomUUID } from 'node:crypto';

export class DomainError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

const fail = (message, status) => { throw new DomainError(message, status); };
const clean = (value, max = 500) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';
const need = (condition, message) => { if (!condition) fail(message); };
const clone = value => structuredClone(value);
const event = (study, type, details = {}) => study.events.push({ type, at: new Date().toISOString(), ...details });

function generatedItems(study, payload, label, ids) {
  if (study.mode !== 'chatgpt') return null;
  const items = validateItems(payload?.generated?.items, label, ids.length, ids.length);
  need(items.map(x => x.id).join('|') === ids.join('|'), `${label}: модель вернула неожиданные ID. Повторите действие.`);
  return items;
}

export function createResearch(problem, audienceDescription = '', mode = 'rules') {
  const text = clean(problem, 500);
  need(text.length >= 12, 'Опишите бизнес-проблему минимум в 12 символах.');
  const audience = clean(audienceDescription, 500);
  need(audience.length >= 12, 'Опишите целевую аудиторию минимум в 12 символах.');
  const audienceLabel = audience.replace(/[.!?]+$/, '');
  const audiencePriority = /тщательн|осторожн|провер|качеств/i.test(audience) ? 'careful' :
    /быстр|скорост|оперативн|время/i.test(audience) ? 'speed' : 'unspecified';
  need(['rules', 'chatgpt'].includes(mode), 'Неизвестный режим генерации.');
  const study = { id: randomUUID(), revision: 0, mode, problem: text, audienceDescription: audienceLabel,
    audienceProfile: mode === 'chatgpt' ? { prioritySignal: 'model-proposed', method: 'chatgpt-plan' } :
      { prioritySignal: audiencePriority, method: 'explicit-keyword-rules-v1' }, createdAt: new Date().toISOString(),
    taskProposal: null, tasks: null, segmentProposal: null, segments: null,
    personaProposal: null, personas: null, questionnaires: [], runs: [], interview: null,
    caricature: null, report: null, events: [] };
  event(study, 'research_created');
  return study;
}

function validateItems(items, label, min = 1, max = 6) {
  need(Array.isArray(items) && items.length >= min && items.length <= max, `${label}: ожидается от ${min} до ${max} пунктов.`);
  const ids = new Set();
  for (const item of items) {
    need(item && typeof item.id === 'string' && /^[a-z0-9-]+$/.test(item.id), `${label}: некорректный ID.`);
    need(!ids.has(item.id), `${label}: повторяется ID ${item.id}.`);
    ids.add(item.id);
    need(clean(item.title || item.name || item.text, 300).length >= 3, `${label}: заполните описание каждого пункта.`);
  }
  return clone(items);
}

function proposeTasks(study, payload) {
  need(!study.tasks, 'Задачи уже подтверждены.');
  const p = study.problem;
  study.taskProposal = generatedItems(study, payload, 'Задачи', ['task-1', 'task-2', 'task-3']) || [
    { id: 'task-1', title: `Выяснить, как часто возникает: ${p}` },
    { id: 'task-2', title: `Понять, как люди сейчас решают: ${p}` },
    { id: 'task-3', title: `Определить главные препятствия и критерии решения: ${p}` }
  ];
  event(study, 'tasks_proposed', study.mode === 'chatgpt' ? { model: payload.model } : {});
}

function proposeSegments(study, payload) {
  need(study.tasks, 'Сначала подтвердите исследовательские задачи.');
  need(!study.segments, 'Сегменты уже подтверждены.');
  study.segmentProposal = generatedItems(study, payload, 'Сегменты', ['segment-frequent', 'segment-occasional']) || [
    { id: 'segment-frequent', name: 'Часто сталкиваются с проблемой', rationale: `Аудитория: ${study.audienceDescription}. Контраст по частоте опыта для задачи ${study.tasks[0].id}.`, exposure: 'high' },
    { id: 'segment-occasional', name: 'Сталкиваются эпизодически', rationale: `Аудитория: ${study.audienceDescription}. Контраст по частоте опыта для задачи ${study.tasks[0].id}.`, exposure: 'low' }
  ];
  need(study.segmentProposal[0].exposure === 'high' && study.segmentProposal[1].exposure === 'low', 'Модель вернула некорректные признаки сегментов. Повторите действие.');
  need(study.segmentProposal.every(segment => clean(segment.rationale, 300).length >= 12),
    'Модель не объяснила выбор сегментов. Повторите действие.');
  event(study, 'segments_proposed', study.mode === 'chatgpt' ? { model: payload.model } : {});
}

function proposePersonas(study, payload) {
  need(study.segments, 'Сначала подтвердите сегменты.');
  need(!study.personas, 'Персоны уже подтверждены.');
  const primary = study.audienceProfile.prioritySignal === 'unspecified' ? 'speed' : study.audienceProfile.prioritySignal;
  const contrasting = primary === 'speed' ? 'careful' : 'speed';
  study.personaProposal = generatedItems(study, payload, 'Персоны', ['persona-1-a', 'persona-1-b', 'persona-2-a', 'persona-2-b']) || study.segments.flatMap((segment, index) => [
    { id: `persona-${index + 1}-a`, segmentId: segment.id, name: `${segment.name}: основной профиль`,
      description: `Аудитория: ${study.audienceDescription}. Опыт: ${segment.exposure === 'high' ? 'частый' : 'редкий'}. Приоритет: ${primary === 'speed' ? 'скорость' : 'тщательная проверка'}.`, exposure: segment.exposure, priority: primary },
    { id: `persona-${index + 1}-b`, segmentId: segment.id, name: `${segment.name}: контрастный профиль`,
      description: `Аудитория: ${study.audienceDescription}. Опыт: ${segment.exposure === 'high' ? 'частый' : 'редкий'}. Контрастный приоритет: ${contrasting === 'speed' ? 'скорость' : 'тщательная проверка'}.`, exposure: segment.exposure, priority: contrasting }
  ]);
  for (const [index, persona] of study.personaProposal.entries()) {
    need(persona.segmentId === study.segments[Math.floor(index / 2)]?.id &&
      ['high', 'low'].includes(persona.exposure) && ['speed', 'careful'].includes(persona.priority) &&
      clean(persona.description, 300).length >= 12,
    'Модель вернула некорректный профиль персоны. Повторите действие.');
  }
  event(study, 'personas_proposed', study.mode === 'chatgpt' ? { model: payload.model } : {});
}

function proposeQuestions(study, payload) {
  need(study.personas, 'Сначала подтвердите персоны.');
  need(study.questionnaires.length === 0, 'Анкета уже создана.');
  const problem = study.problem.length > 110 ? `${study.problem.slice(0, 107)}…` : study.problem;
  const questions = study.mode === 'chatgpt' ? payload?.generated?.questions : [
    { id: 'q1', taskId: study.tasks[0].id, kind: 'frequency', text: `Как часто вы сталкиваетесь с ситуацией: «${problem}»?`, options: ['Никогда', 'Иногда', 'Часто'] },
    { id: 'q2', taskId: study.tasks[1]?.id || study.tasks[0].id, kind: 'approach', text: 'Как вы обычно решаете эту проблему?', options: ['Быстро', 'Тщательно', 'Сначала уточняю условия'] },
    { id: 'q3', taskId: study.tasks[2]?.id || study.tasks.at(-1).id, kind: 'barrier', text: `Что больше всего мешает решить: «${problem}»?`, options: ['Время', 'Ресурсы', 'Недостаток информации'] }
  ];
  if (study.mode === 'chatgpt') {
    const check = validateQuestions(questions, study.tasks.map(x => x.id));
    need(check.valid, `Модель вернула анкету с ошибками: ${check.errors.join(' ')} Повторите действие.`);
  }
  study.questionnaires.push({ version: 1, questions, validation: null, createdAt: new Date().toISOString() });
  event(study, 'questionnaire_proposed', study.mode === 'chatgpt' ? { model: payload.model } : {});
}

export function evaluatePairedPersonaConditioning(study, {
  runId = study.runs.at(-1)?.id,
  personaIds,
  questionId,
  expectedOptionByPersona = {},
  minShareGap = 0.2
} = {}) {
  need(study && Array.isArray(study.runs) && study.runs.length > 0, 'Нет завершённого опроса для оценки.');
  const run = study.runs.find(item => item.id === runId);
  need(run, `Опрос ${runId || ''} не найден.`);
  const selectedPersonaIds = Array.isArray(personaIds) ? personaIds : [];
  need(selectedPersonaIds.length === 2 && new Set(selectedPersonaIds).size === 2,
    'Для парной оценки нужны две разные персоны.');
  const personas = selectedPersonaIds.map(id => study.personas?.find(persona => persona.id === id));
  need(personas.every(Boolean), 'Все персоны парной оценки должны существовать.');
  need(personas[0].segmentId === personas[1].segmentId,
    'Парные персоны должны принадлежать одному сегменту.');
  const answers = run.answers.filter(answer => selectedPersonaIds.includes(answer.personaId) && answer.questionId === questionId);
  need(answers.length > 0, 'В выбранном опросе нет ответов парных персон на указанный вопрос.');
  const comparisons = personas.map(persona => {
    const values = answers.filter(answer => answer.personaId === persona.id).map(answer => answer.value);
    need(values.length > 0, `Нет ответов персоны ${persona.id}.`);
    const counts = Object.fromEntries([...new Set(values)].map(value => [value, values.filter(item => item === value).length]));
    const shares = Object.fromEntries(Object.entries(counts).map(([value, count]) => [value, count / values.length]));
    return { personaId: persona.id, segmentId: persona.segmentId, counts, shares, sampleSize: values.length };
  });
  const values = new Set(comparisons.flatMap(item => Object.keys(item.counts)));
  const maxShareGap = [...values].reduce((max, value) => Math.max(max,
    Math.abs((comparisons[0].shares[value] || 0) - (comparisons[1].shares[value] || 0))), 0);
  const expectedChecks = selectedPersonaIds.map(id => {
    const expected = expectedOptionByPersona[id];
    if (!expected) return { personaId: id, checked: false, pass: true };
    const comparison = comparisons.find(item => item.personaId === id);
    const share = comparison.shares[expected] || 0;
    return { personaId: id, expectedOption: expected, observedShare: share, checked: true, pass: share > 0.5 };
  });
  const observedDifference = maxShareGap >= minShareGap;
  const expectedChecksPass = expectedChecks.every(item => item.pass);
  return {
    experimentId: 'EXP-001',
    method: run.method,
    fixture: { segmentId: personas[0].segmentId, personaIds: selectedPersonaIds,
      questionId, questionnaireVersion: run.questionnaireVersion, seed: run.seed },
    comparisons,
    expectedDistinction: 'persona profile changes answer distribution',
    expectedChecks,
    maxShareGap,
    observedDifference,
    status: observedDifference && expectedChecksPass ? 'pass' : 'fail',
    limitations: ['Проверка подтверждает влияние профиля на реализацию, но не устанавливает соответствие ответов реальным людям.']
  };
}

export function evaluateQuestionPerturbation({ baselineStudy, perturbedStudy, questionId, perturbation = {}, changeThreshold = 0.05 } = {}) {
  need(baselineStudy && perturbedStudy, 'Нужны базовое и изменённое исследование.');
  const baselineRun = baselineStudy.runs?.at(-1);
  const perturbedRun = perturbedStudy.runs?.at(-1);
  need(baselineRun && perturbedRun, 'Для сравнения нужны завершённые опросы.');
  need(baselineRun.seed === perturbedRun.seed, 'Базовый и изменённый опрос должны использовать один seed.');
  need(baselineRun.method === perturbedRun.method, 'Базовый и изменённый опрос должны использовать один метод.');
  const baselineQuestion = baselineStudy.questionnaires?.[baselineRun.questionnaireVersion - 1]?.questions.find(q => q.id === questionId);
  const perturbedQuestion = perturbedStudy.questionnaires?.[perturbedRun.questionnaireVersion - 1]?.questions.find(q => q.id === questionId);
  need(baselineQuestion && perturbedQuestion, `Вопрос ${questionId} должен существовать в обеих версиях.`);
  const baselineAnswers = baselineRun.answers.filter(answer => answer.questionId === questionId);
  const perturbedAnswers = perturbedRun.answers.filter(answer => answer.questionId === questionId);
  need(baselineAnswers.length > 0 && perturbedAnswers.length > 0, 'Для сравнения нужны ответы на выбранный вопрос.');
  const options = [...new Set([...baselineQuestion.options, ...perturbedQuestion.options])];
  const summarize = answers => {
    const counts = Object.fromEntries(options.map(option => [option, answers.filter(answer => answer.value === option).length]));
    const shares = Object.fromEntries(options.map(option => [option, counts[option] / answers.length]));
    return { counts, shares, sampleSize: answers.length };
  };
  const baseline = summarize(baselineAnswers);
  const perturbed = summarize(perturbedAnswers);
  const distributionDelta = Object.fromEntries(options.map(option => [option,
    perturbed.shares[option] - baseline.shares[option]]));
  const changedOptions = options.filter(option => Math.abs(distributionDelta[option]) >= changeThreshold);
  const baselinePersonaIds = new Set(baselineAnswers.map(answer => answer.personaId));
  const perturbedPersonaIds = new Set(perturbedAnswers.map(answer => answer.personaId));
  need([...baselinePersonaIds].every(id => perturbedPersonaIds.has(id)),
    'Набор персон в базовом и изменённом опросе должен совпадать.');
  return {
    experimentId: 'EXP-002',
    perturbation: { type: perturbation.type || 'unspecified', questionId, description: perturbation.description || '' },
    baseline: { runId: baselineRun.id, seed: baselineRun.seed, method: baselineRun.method,
      questionnaireVersion: baselineRun.questionnaireVersion, question: baselineQuestion.text, ...baseline },
    perturbed: { runId: perturbedRun.id, seed: perturbedRun.seed, method: perturbedRun.method,
      questionnaireVersion: perturbedRun.questionnaireVersion, question: perturbedQuestion.text, ...perturbed },
    distributionDelta,
    changedOptions,
    changed: changedOptions.length > 0,
    status: 'diagnostic',
    limitations: ['Изменение распределения является диагностическим сигналом и не доказывает ошибку или соответствие человеческому поведению.',
      'Сравнение не устанавливает human fidelity.']
  };
}

export function evaluateRunReproducibility({ baselineStudy, repeatStudy, baselineRunId, repeatRunId } = {}) {
  need(baselineStudy && repeatStudy, 'Нужны базовое и повторное исследование.');
  const baselineRun = baselineStudy.runs?.find(run => run.id === (baselineRunId || baselineStudy.runs.at(-1)?.id));
  const repeatRun = repeatStudy.runs?.find(run => run.id === (repeatRunId || repeatStudy.runs.at(-1)?.id));
  need(baselineRun && repeatRun, 'Для сравнения нужны два завершённых опроса.');
  const provenance = run => run.answers.every(answer => answer.personaId && answer.segmentId &&
    answer.questionId && Number.isInteger(answer.questionnaireVersion));
  const provenanceComplete = provenance(baselineRun) && provenance(repeatRun);
  const fixture = run => ({ method: run.method, questionnaireVersion: run.questionnaireVersion,
    personaIds: [...new Set(run.answers.map(answer => answer.personaId))].sort(),
    segmentIds: [...new Set(run.answers.map(answer => answer.segmentId))].sort(),
    questionIds: [...new Set(run.answers.map(answer => answer.questionId))].sort() });
  const baselineFixture = fixture(baselineRun);
  const repeatFixture = fixture(repeatRun);
  const fixtureEqual = JSON.stringify(baselineFixture) === JSON.stringify(repeatFixture);
  need(fixtureEqual, 'Базовый и повторный опрос используют разные provenance fixtures.');
  const sameSeed = baselineRun.seed === repeatRun.seed;
  const answersEqual = JSON.stringify(baselineRun.answers) === JSON.stringify(repeatRun.answers);
  const summaryEqual = JSON.stringify(baselineRun.summary) === JSON.stringify(repeatRun.summary);
  const comparison = sameSeed ? 'exact-replay' : 'changed-factor';
  const status = !provenanceComplete ? 'invalid-comparison' :
    sameSeed ? (answersEqual && summaryEqual ? 'pass' : 'fail') : 'changed-factor';
  return {
    experimentId: 'EXP-003', comparison,
    baseline: { runId: baselineRun.id, seed: baselineRun.seed, ...baselineFixture },
    repeat: { runId: repeatRun.id, seed: repeatRun.seed, ...repeatFixture },
    answersEqual, summaryEqual, provenanceComplete, status,
    limitations: ['Повторяемость реализации не устанавливает human fidelity или репрезентативность синтетических ответов.']
  };
}

export function importBenchmarkReference({ source, items, questionMap = {}, allowedOptionsByQuestion = {} } = {}) {
  need(source?.id && source?.license, 'Benchmark reference требует source ID и license metadata.');
  need(Array.isArray(items) && items.length > 0, 'Benchmark reference должен содержать item-level responses.');
  const normalized = items.map((item, index) => {
    need(item?.sourceQuestionId && item?.respondentId && typeof item.value === 'string',
      `Benchmark item ${index + 1} не содержит sourceQuestionId, respondentId или value.`);
    const questionId = questionMap[item.sourceQuestionId];
    need(questionId, `Для benchmark item ${item.sourceQuestionId} нет mapping на question ID.`);
    const allowed = allowedOptionsByQuestion[questionId];
    need(!allowed || allowed.includes(item.value),
      `Benchmark item ${item.sourceQuestionId} содержит неподдерживаемый вариант ответа.`);
    return { sourceId: source.id, sourceQuestionId: item.sourceQuestionId,
      questionId, respondentId: String(item.respondentId), value: item.value };
  });
  return { source: { id: source.id, title: source.title || '', license: source.license,
    accessedAt: source.accessedAt || null }, items: normalized };
}

export function evaluateSyntheticAgainstBenchmark({ study, reference, runId = study?.runs?.at(-1)?.id, questionIds } = {}) {
  need(study && reference?.source?.id && Array.isArray(reference.items), 'Нужны study и импортированный benchmark reference.');
  const run = study.runs?.find(item => item.id === runId);
  need(run, `Опрос ${runId || ''} не найден.`);
  const questionnaire = study.questionnaires?.[run.questionnaireVersion - 1];
  need(questionnaire, 'Версия анкеты для benchmark не найдена.');
  const selectedQuestionIds = questionIds || [...new Set(reference.items.map(item => item.questionId))];
  const questions = selectedQuestionIds.map(questionId => {
    const question = questionnaire.questions.find(item => item.id === questionId);
    need(question, `В benchmark отсутствует вопрос ${questionId} в questionnaire version.`);
    const syntheticAnswers = run.answers.filter(answer => answer.questionId === questionId);
    const referenceAnswers = reference.items.filter(item => item.questionId === questionId);
    need(syntheticAnswers.length > 0 && referenceAnswers.length > 0,
      `Для ${questionId} нужны synthetic и reference responses.`);
    const options = [...new Set([...question.options, ...referenceAnswers.map(answer => answer.value)])];
    const summarize = (answers, valueOf) => {
      const counts = Object.fromEntries(options.map(option => [option, answers.filter(answer => valueOf(answer) === option).length]));
      const shares = Object.fromEntries(options.map(option => [option, counts[option] / answers.length]));
      return { counts, shares, sampleSize: answers.length };
    };
    const synthetic = summarize(syntheticAnswers, answer => answer.value);
    const referenceSummary = summarize(referenceAnswers, answer => answer.value);
    const totalVariationDistance = 0.5 * options.reduce((sum, option) =>
      sum + Math.abs(synthetic.shares[option] - referenceSummary.shares[option]), 0);
    return { questionId, synthetic, reference: referenceSummary, totalVariationDistance };
  });
  const meanTotalVariationDistance = questions.reduce((sum, item) => sum + item.totalVariationDistance, 0) / questions.length;
  return {
    experimentId: 'EXP-004',
    source: reference.source,
    run: { runId: run.id, seed: run.seed, method: run.method, questionnaireVersion: run.questionnaireVersion },
    questions, meanTotalVariationDistance, status: 'computed',
    limitations: ['Benchmark comparison is not population inference and does not establish causal validity or human fidelity.',
      'External datasets require separate terms, license and data review before use.']
  };
}

export function validateQuestions(questions, taskIds) {
  const errors = [], warnings = [];
  if (!Array.isArray(questions) || questions.length < 1 || questions.length > 8) errors.push('Анкета должна содержать от 1 до 8 вопросов.');
  const ids = new Set(), covered = new Set();
  for (const [index, q] of (Array.isArray(questions) ? questions : []).entries()) {
    if (!q || !/^[a-zA-Z0-9-]+$/.test(q.id || '') || ids.has(q.id)) errors.push(`Вопрос ${index + 1}: некорректный или повторный ID.`);
    else ids.add(q.id);
    if (clean(q?.text, 500).length < 8) errors.push(`Вопрос ${index + 1}: текст слишком короткий.`);
    if (!taskIds.includes(q?.taskId)) errors.push(`Вопрос ${index + 1}: нет связи с задачей.`);
    else covered.add(q.taskId);
    if (!Array.isArray(q?.options) || q.options.length < 2 || q.options.length > 6 ||
        q.options.some(o => clean(o, 100).length < 1) ||
        new Set((q.options || []).map(o => clean(o, 100).toLowerCase())).size !== q.options.length) errors.push(`Вопрос ${index + 1}: нужны 2–6 различных вариантов.`);
    if (/эту проблему|это\b|обычно/i.test(q?.text || '')) warnings.push(`Вопрос ${index + 1}: формулировка может быть неоднозначной; проверьте её после опроса.`);
  }
  for (const id of taskIds) if (!covered.has(id)) errors.push(`Нет вопроса для задачи ${id}.`);
  return { valid: errors.length === 0, errors, warnings, checkedAt: new Date().toISOString() };
}

function rngFrom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) { state ^= char.charCodeAt(0); state = Math.imul(state, 16777619); }
  return () => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 4294967296; };
}

function weights(persona, question) {
  if (question.options.length === 3 && question.kind === 'frequency') return persona.exposure === 'high' ? [0.04, 0.16, 0.80] : [0.55, 0.35, 0.10];
  if (question.options.length === 3 && question.kind === 'approach') return persona.priority === 'speed' ? [0.76, 0.14, 0.10] : [0.11, 0.75, 0.14];
  if (question.options.length === 3 && question.kind === 'barrier') return persona.exposure === 'high' ? [0.55, 0.35, 0.10] : [0.15, 0.25, 0.60];
  return question.options.map((_, i) => i === (persona.priority === 'speed' ? 0 : question.options.length - 1) ? 0.7 : 0.3 / (question.options.length - 1));
}

function pick(options, rawWeights, random) {
  const cumulative = rawWeights.reduce((a, b) => a + b, 0);
  let position = random() * cumulative;
  for (let i = 0; i < options.length; i++) { position -= rawWeights[i] ?? 0; if (position < 0) return options[i]; }
  return options.at(-1);
}

function runSurvey(study, payload) {
  const qv = study.questionnaires.at(-1);
  need(qv && qv.validation?.valid, 'Сначала выполните формальную проверку анкеты.');
  need(study.personas && study.personas.length > 0, 'Нет подтверждённых персон.');
  const sampleSize = Number(payload?.sampleSize);
  need(Number.isInteger(sampleSize) && sampleSize >= study.personas.length && sampleSize <= 60, `Размер выборки: от ${study.personas.length} до 60.`);
  need(study.runs.length < 2, 'Для B0 доступны первый и повторный опрос.');
  if (study.runs.length === 1) need(qv.version > study.runs[0].questionnaireVersion && study.interview, 'Для повторного опроса нужна новая анкета после интервью.');
  const seed = clean(String(payload?.seed ?? ''), 100) || `run-${study.runs.length + 1}`;
  const random = rngFrom(`${seed}|${qv.version}`);
  const answers = [];
  if (study.mode === 'chatgpt') {
    const generated = payload?.generated?.answers;
    need(Array.isArray(generated) && generated.length === sampleSize * qv.questions.length,
      'Модель вернула неполный набор ответов. Повторите опрос.');
    for (let index = 0; index < sampleSize; index++) {
      const persona = study.personas[index % study.personas.length];
      for (const question of qv.questions) {
        const answer = generated[index * qv.questions.length + qv.questions.indexOf(question)];
        need(answer?.respondent === index + 1 && answer?.personaId === persona.id &&
          answer?.questionId === question.id && question.options.includes(answer?.value),
        'Модель вернула ответ вне утверждённой анкеты или профиля. Повторите опрос.');
        answers.push({ respondent: index + 1, personaId: persona.id, segmentId: persona.segmentId,
          questionId: question.id, questionnaireVersion: qv.version, value: answer.value });
      }
    }
  } else {
    for (let index = 0; index < sampleSize; index++) {
      const persona = study.personas[index % study.personas.length];
      for (const question of qv.questions) {
        const w = weights(persona, question);
        answers.push({ respondent: index + 1, personaId: persona.id, segmentId: persona.segmentId,
          questionId: question.id, questionnaireVersion: qv.version, value: pick(question.options, w, random) });
      }
    }
  }
  const summary = qv.questions.map(q => ({ questionId: q.id, text: q.text,
    counts: Object.fromEntries(q.options.map(option => [option, answers.filter(a => a.questionId === q.id && a.value === option).length])) }));
  study.runs.push({ id: `run-${study.runs.length + 1}`, questionnaireVersion: qv.version,
    sampleSize, seed, method: study.mode === 'chatgpt' ? `chatgpt-plan:${payload.model}` : 'bounded-persona-rules-v1',
    answers, summary, completedAt: new Date().toISOString() });
  event(study, 'survey_run_completed');
}

function probe(study) {
  need(study.runs.length === 1, 'Интервью доступно после первого опроса.');
  need(!study.interview, 'Интервью уже проведено.');
  const qv = study.questionnaires[0], run = study.runs[0];
  const entries = study.personas.flatMap(persona => qv.questions.map(q => {
    const answer = run.answers.find(a => a.personaId === persona.id && a.questionId === q.id);
    const value = answer?.value || 'нет ответа';
    const meaning = q.kind === 'frequency' ? `частоту столкновения с ситуацией «${study.problem}»` :
      q.kind === 'approach' ? `подход к ситуации «${study.problem}»` :
      q.kind === 'barrier' ? `главное препятствие в ситуации «${study.problem}»` : `выбор среди вариантов вопроса «${q.text}»`;
    return { personaId: persona.id, questionId: q.id, questionText: q.text,
      probe: 'Что означал вопрос для вас и почему вы выбрали этот ответ?', answer: value,
      interpretation: `Под вопросом я понял(а) ${meaning}. Выбрал(а) «${value}», опираясь на ${persona.exposure === 'high' ? 'частый' : 'редкий'} опыт и приоритет ${persona.priority === 'speed' ? 'скорости' : 'тщательности'}.` };
  }));
  const findings = qv.questions.filter(q => /эту проблему|это\b|обычно/i.test(q.text)).map(q => ({
    questionId: q.id, issue: 'Возможная неоднозначная ссылка или частота без периода.',
    example: `Формулировка «${q.text}» может пониматься персонами по-разному.`,
    suggestion: `Назовите ситуацию и период явно: «${study.problem.slice(0, 100)}».`
  }));
  study.interview = { type: 'synthetic-persona-post-run-probe', sourceRunId: run.id, disposition: 'awaiting-user-review',
    entries, findings, limitation: 'Объяснения созданы правилами синтетических персон; это не интервью с людьми.', completedAt: new Date().toISOString() };
  event(study, 'cognitive_probe_completed');
}

function screenCaricature(study) {
  need(study.runs.length >= 2, 'Сначала выполните повторный опрос.');
  const flags = [];
  for (const persona of study.personas) if (/\b(все|всегда|никогда|anyone|always|never)\b/i.test(persona.description))
    flags.push({ category: 'essentializing-language', personaId: persona.id, evidence: persona.description });
  const run = study.runs.at(-1);
  for (const segment of study.segments) for (const q of study.questionnaires.at(-1).questions) {
    const values = run.answers.filter(a => a.segmentId === segment.id && a.questionId === q.id).map(a => a.value);
    if (values.length >= 2 && new Set(values).size === 1)
      flags.push({ category: 'uniform-response', segmentId: segment.id, questionId: q.id,
        evidence: `Все ${values.length} ответов сегмента: «${values[0]}».` });
  }
  study.caricature = { sourceRunId: run.id, screenedAnswers: run.answers.length, flags,
    limitation: 'Эвристика выявляет отдельные признаки. Отсутствие флагов не доказывает отсутствие стереотипов или достоверность ответов.',
    completedAt: new Date().toISOString() };
  event(study, 'caricature_screen_completed');
}

function buildReport(study) {
  need(study.caricature, 'Сначала выполните проверку на карикатурность.');
  study.report = { title: 'Отчёт для принятия решения', status: 'synthetic-exploratory',
    problem: study.problem, audienceDescription: study.audienceDescription, audienceProfile: clone(study.audienceProfile),
    taskIds: study.tasks.map(x => x.id), segmentIds: study.segments.map(x => x.id),
    personaIds: study.personas.map(x => x.id), questionnaireVersions: study.questionnaires.map(x => x.version),
    runIds: study.runs.map(x => x.id), latestSummary: clone(study.runs.at(-1).summary),
    cognitiveFindingCount: study.interview.findings.length, caricatureFlagCount: study.caricature.flags.length,
    recommendation: 'Используйте различия ответов как гипотезы для проверки на реальных людях; не принимайте решение только по синтетическому опросу.',
    limitations: [study.mode === 'chatgpt'
      ? 'Ответы созданы моделью ChatGPT с учётом утверждённых персон, а не репрезентативной выборкой людей.'
      : 'Ответы созданы ограниченными правилами, а не репрезентативной выборкой людей.',
      'Когнитивное интервью проведено с синтетическими персонами.', 'Проверка карикатурности не имеет измеренной полноты или точности.'],
    createdAt: new Date().toISOString() };
  event(study, 'report_created');
}

export function transition(input, action, payload = {}) {
  const study = clone(input);
  switch (action) {
    case 'propose-tasks': proposeTasks(study, payload); break;
    case 'confirm-tasks': {
      need(study.taskProposal && !study.tasks, 'Сначала получите предложение задач.');
      study.tasks = validateItems(payload.items, 'Задачи', 1, 3).map(x => ({ id: x.id, title: clean(x.title, 300) }));
      event(study, 'tasks_confirmed'); break;
    }
    case 'propose-segments': proposeSegments(study, payload); break;
    case 'confirm-segments': {
      need(study.segmentProposal && !study.segments, 'Сначала получите предложение сегментов.');
      study.segments = validateItems(payload.items, 'Сегменты', 1, 3).map(x => ({ id: x.id, name: clean(x.name, 150), rationale: clean(x.rationale, 300), exposure: x.exposure === 'high' ? 'high' : 'low' }));
      event(study, 'segments_confirmed'); break;
    }
    case 'propose-personas': proposePersonas(study, payload); break;
    case 'confirm-personas': {
      need(study.personaProposal && !study.personas, 'Сначала получите предложение персон.');
      const items = validateItems(payload.items, 'Персоны', study.segments.length, 12);
      const segmentIds = new Set(study.segments.map(s => s.id));
      for (const item of items) {
        need(segmentIds.has(item.segmentId), `Персона ${item.id}: неизвестный сегмент.`);
        need(['high', 'low'].includes(item.exposure) && ['speed', 'careful'].includes(item.priority), `Персона ${item.id}: некорректные признаки.`);
      }
      for (const id of segmentIds) need(items.some(p => p.segmentId === id), `Для сегмента ${id} нужна персона.`);
      study.personas = items.map(x => ({ id: x.id, segmentId: x.segmentId, name: clean(x.name, 150), description: clean(x.description, 300), exposure: x.exposure, priority: x.priority }));
      event(study, 'personas_confirmed'); break;
    }
    case 'propose-questions': proposeQuestions(study, payload); break;
    case 'validate-questions': {
      need(study.questionnaires.length > 0, 'Сначала подготовьте анкету.');
      const qv = study.questionnaires.at(-1);
      qv.validation = validateQuestions(qv.questions, study.tasks.map(x => x.id));
      event(study, 'questionnaire_validated'); break;
    }
    case 'run': runSurvey(study, payload); break;
    case 'interview': probe(study); break;
    case 'revise-questions': {
      need(study.interview && study.runs.length === 1 && study.questionnaires.length === 1, 'Сначала проведите интервью после первого опроса.');
      const questions = Array.isArray(payload.questions) ? payload.questions.map(q => ({
        id: clean(q.id, 30), taskId: clean(q.taskId, 30), kind: ['frequency', 'approach', 'barrier'].includes(q.kind) ? q.kind : 'custom',
        text: clean(q.text, 500), options: Array.isArray(q.options) ? q.options.map(o => clean(o, 100)) : [] })) : [];
      need(JSON.stringify(questions) !== JSON.stringify(study.questionnaires[0].questions), 'Измените или добавьте хотя бы один вопрос.');
      study.questionnaires.push({ version: 2, questions, validation: null, createdAt: new Date().toISOString() });
      study.interview.disposition = 'reviewed-and-revised';
      event(study, 'questionnaire_revised'); break;
    }
    case 'update-questions': {
      need(study.questionnaires.length === 2 && study.runs.length === 1, 'Исправление доступно только до повторного опроса.');
      const questions = Array.isArray(payload.questions) ? payload.questions.map(q => ({
        id: clean(q.id, 30), taskId: clean(q.taskId, 30), kind: ['frequency', 'approach', 'barrier'].includes(q.kind) ? q.kind : 'custom',
        text: clean(q.text, 500), options: Array.isArray(q.options) ? q.options.map(o => clean(o, 100)) : [] })) : [];
      study.questionnaires[1].questions = questions;
      study.questionnaires[1].validation = null;
      event(study, 'questionnaire_corrected'); break;
    }
    case 'screen-caricature': screenCaricature(study); break;
    case 'build-report': buildReport(study); break;
    default: fail('Неизвестное действие.');
  }
  study.revision += 1;
  return study;
}
