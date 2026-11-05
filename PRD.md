# PRD — Synthetic Survey Lab

**Status:** Initial Input  
**Purpose:** Training project for Baseline-Driven Product Engineering System

## 1. Product

Synthetic Survey Lab — web-приложение, в котором пользователь формулирует бизнес-проблему, подтверждает предложенные системой исследовательские задачи, сегменты и персоны, проводит и уточняет синтетический опрос и получает отчёт для принятия решения.

Продукт используется как учебный проект для проверки полного цикла Baseline-Driven Product Engineering System.

---

## 2. Problem

Проведение реальных пользовательских исследований требует времени, бюджета и доступа к респондентам.

Synthetic Survey Lab должен предоставить простой способ быстро провести предварительный синтетический опрос и получить результаты, которые могут использоваться для формирования гипотез перед реальным исследованием.

Первая версия продукта не должна доказывать эквивалентность synthetic respondents реальным людям.

Она должна создать полностью работающий и измеримый baseline, который затем может улучшаться экспериментально.

---

## 3. Target User

Основной пользователь:

Product Manager / Product Researcher.

Пользователь не обязан обладать навыками программирования.

---

## 4. Primary Job

Когда у пользователя появляется бизнес-проблема, он хочет превратить её в проверяемые исследовательские задачи, выбрать релевантные сегменты и персоны, провести предварительный синтетический опрос, проверить качество вопросов и ответов и получить отчёт для определения следующих действий.

---

## 5. MVP Outcome

Пользователь должен иметь возможность пройти полный путь:

Формализовать бизнес-проблему

→ Подтвердить предложенные системой исследовательские задачи

→ Подтвердить рекомендованные сегменты опроса

→ Подтвердить созданные системой персоны и их описания для каждого сегмента

→ Получить опросную форму и пройти её формальную проверку

→ Провести синтетический опрос

→ Провести после опроса когнитивное интервью, при необходимости исправить или добавить вопросы и повторить опрос

→ Проверить ответы на карикатерность

→ Получить отчёт для принятия решения

→ Сохранить и после перезапуска открыть исследование вместе с версиями опроса и результатами.

---

## 6. Core User Scenarios

### SC-001 — Formalize Business Problem

Пользователь вводит бизнес-проблему и описание целевой аудитории и создаёт исследование. Observable outcome: обе формулировки открываются в workspace и сохраняются. Описание аудитории влияет на предлагаемые профили персон, а профиль — на ответы.

### SC-002 — Confirm Research Tasks

Система формирует исследовательские задачи из бизнес-проблемы. Пользователь просматривает и подтверждает их. Observable outcome: подтверждённые задачи и их связь с проблемой видны в исследовании; без подтверждения следующий этап не выполняется.

### SC-003 — Confirm Segments

Система рекомендует сегменты для опроса на основе подтверждённых задач. Пользователь просматривает и подтверждает сегменты. Observable outcome: видны подтверждённые сегменты и основание рекомендации; неподтверждённые сегменты не используются в опросе.

### SC-004 — Confirm Personas

Для каждого подтверждённого сегмента система формирует набор синтетических персон и их описания. Пользователь просматривает и подтверждает их. Observable outcome: каждая утверждённая персона связана с сегментом, а её профиль влияет на формирование ответов.

### SC-005 — Prepare, Validate and Revise Survey

Система готовит опросную форму по исследовательским задачам и выполняет формальную проверку перед опросом. После синтетического опроса проводится когнитивное интервью **с синтетическими персонами**: исследуется, как персона поняла вопрос и пришла к ответу. При обнаружении проблемы пользователь может исправить или добавить вопросы и провести повторный опрос. Observable outcome: сохранены версия формы, результаты проверки, замечания интервью, изменения и отдельный повторный run. Для B0 достаточно простых вопросов с ограниченными вариантами ответа либо шкалой.

### SC-006 — Check Caricature in Responses

Система проверяет ответы на признаки карикатурности или стереотипного уплощения персон. Observable outcome: пользователь видит выявленные признаки, подтверждающие примеры и ограничения проверки; отсутствие флагов не объявляется доказательством отсутствия искажений.

### SC-007 — Decision Report

Система формирует отчёт, связывающий бизнес-проблему, задачи, сегменты, персоны, версии анкеты, результаты опросов, замечания по качеству и выводы для решения. Observable outcome: пользователь может открыть отчёт и отличить синтетические наблюдения от подтверждённых фактов о людях.

### SC-008 — Save and Reopen

После перезапуска приложения пользователь открывает исследование с подтверждениями, версиями анкеты, обоими run и отчётом. Observable outcome: end-to-end persistence подтверждена.

---

## 7. Golden Path B0

Business Problem → Research Tasks [подтверждение пользователя] → Segments [подтверждение] → Personas [подтверждение] → Questionnaire [формальная проверка] → Synthetic Survey → Cognitive Interview → исправление или добавление вопроса → Repeat Survey → Caricature Check → Decision Report → Restart → Reopen Research and Report.

Golden Path должен воспроизводимо работать целиком.

---

## 8. Functional Scope B0

B0 должен поддерживать только возможности, необходимые Golden Path.

Система synthetic respondents может использовать самый простой разумный подход, выбранный после исследования открытых источников.

В B0 должна прослеживаться цепочка: бизнес-проблема → исследовательские задачи → сегменты → персоны → вопросы → ответы → проверка качества → отчёт. Сегмент и профиль персоны должны влиять на ответы, а не только на название или случайный seed.

Подтверждение задач, сегментов и персон пользователем — обязательные точки контроля. Изменение анкеты после интервью создаёт новую версию и новый run; прежние результаты не перезаписываются.

Для B0 приоритетом является работоспособность полного продукта, а не максимальное качество synthetic simulation.

---

## 9. Research Requirement

Перед выбором реализации система должна провести исследование открытых источников по следующим направлениям:

open-source survey applications and libraries;

synthetic respondent implementations;

persona generation approaches;

survey execution approaches;

questionnaire generation, formal validation and cognitive interviewing;

checks for stereotyped or caricatured synthetic responses;

decision-report preparation and provenance;

evaluation approaches for synthetic respondents;

available benchmarks;

reusable frontend/backend components;

licenses and reuse constraints.

Результаты исследования должны разделять:

ESTABLISHED;

CANDIDATE;

CONFLICT;

UNKNOWN.

Неопределённые подходы должны становиться Hypotheses, а не автоматически включаться в production baseline.

---

## 10. Open Source Requirement

Для каждой существенной capability система должна проверить наличие существующего open-source решения.

Допустимые решения:

REUSE_AS_IS;

ADAPT;

EXTRACT;

REFERENCE;

BUILD.

Приоритет:

reuse before build, если reuse сокращает путь до работающего продукта и не создаёт неприемлемых технических или лицензионных ограничений.

---

## 11. Frontend

Продукт должен иметь web frontend.

Пользователь должен выполнять Golden Path через UI.

Frontend technology не задаётся PRD и выбирается системой после технического и open-source исследования.

---

## 12. Backend

Продукт должен иметь backend.

Backend отвечает минимум за:

research persistence;

generation and confirmation of research tasks, segments and personas;

survey definition, versioning and formal validation;

synthetic survey execution;

post-survey cognitive interview and revision cycle;

caricature checks and decision report;

result persistence;

result retrieval.

Backend technology не задаётся PRD и выбирается системой после исследования.

---

## 13. Persistence

B0 должен иметь реальное локальное persistence.

Данные исследования не должны исчезать после restart приложения.

---

## 14. Evaluation

До реализации B0 система должна сформировать Initial Evaluation Contract.

Если надёжной внешней ground truth ещё нет, это должно быть явно зафиксировано.

Первая evaluation должна минимум измерять:

Golden Path success;

approval-gate compliance;

questionnaire validation and revision traceability;

segment/persona conditioning and caricature-check coverage;

run failure rate;

reproducibility;

latency;

операционную стоимость, если используются платные модели;

доступные baseline quality metrics synthetic responses.

---

## 15. Continuous Improvement

После создания B0 текущая версия становится Champion.

Research knowledge должно использоваться для создания Hypothesis Backlog.

Каждая гипотеза тестируется относительно текущего baseline.

Implementation-changing hypotheses должны выполняться в отдельных experiment branches/worktrees.

Успешный candidate может стать новым baseline только после:

experiment evaluation;

product-level evaluation;

guardrail verification;

Golden Path regression;

working frontend/backend verification;

owner approval.

---

## 16. Out of Scope B0

B0 не требует:

enterprise authentication;

multi-user collaboration;

billing;

complex permissions;

production cloud deployment;

high-scale infrastructure;

mobile application;

advanced survey builder;

complex branching logic;

real respondent collection;

perfect synthetic respondent validity;

multi-agent architecture;

autonomous experiment promotion.

---

## 17. Primary B0 Success Criterion

B0 успешен, если новый пользователь может пройти обновлённый Golden Path целиком через работающий frontend и backend без ручного изменения данных или кода, включая три подтверждения, повторный опрос после изменения вопроса, проверку карикатурности и отчёт.

---

## 18. Product Evolution Criterion

После B0 улучшение продукта определяется относительно текущего Champion Baseline, а не относительно первоначального MVP.

Каждый новый baseline должен быть:

полностью работающим;

воспроизводимым;

измеренным;

не хуже guardrails предыдущего baseline;

подтверждённым экспериментом либо новым успешно принятым product scenario.
