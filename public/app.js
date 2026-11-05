const root = document.querySelector('#app');
const notice = document.querySelector('#notice');
let study = null, studies = [], busy = false, aiStatus = null, selectedModel = '';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const text = (value, fallback = '—') => esc(value || fallback);
const join = items => (items || []).map(x => `<li>${esc(x)}</li>`).join('');
const button = (label, action, secondary = false) => `<button type="button" data-action="${action}" class="${secondary ? 'secondary' : ''}">${label}</button>`;
const status = done => `<span class="pill ${done ? '' : 'pending'}">${done ? 'Готово' : 'Ожидает'}</span>`;

async function api(path, method = 'GET', data) {
  const response = await fetch(path, { method, headers: { 'content-type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Ошибка запроса.');
  return value;
}

function show(message, error = false) {
  notice.innerHTML = message ? `<div class="${error ? 'error' : 'success'}">${esc(message)}</div>` : '';
}

async function refresh() {
  studies = await api('/api/research');
  aiStatus = await api('/api/ai/status').catch(error => ({ mode: 'chatgpt', error: error.message, models: [] }));
  const models = aiStatus.models || [];
  selectedModel = models.some(model => model.slug === localStorage.getItem('ssl-model')) ? localStorage.getItem('ssl-model') : (models[0]?.slug || '');
  const id = study?.id || localStorage.getItem('ssl-study-id');
  study = id ? await api(`/api/research/${id}`).catch(() => null) : null;
  render();
}

async function action(name, payload = {}) {
  if (!study || busy) return;
  busy = true;
  show('Выполняется…');
  try {
    study = await api(`/api/research/${study.id}/actions`, 'POST', { revision: study.revision, action: name, payload, model: selectedModel });
    show('Изменение сохранено.');
    await refresh();
  } catch (error) { show(error.message, true); }
  finally { busy = false; }
}

function card(number, title, done, current, content) {
  return `<section class="panel step ${done ? 'done' : current ? 'current' : ''}"><div class="step-head"><span class="step-num">ЭТАП ${number}</span>${status(done)}</div><h2>${title}</h2>${content}</section>`;
}

function editableItems(items, field, type) {
  return items.map((item, i) => `<div class="item" data-${type}-row="${i}"><div class="muted mono">${esc(item.id)}</div><label>${field === 'title' ? 'Задача' : 'Название'}</label><input data-field="${field}" value="${esc(item[field])}" maxlength="300">
    ${type === 'segment' ? `<label>Основание</label><input data-field="rationale" value="${esc(item.rationale)}" maxlength="300"><label>Частота опыта</label><select data-field="exposure"><option value="high" ${item.exposure === 'high' ? 'selected' : ''}>Высокая</option><option value="low" ${item.exposure === 'low' ? 'selected' : ''}>Низкая</option></select>` : ''}
    ${type === 'persona' ? `<label>Описание</label><textarea data-field="description" maxlength="300">${esc(item.description)}</textarea><div class="grid2"><div><label>Частота опыта</label><select data-field="exposure"><option value="high" ${item.exposure === 'high' ? 'selected' : ''}>Высокая</option><option value="low" ${item.exposure === 'low' ? 'selected' : ''}>Низкая</option></select></div><div><label>Приоритет</label><select data-field="priority"><option value="speed" ${item.priority === 'speed' ? 'selected' : ''}>Скорость</option><option value="careful" ${item.priority === 'careful' ? 'selected' : ''}>Тщательность</option></select></div></div>` : ''}</div>`).join('');
}

function tasksCard() {
  if (!study.taskProposal) return card(2, 'Исследовательские задачи', false, true, `<p>Система предложит задачи из вашей проблемы. Вы сможете уточнить формулировки.</p>${button('Сформировать задачи', 'propose-tasks')}`);
  if (!study.tasks) return card(2, 'Подтвердите исследовательские задачи', false, true, `<p class="hint">Проверьте связь с проблемой. Дальше пройдут только подтверждённые задачи.</p>${editableItems(study.taskProposal, 'title', 'task')}${button('Подтвердить задачи', 'confirm-tasks')}`);
  return card(2, 'Исследовательские задачи', true, false, `<ul>${join(study.tasks.map(x => x.title))}</ul>`);
}

function segmentsCard() {
  if (!study.tasks) return '';
  if (!study.segmentProposal) return card(3, 'Сегменты', false, true, `<p>Система предложит контрастные группы по частоте опыта.</p>${button('Рекомендовать сегменты', 'propose-segments')}`);
  if (!study.segments) return card(3, 'Подтвердите сегменты', false, true, `${editableItems(study.segmentProposal, 'name', 'segment')}${button('Подтвердить сегменты', 'confirm-segments')}`);
  return card(3, 'Сегменты', true, false, study.segments.map(s => `<div class="item"><strong>${esc(s.name)}</strong><p class="muted">${esc(s.rationale)}</p></div>`).join(''));
}

function personasCard() {
  if (!study.segments) return '';
  if (!study.personaProposal) return card(4, 'Персоны', false, true, `<p>Каждый подтверждённый сегмент получит разные профили.</p>${button('Сформировать персоны', 'propose-personas')}`);
  if (!study.personas) return card(4, 'Подтвердите персоны', false, true, `<p class="hint">Признаки опыта и приоритета влияют на ответы.</p>${editableItems(study.personaProposal, 'name', 'persona')}${button('Подтвердить персоны', 'confirm-personas')}`);
  return card(4, 'Персоны', true, false, study.personas.map(p => `<div class="item"><strong>${esc(p.name)}</strong><p>${esc(p.description)}</p><span class="muted mono">${esc(p.segmentId)} · ${esc(p.exposure)} · ${esc(p.priority)}</span></div>`).join(''));
}

function questionEditor(questions) {
  return `<div id="question-editor">${questions.map((q, i) => questionRow(q, i)).join('')}</div><p>${button('Добавить вопрос', 'add-question', true)}</p>`;
}

function questionRow(q, i) {
  const taskOptions = study.tasks.map(t => `<option value="${esc(t.id)}" ${q.taskId === t.id ? 'selected' : ''}>${esc(t.id)} · ${esc(t.title.slice(0, 55))}</option>`).join('');
  return `<div class="item question-row" data-question="${i}" data-id="${esc(q.id)}" data-kind="${esc(q.kind || 'custom')}"><strong>Вопрос ${i + 1}</strong><label>Текст вопроса</label><input data-field="text" value="${esc(q.text)}" maxlength="500"><div class="grid2"><div><label>Исследовательская задача</label><select data-field="taskId">${taskOptions}</select></div><div><label>Варианты через точку с запятой</label><input data-field="options" value="${esc(q.options.join('; '))}"></div></div></div>`;
}

function validationBlock(qv) {
  if (!qv.validation) return button('Проверить анкету', 'validate-questions');
  return `<div class="${qv.validation.valid ? 'success' : 'error'}">${qv.validation.valid ? 'Формальная проверка пройдена.' : 'Анкета не прошла проверку.'}</div>${qv.validation.errors.length ? `<ul>${join(qv.validation.errors)}</ul>` : ''}${qv.validation.warnings.map(x => `<div class="warning">${esc(x)}</div>`).join('')}`;
}

function runsBlock() {
  return study.runs.map(run => `<div class="item"><h3>${esc(run.id)} · версия анкеты ${run.questionnaireVersion}</h3><p class="muted">${run.sampleSize} синтетических респондентов · seed: <span class="mono">${esc(run.seed)}</span> · ${esc(run.method)}</p>${run.summary.map(s => `<h3>${esc(s.text)}</h3><table><tbody>${Object.entries(s.counts).map(([answer, n]) => `<tr><td>${esc(answer)}</td><td>${n}</td></tr>`).join('')}</tbody></table>`).join('')}</div>`).join('');
}

function surveyCard() {
  if (!study.personas) return '';
  const qv = study.questionnaires.at(-1);
  if (!qv) return card(5, 'Анкета и опрос', false, true, `<p>Система предложит короткую анкету по подтверждённым задачам.</p>${button('Подготовить анкету', 'propose-questions')}`);
  const firstDone = study.runs.length >= 1, secondDone = study.runs.length >= 2;
  const questions = qv.questions.map(q => `<div class="item"><strong>${esc(q.text)}</strong><div class="muted">${esc(q.taskId)} · ${esc(q.options.join(' / '))}</div></div>`).join('');
  let next = '';
  if (!qv.validation?.valid) next = `${qv.version === 2 ? `<p class="hint">Исправьте вопросы и сохраните их перед повторной проверкой.</p>${questionEditor(qv.questions)}${button('Сохранить исправления', 'update-questions')}` : ''}${validationBlock(qv)}`;
  else if (!firstDone || (qv.version === 2 && !secondDone)) next = `${validationBlock(qv)}<div class="grid2"><div><label>Размер синтетической выборки (от ${study.personas.length} до ${study.mode === 'chatgpt' ? 24 : 60})</label><input id="sample-size" type="number" min="${study.personas.length}" max="${study.mode === 'chatgpt' ? 24 : 60}" value="${Math.max(study.personas.length, 12)}"></div><div><label>${study.mode === 'chatgpt' ? 'Метка запуска (не гарантирует повторение ответов LLM)' : 'Seed для воспроизводимости'}</label><input id="run-seed" value="demo-${qv.version}"></div></div><p>${button(qv.version === 1 ? 'Запустить первый опрос' : 'Запустить повторный опрос', 'run')}</p>`;
  else if (firstDone && !study.interview) next = `<p>${button('Провести интервью с синтетическими персонами', 'interview')}</p>`;
  else if (firstDone && qv.version === 1) next = `<div class="warning">Интервью выявило ${study.interview.findings.length} возможных проблем. Просмотрите их и измените или добавьте вопрос.</div>${study.interview.findings.map(f => `<div class="item"><strong>${esc(f.questionId)}</strong><p>${esc(f.issue)}</p><p class="muted">${esc(f.example)}</p></div>`).join('')}<details><summary>Ответы персон на когнитивные вопросы (${study.interview.entries.length})</summary>${study.interview.entries.map(e => `<div class="item"><strong>${esc(e.personaId)} · ${esc(e.questionId)}</strong><p>${esc(e.probe)}</p><p><b>Ответ:</b> ${esc(e.answer)}</p><p>${esc(e.interpretation)}</p></div>`).join('')}</details>${questionEditor(qv.questions)}${button('Сохранить новую версию анкеты', 'revise-questions')}`;
  else next = validationBlock(qv);
  const savedInterview = qv.version > 1 && study.interview ? `<details><summary>Сохранённое интервью с синтетическими персонами</summary><p>${esc(study.interview.limitation)}</p>${study.interview.findings.map(f => `<div class="item"><strong>${esc(f.questionId)}</strong><p>${esc(f.issue)}</p></div>`).join('')}${study.interview.entries.map(e => `<div class="item"><strong>${esc(e.personaId)} · ${esc(e.questionId)}</strong><p>${esc(e.probe)}</p><p><b>Ответ:</b> ${esc(e.answer)}</p><p>${esc(e.interpretation)}</p></div>`).join('')}</details>` : '';
  return card(5, 'Анкета, опрос и интервью', secondDone, !secondDone,
    `<p class="muted">Версия ${qv.version}. Формальная проверка проверяет структуру; интервью проводится только с синтетическими персонами.</p>${questions}${next}${savedInterview}${study.runs.length ? `<h3>Сохранённые запуски</h3>${runsBlock()}` : ''}`);
}

function caricatureCard() {
  if (study.runs.length < 2) return '';
  if (!study.caricature) return card(6, 'Проверка на карикатурность', false, true, `<p>Проверка ищет единообразие ответов и обобщающие описания персон.</p>${button('Проверить ответы', 'screen-caricature')}`);
  const flags = study.caricature.flags.map(f => `<div class="warning"><strong>${esc(f.category)}</strong><p>${esc(f.evidence)}</p><span class="mono">${esc(f.personaId || f.segmentId || '')} ${esc(f.questionId || '')}</span></div>`).join('');
  return card(6, 'Проверка на карикатурность', true, false, `<p>Проверено ${study.caricature.screenedAnswers} ответов; флагов: ${study.caricature.flags.length}.</p>${flags || '<p>Эвристика не обнаружила флагов.</p>'}<p class="hint">${esc(study.caricature.limitation)}</p>`);
}

function reportCard() {
  if (!study.caricature) return '';
  if (!study.report) return card(7, 'Отчёт для решения', false, true, `${button('Сформировать отчёт', 'build-report')}`);
  const r = study.report;
  return card(7, 'Отчёт для решения', true, false, `<p class="warning"><strong>Синтетические данные для формирования гипотез.</strong> Не заменяют ответы реальных людей.</p><div class="report"><h3>Бизнес-проблема</h3><p>${esc(r.problem)}</p><h3>Аудитория</h3><p>${esc(r.audienceDescription)}</p><h3>Основания</h3><p>Задачи: ${esc(r.taskIds.join(', '))}. Сегменты: ${esc(r.segmentIds.join(', '))}. Персоны: ${esc(r.personaIds.join(', '))}.</p><p>Анкеты: ${esc(r.questionnaireVersions.join(', '))}. Запуски: ${esc(r.runIds.join(', '))}.</p><h3>Последний опрос</h3>${r.latestSummary.map(s => `<div class="item"><strong>${esc(s.text)}</strong><p>${Object.entries(s.counts).map(([a, n]) => `${esc(a)}: ${n}`).join(' · ')}</p></div>`).join('')}<h3>Проверки качества</h3><p>Замечаний интервью: ${r.cognitiveFindingCount}. Флагов карикатурности: ${r.caricatureFlagCount}.</p><h3>Для решения</h3><p>${esc(r.recommendation)}</p><h3>Ограничения</h3><ul>${join(r.limitations)}</ul></div>`);
}

function render() {
  const connected = aiStatus?.session?.sharing;
  const account = aiStatus?.session?.identity?.email || aiStatus?.session?.profileLabel || 'ChatGPT';
  const auth = aiStatus?.mode === 'rules' ? '<section class="panel"><h2>Режим правил</h2><p>Локальная версия B0 без LLM.</p></section>' :
    `<section class="panel"><h2>Подписка ChatGPT</h2>${connected ? `<p class="success">Подключено: ${esc(account)}. Генерация использует вашу подписку или доступные кредиты.</p><label for="model-select">Модель</label><select id="model-select">${(aiStatus.models || []).map(model => `<option value="${esc(model.slug)}" ${model.slug === selectedModel ? 'selected' : ''}>${esc(model.displayName || model.slug)}</option>`).join('')}</select>${aiStatus.modelError ? `<p class="error">${esc(aiStatus.modelError)}</p>` : ''}` : aiStatus?.session?.status === 'connecting' ? `<p>Ожидаем завершения входа в ChatGPT. Вход через Google — только часть процесса; вернитесь после разрешения OpenAI на использование подписки.</p>${button('Отменить попытку входа', 'cancel-ai', true)}` : `<p>Для генерации подключите подписку. После входа вернитесь в приложение.</p><p><a href="/api/ai/connect">Продолжить с ChatGPT</a></p>${aiStatus?.signInError ? `<p class="error">${esc(aiStatus.signInError)}</p>` : ''}${aiStatus?.error ? `<p class="error">${esc(aiStatus.error)}</p>` : ''}`}${button('Обновить статус', 'refresh-ai', true)}</section>`;
  const sidebar = `<aside class="panel sidebar"><h2>Исследования</h2>${studies.map(s => `<button type="button" class="study-link ${study?.id === s.id ? 'active' : ''}" data-open="${esc(s.id)}">${esc(s.problem.slice(0, 70))}<br><span class="muted">${esc(s.stage)}</span></button>`).join('') || '<p class="muted">Пока нет исследований.</p>'}${button('Новое исследование', 'new', true)}</aside>`;
  const content = !study ? `<section class="panel"><span class="step-num">ЭТАП 1</span><h2>Формализуйте бизнес-проблему</h2><p>Опишите ситуацию и аудиторию обычным языком. Система предложит первый исследовательский план.</p><label for="problem">Бизнес-проблема</label><textarea id="problem" maxlength="500" placeholder="Например: новые клиенты прекращают оформление заказа после выбора доставки"></textarea><label for="audience">Целевая аудитория</label><textarea id="audience" maxlength="500" placeholder="Например: новые покупатели, которым важна скорость оформления"></textarea><p>${button('Создать исследование', 'create')}</p></section>` :
    `<div class="flow">${card(1, 'Бизнес-проблема', true, false, `<p>${esc(study.problem)}</p><p><strong>Аудитория:</strong> ${esc(study.audienceDescription)}</p><span class="muted mono">${esc(study.id)}</span>`)}${tasksCard()}${segmentsCard()}${personasCard()}${surveyCard()}${caricatureCard()}${reportCard()}${study.report ? card(8, 'Исследование сохранено', true, false, '<p>Откройте его после перезапуска из списка слева. Все подтверждения, версии анкет и результаты останутся доступны.</p>') : ''}</div>`;
  root.innerHTML = `<div class="layout">${sidebar}<div>${auth}${content}</div></div>`;
}

function collect(type, proposal) {
  return proposal.map((item, i) => {
    const row = document.querySelector(`[data-${type}-row="${i}"]`);
    const get = name => row.querySelector(`[data-field="${name}"]`)?.value;
    return { ...item, ...(type === 'task' ? { title: get('title') } : { name: get('name') }),
      ...(type === 'segment' ? { rationale: get('rationale'), exposure: get('exposure') } : {}),
      ...(type === 'persona' ? { description: get('description'), exposure: get('exposure'), priority: get('priority') } : {}) };
  });
}

function collectQuestions() {
  return [...document.querySelectorAll('.question-row')].map(row => ({ id: row.dataset.id, kind: row.dataset.kind,
    text: row.querySelector('[data-field="text"]').value, taskId: row.querySelector('[data-field="taskId"]').value,
    options: row.querySelector('[data-field="options"]').value.split(';').map(x => x.trim()) }));
}

root.addEventListener('click', async event => {
  const open = event.target.closest('[data-open]');
  if (open) { study = await api(`/api/research/${open.dataset.open}`); localStorage.setItem('ssl-study-id', study.id); show(''); render(); return; }
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const name = target.dataset.action;
  try {
    if (name === 'refresh-ai') { await refresh(); show(aiStatus?.session?.sharing ? 'Подписка подключена.' : 'Подключение пока не завершено.'); return; }
    if (name === 'cancel-ai') { await api('/api/ai/cancel', 'POST', {}); await refresh(); show('Попытка входа отменена. Можно начать снова.'); return; }
    if (name === 'new') { study = null; localStorage.removeItem('ssl-study-id'); show(''); render(); return; }
    if (name === 'create') { const problem = document.querySelector('#problem').value; const audienceDescription = document.querySelector('#audience').value; study = await api('/api/research', 'POST', { problem, audienceDescription }); localStorage.setItem('ssl-study-id', study.id); show('Исследование создано.'); await refresh(); return; }
    if (name === 'add-question') {
      const rows = document.querySelectorAll('.question-row');
      const q = { id: `q${rows.length + 1}`, taskId: study.tasks[0].id, kind: 'custom', text: '', options: ['Да', 'Нет'] };
      document.querySelector('#question-editor').insertAdjacentHTML('beforeend', questionRow(q, rows.length)); return;
    }
    if (name === 'confirm-tasks') return await action(name, { items: collect('task', study.taskProposal) });
    if (name === 'confirm-segments') return await action(name, { items: collect('segment', study.segmentProposal) });
    if (name === 'confirm-personas') return await action(name, { items: collect('persona', study.personaProposal) });
    if (name === 'revise-questions') return await action(name, { questions: collectQuestions() });
    if (name === 'update-questions') return await action(name, { questions: collectQuestions() });
    if (name === 'run') return await action(name, { sampleSize: Number(document.querySelector('#sample-size').value), seed: document.querySelector('#run-seed').value });
    await action(name);
  } catch (error) { show(error.message, true); }
});

root.addEventListener('change', event => {
  if (event.target.id === 'model-select') { selectedModel = event.target.value; localStorage.setItem('ssl-model', selectedModel); }
});

refresh().catch(error => show(error.message, true));
