# Звіт до лабораторної роботи №3 — шаблон для заповнення

> **Перед здачею:** замініть усі поля у квадратних дужках на власні дані, додайте посилання на свій GitHub-репозиторій, вивід `git log --oneline` і власні знімки екрана термінала. Версії Node.js/npm та ОС впишіть із вашого комп’ютера, не копіюйте їх із чужого середовища.

## Титульна сторінка

**[Назва закладу освіти]**  
**[Факультет / кафедра]**

### ЗВІТ
### до лабораторної роботи №3
### «Робота з Node.js, npm. Практика програмування на JavaScript»

**Варіант 7 — Опитування**

Виконав(ла): студент(ка) групи **[група]**  
**[Ім’я Прізвище]**  
Перевірив(ла): **[викладач]**

**[Місто] — 2026**

---

## 1. Мета роботи

Навчитися створювати npm-проєкт на Node.js, встановлювати та використовувати пакет `commander`, описувати CLI-команди, аргументи й опції, читати та розбирати JSON стандартними засобами Node.js, працювати з вкладеними об’єктами й масивами та обробляти помилки з коректним кодом завершення.

## 2. Варіант і вихідні дані

Номер варіанта: **7**. Предметна область: **опитування**.

Вхідний файл узято з лабораторної роботи №1. Початковий файл був названий `json.1lab.txt`; його вміст перевірено та скопійовано до проєкту під потрібною назвою `data.json`. Зміни значень даних не вносилися.

Структура JSON:

- `surveyTitle` — назва опитування;
- `questions` — масив із трьох питань; кожне має `questionId`, `text`, `questionType`, `isRequired`;
- `responses` — масив із двох записів респондентів; кожен містить `respondentName` і масив `answers`;
- кожна відповідь пов’язана з питанням через `questionId` і зберігає значення в `answerValue`.

Перевірка синтаксичної коректності:

```text
$ jq empty data.json
$ echo $?
0
```

`jq empty` не виводить текст, якщо JSON синтаксично правильний; код завершення `0` це підтверджує. Значення `respondentName: null` для другого запису та `answerValue: null` для відповіді на питання №3 є допустимими значеннями JSON. Вони не вважаються синтаксичними помилками. Програма показує їх як невказане ім’я та ненадану відповідь. Оскільки у структурі немає окремого ID респондента, для команди `respondent` використовується порядковий номер елемента в масиві `responses` (починаючи з 1).

**Примітка щодо повноти схеми:** у питання типу `singleChoice` немає окремого масиву варіантів відповіді. Це не заважає виконанню вимог цієї лабораторної роботи, оскільки реалізовані команди переглядають питання та вже наявні відповіді. Якщо специфікація лабораторної роботи №1 вимагала перелік варіантів для `singleChoice`, його треба додати згідно з початковим завданням, не вигадуючи значення.

## 3. Середовище виконання

Заповнити за результатами команд на своєму комп’ютері:

```text
Операційна система: [наприклад, Windows 11]
Оболонка: [наприклад, Git Bash]
Node.js: [результат node --version]
npm: [результат npm --version]
commander: [результат npm ls commander]
```

Команда перевірки встановленого пакета:

```bash
npm ls commander
```

У наданому проєкті `package-lock.json` фіксує `commander` версії **14.0.3** після встановлення залежності. Якщо результат локального `npm ls commander` інший, у звіт потрібно внести саме локальний результат.

## 4. Створення та структура npm-проєкту

Основні команди створення проєкту:

```bash
mkdir lab3-survey
cd lab3-survey
git init
git config --local user.name "Ім’я Прізвище lab3"
git config --local user.name
node --version
npm --version
npm init -y
npm install commander
```

У `package.json` додано поле `"type": "module"`, щоб використовувати синтаксис ESM (`import`), і сценарій `start` для запуску `index.js`. Пакет `commander` зазначений у `dependencies`, оскільки він потрібен під час роботи CLI. `package-lock.json` фіксує конкретне дерево залежностей. Каталог `node_modules/` не додається до Git.

Структура проєкту:

```text
lab3-survey/
├── .gitignore
├── data.json
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

Вміст `.gitignore`:

```text
node_modules/
```

## 5. Проєктування команд та обґрунтування рішень

Загальна опція `-f, --file <path>` задає шлях до JSON і доступна з командами програми. Якщо опцію не передано, використовується `data.json` у поточній теці. Відносні шляхи інтерпретуються від поточної теки термінала. Файли читаються через вбудований `node:fs`, JSON розбирається через `JSON.parse`; інших сторонніх пакетів, крім `commander`, немає.

| Команда | Форма виклику | Призначення та обґрунтування |
|---|---|---|
| `list` | `node index.js list [--limit <count>]` | Стислий перелік питань є корисним основним списком для предметної області опитувань. `--limit` дає змогу скоротити вивід; без нього показуються всі питання. |
| `show` | `node index.js show <questionId>` | Обов’язковий аргумент — ID питання, бо він стабільніший і зрозуміліший за номер рядка в масиві. Команда показує об’єкт питання повністю. |
| `field` | `node index.js field <path>` | Шлях задається сегментами через крапку, наприклад `responses.0.answers.1.answerValue`. Числовий сегмент після масиву означає індекс від 0. Відсутнє поле дає помилку, а наявне поле зі значенням `null` виводиться як `null`. |
| `filter-questions` | `node index.js filter-questions [--required\|--optional] [--type <type>]` | Реалізує перший пункт варіанта 7. Критерії поєднуються як логічне «І». `--required` і `--optional` взаємовиключні. Типи беруться з даних (`singleChoice`, `scale`, `freeText`), щоб не прив’язувати програму до стороннього переліку. |
| `answers` | `node index.js answers <questionId>` | Реалізує другий пункт варіанта 7. Команда проходить усіх респондентів і знаходить їхню відповідь за `questionId`; відсутній запис, відсутнє поле `answerValue` і `null` розрізняються. |
| `respondent` | `node index.js respondent <index>` | Реалізує третій пункт варіанта 7. Порядковий номер від 1 обрано тому, що в даних немає окремого ID респондента, а одне ім’я дорівнює `null`. Команда показує текст кожного питання та відповідне значення. |

Короткі назви команд і аргументів задані англійською, а описи довідки й повідомлення користувачу — українською, як вимагає методичка. `questionId`, `index`, `path`, `limit` мають перевірку формату там, де очікується ціле додатне число.

### Розглянуті альтернативи

- Для вибору респондента можна було б додати `respondentId` до JSON або шукати за ім’ям. Наявні дані не мають такого ID, а в одного респондента ім’я `null`; тому без вигадування даних обрано порядковий номер запису.
- Для `field` можна було б приймати лише назву верхньорівневого поля. Нотація з крапками дає змогу демонструвати доступ до вкладених об’єктів і масивів, чого прямо вимагає завдання.
- Для фільтра можна було б окремо запускати пошук за типом і за обов’язковістю. Опції однієї команди простіше комбінувати; при одночасній передачі суперечливих `--required` та `--optional` програма явно повідомляє про помилку.

## 6. Обробка помилок

Помилкові виклики не показують стек викликів. Для помилки програма виводить повідомлення українською та встановлює ненульовий `process.exitCode`.

Обробляються, зокрема:

- відсутній або недоступний файл;
- некоректний JSON;
- відсутні масиви верхнього рівня `questions` або `responses`;
- невідомий ID питання чи номер респондента;
- відсутнє поле за вказаним шляхом;
- нечисловий або недодатний ID/індекс/ліміт;
- невідомий тип питання;
- одночасне використання `--required` і `--optional`;
- пропущений обов’язковий CLI-аргумент та невідома опція.

Наприклад, `null` у наявному полі не трактується як відсутність поля: `field responses.1.answers.2.answerValue` повертає `null`, а `field responses.1.missing` завершується повідомленням про відсутній шлях і кодом `1`.

## 7. Приклади перевірки шести можливостей

Наведені результати відповідають вмісту `data.json`. Під кожним результатом у фінальному звіті потрібно вставити **власний знімок термінала** з виконання команди на комп’ютері студента.

### 7.1. Загальна можливість: перелік питань

```bash
npm start -- list --limit 2
```

Очікуваний результат (скорочено):

```text
Опитування: Опитування щодо якості дистанційного навчання
Питань у файлі: 3
1. [1; один варіант відповіді; обов’язкове] Чи зручно вам використовувати поточну платформу для навчання?
2. [2; шкала; обов’язкове] Оцініть якість відеозв'язку під час лекцій (від 1 до 5)
Показано 2 з 3 питань.
```

Пояснення: `--limit 2` обмежує список двома першими питаннями.

**Знімок екрана:** [вставити скриншот виконання команди 7.1]

### 7.2. Загальна можливість: одне питання повністю

```bash
npm start -- show 1
```

Очікуваний результат (скорочено):

```text
Питання 1:
{
  "questionId": 1,
  "text": "Чи зручно вам використовувати поточну платформу для навчання?",
  "questionType": "singleChoice",
  "isRequired": true
}
```

Пояснення: аргумент `1` шукає елемент масиву `questions`, у якого `questionId` дорівнює 1.

**Знімок екрана:** [вставити скриншот виконання команди 7.2]

### 7.3. Загальна можливість: окреме вкладене поле

```bash
npm start -- field responses.0.answers.1.answerValue
npm start -- field responses.1.answers.2.answerValue
```

Результати відповідно:

```text
Значення поля «responses.0.answers.1.answerValue»: 4
Значення поля «responses.1.answers.2.answerValue»: null
```

Пояснення: перший шлях проходить через масиви `responses` та `answers`; індекси масивів починаються з нуля. Другий приклад підтверджує, що явне `null` зберігається й не змішується з неіснуючим шляхом.

**Знімок екрана:** [вставити скриншот виконання команди 7.3]

### 7.4. Варіант 7: фільтр питань

```bash
npm start -- filter-questions --required --type scale
```

Очікуваний результат:

```text
Результат відбору питань:
1. [2; шкала; обов’язкове] Оцініть якість відеозв'язку під час лекцій (від 1 до 5)
Знайдено питань: 1.
```

Пояснення: одночасно перевіряються `isRequired === true` і `questionType === "scale"`.

**Знімок екрана:** [вставити скриншот виконання команди 7.4]

### 7.5. Варіант 7: відповіді всіх респондентів на обране питання

```bash
npm start -- answers 3
```

Очікуваний результат:

```text
Питання 3: Які додаткові інструменти ви б хотіли бачити?
Респондент 1 (Іван Петренко): Більше інтерактивних тестів
Респондент 2 (ім’я не вказане): null (відповідь не надана)
```

Пояснення: для кожного запису в `responses` шукається відповідь із `questionId=3`. Значення `null` показується явно.

**Знімок екрана:** [вставити скриншот виконання команди 7.5]

### 7.6. Варіант 7: усі відповіді одного респондента з текстами питань

```bash
npm start -- respondent 2
```

Очікуваний результат (скорочено):

```text
Респондент 2 (ім’я не вказане):
Питання 1: Чи зручно вам використовувати поточну платформу для навчання?
  Відповідь: Не дуже зручно
Питання 2: Оцініть якість відеозв'язку під час лекцій (від 1 до 5)
  Відповідь: 3
Питання 3: Які додаткові інструменти ви б хотіли бачити?
  Відповідь: null (відповідь не надана)
```

Пояснення: `2` означає другий запис у `responses`; питання виводяться разом із відповідями, зіставленими за ID.

**Знімок екрана:** [вставити скриншот виконання команди 7.6]

## 8. Перевірка некоректних викликів та відновлення залежностей

Перевірити такі команди; для кожної має бути зрозуміле повідомлення українською та код завершення `1`:

```bash
npm start -- show
npm start -- show 999
npm start -- show abc
npm start -- list --file missing.json
npm start -- field questions.0.noSuchField
npm start -- filter-questions --required --optional
npm start -- list --unknown
```

Для перевірки некоректного JSON створити тимчасовий файл `broken.json`, наприклад із вмістом `{ broken`, виконати:

```bash
npm start -- list --file broken.json
```

Після перевірки видалити тимчасовий файл. Для перевірки відновлення залежностей:

```bash
rm -rf node_modules
npm install
npm start -- list
```

На Windows PowerShell замість першої команди можна виконати `Remove-Item -Recurse -Force node_modules`.

**Сюди додати скриншоти перевірки помилок і повторного встановлення залежностей.**

## 9. GitHub і коміти

Посилання на репозиторій: **[вставити URL GitHub]**.

Локальне ім’я Git перевірено командою `git config --local user.name`; воно має бути у форматі `Ім’я Прізвище lab3`.

Вивід команди:

```text
git log --oneline
[вставити фактичний вивід щонайменше п’яти комітів]
```

Методичка вимагає щонайменше п’ять окремих осмислених комітів. Не вставляйте вигаданий вивід: коміти потрібно створити у власному репозиторії та вказати реальні повідомлення.

## 10. Висновки

Під час роботи було створено CLI-проєкт на Node.js і Commander для JSON-структури опитування. Найважливішим рішенням стало зіставлення відповідей із текстами питань через `questionId`: дані відповідей вкладені в `responses`, тоді як тексти питань зберігаються окремо в `questions`. Явні `null` і відсутні поля обробляються по-різному.

У наданому JSON немає окремого ідентифікатора респондента, а одне ім’я не задано, тому респондента вибирають за порядковим номером у масиві. У реальному застосунку структуру можна було б поліпшити, додавши незмінний `respondentId`, а для `singleChoice` — перелік можливих варіантів, якщо він потрібен за вимогами першої лабораторної роботи.

**Додайте власне спостереження:** [що було найскладнішим саме для вас, що ви змінили б після виконання роботи та чому].

## 11. Короткі відповіді на теоретичні питання до захисту

### 1. Що таке JavaScript? Які його основні особливості?

JavaScript — високорівнева мова програмування з динамічною типізацією, автоматичним керуванням пам’яттю та підтримкою кількох стилів програмування: процедурного, об’єктного й функціонального. Об’єктна модель мови базується на прототипах. JavaScript широко використовується у браузерах, а завдяки Node.js — також для серверних програм, CLI-утиліт та інструментів розробки. Код може виконуватися рушієм із JIT-компіляцією; конкретний спосіб виконання залежить від середовища. Асинхронність у Node.js зазвичай реалізують через події, проміси та `async/await`.

### 2. Що таке пакет, залежність і модуль?

Модуль — одиниця коду, яку можна експортувати та імпортувати. Пакет — розповсюджувана одиниця проєкту/коду з метаданими, зазвичай описаними у `package.json`; пакет може містити один або багато модулів. Залежність — пакет, від якого залежить застосунок і який потрібен йому для роботи або розробки. У цій роботі `commander` є пакетом-залежністю, а `index.js` імпортує з нього `Command`.

### 3. Як створити проєкт у Node.js?

Потрібно встановити Node.js (разом із npm), створити каталог проєкту й виконати `npm init -y`, щоб сформувати `package.json`. Потім створити вихідний файл, за потреби встановити залежності через `npm install <назва-пакета>`, налаштувати сценарії у `package.json` і запускати програму через `node index.js` або `npm run <сценарій>`. Для цієї роботи додатково вказано `"type": "module"` і сценарій `start`.

### 4. Що таке Node.js і npm?

Node.js — середовище виконання JavaScript поза браузером. Воно використовує рушій V8 та надає API для роботи з файлами, мережею, процесом тощо. npm — менеджер пакетів Node.js і реєстр пакетів; за його допомогою залежності встановлюють, описують у проєкті, оновлюють і публікують. Команди `npm install` та `npm run` використовуються відповідно для встановлення залежностей і запуску сценаріїв.

### 5. Для чого потрібні `package.json`, `package-lock.json` і `node_modules`?

`package.json` зберігає назву та версію проєкту, тип модулів, сценарії, залежності й інші метадані. `package-lock.json` фіксує конкретні версії та дерево встановлених залежностей, щоб відновлення було відтворюванішим. `node_modules` — каталог фактично встановлених пакетів; його зазвичай не комітять, бо залежності можна відновити з маніфесту й lock-файлу.

### 6. Як встановити залежності і чим відрізняються `dependencies` від `devDependencies`?

Якщо проєкт уже має `package.json` і `package-lock.json`, залежності відновлюють командою `npm install` (або `npm ci` для встановлення відповідно до lock-файлу без його оновлення). npm читає перелік і версії з файлів, завантажує пакети з налаштованого реєстру або кешу та розміщує їх у `node_modules`. `dependencies` потрібні застосунку під час звичайної роботи; `devDependencies` потрібні лише під час розробки, тестування або збирання. `commander` у цій роботі належить до `dependencies`, бо потрібен при запуску CLI.

### 7. Як працювати з JSON у JavaScript?

JSON-текст перетворюють на JavaScript-значення методом `JSON.parse(text)`, а значення перетворюють на JSON-текст методом `JSON.stringify(value)`. Файл читають засобами Node.js, наприклад `readFileSync(path, 'utf8')`, після чого викликають `JSON.parse`. Потрібно враховувати можливий виняток для некоректного JSON і перевіряти структуру даних: синтаксично правильний JSON може не мати очікуваних масивів або полів. У цій програмі кореневе значення має бути об’єктом, а `questions` і `responses` — масивами.

### 8. Як працювати з файловою системою в Node.js?

Node.js надає вбудований модуль `node:fs` і його промісний варіант `node:fs/promises`. Є синхронні методи, наприклад `readFileSync`, і асинхронні методи/проміси, наприклад `readFile`. Для шляхів використовують `node:path`, щоб коректно обробляти абсолютні та відносні адреси. Операції з файлами потрібно обгортати обробкою помилок, наприклад для випадку неіснуючого файла або відсутності прав доступу. Тут використано синхронне читання, оскільки CLI одноразово завантажує невеликий JSON перед виконанням команди.

### 9. Чим відрізняються CommonJS і ESM?

CommonJS використовує `require()` та `module.exports`; ESM використовує `import` і `export`. CommonJS традиційно є системою модулів Node.js, тоді як ESM — стандартний модульний формат JavaScript із статичними імпортами й експортами. У Node.js ESM вмикають, зокрема, через поле `"type": "module"` у `package.json` або розширення `.mjs`; CommonJS можна позначити `.cjs` або залишити типовим форматом у відповідній конфігурації. У цьому проєкті застосовано ESM: `index.js` імпортує вбудовані модулі та `Command`.

## Додаток А. Повний текст `index.js`

```js
#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';

const VERSION = '1.0.0';
const program = new Command();

class CliError extends Error {}

function showError(error) {
  if (error instanceof CliError) {
    console.error(`Помилка: ${error.message}`);
  } else {
    // Не виводимо стек викликів або внутрішні технічні подробиці користувачу.
    console.error('Помилка: сталася неочікувана помилка під час виконання команди.');
  }
  process.exitCode = 1;
}

function safely(action) {
  return (...args) => {
    try {
      action(...args);
    } catch (error) {
      showError(error);
    }
  };
}

function commanderErrorInUkrainian(message) {
  const text = message.trim().replace(/^error:\s*/i, '');
  let match = text.match(/^unknown option ['"](.+?)['"]$/i);
  if (match) return `невідома опція «${match[1]}».`;

  match = text.match(/^option ['"](.+?)['"] argument missing$/i);
  if (match) return `для опції «${match[1]}» потрібно вказати значення.`;

  match = text.match(/^missing required argument ['"](.+?)['"]$/i);
  if (match) return `не вказано обов’язковий аргумент «${match[1]}».`;

  match = text.match(/^unknown command ['"](.+?)['"]$/i);
  if (match) return `невідома команда «${match[1]}».`;

  if (/too many arguments/i.test(text)) return 'передано забагато аргументів.';
  if (/cannot be used with option/i.test(text)) return `несумісні опції: ${text}.`;
  return `не вдалося розібрати команду: ${text}.`;
}

program
  .name('survey-cli')
  .description('Командна програма для перегляду даних опитування')
  .version(VERSION, '-V, --version', 'Показати версію програми')
  .helpOption('-h, --help', 'Показати довідку')
  .addHelpCommand('help [command]', 'Показати довідку для вказаної команди')
  .option('-f, --file <path>', 'Шлях до JSON-файлу опитування (типово: data.json)')
  .configureOutput({
    outputError: (message, write) => write(`Помилка: ${commanderErrorInUkrainian(message)}\n`),
  })
  .configureHelp({
    showGlobalOptions: true,
    styleTitle: (title) => ({
      'Usage:': 'Використання:',
      'Arguments:': 'Аргументи:',
      'Options:': 'Опції:',
      'Global Options:': 'Глобальні опції:',
      'Commands:': 'Команди:',
    })[title] ?? title,
  })
  .showHelpAfterError('Підказка: для довідки виконайте «node index.js --help».');

function loadSurvey(fileOption) {
  const filePath = resolve(fileOption);
  let text;

  try {
    text = readFileSync(filePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new CliError(`файл «${filePath}» не знайдено.`);
    }
    if (error?.code === 'EACCES') {
      throw new CliError(`немає дозволу прочитати файл «${filePath}».`);
    }
    throw new CliError(`не вдалося прочитати файл «${filePath}».`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    const position = Number(String(error?.message ?? '').match(/position\s+(\d+)/i)?.[1]);
    const location = Number.isInteger(position)
      ? ` (рядок ${text.slice(0, position).split('\n').length})`
      : '';
    throw new CliError(`файл «${filePath}» містить некоректний JSON${location}.`);
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new CliError('кореневе значення JSON має бути об’єктом.');
  }
  if (!Array.isArray(data.questions)) {
    throw new CliError('у JSON немає масиву «questions» або він має неправильний формат.');
  }
  if (!Array.isArray(data.responses)) {
    throw new CliError('у JSON немає масиву «responses» або він має неправильний формат.');
  }

  return data;
}

function getSurvey(command) {
  const { file = 'data.json' } = command.optsWithGlobals();
  return loadSurvey(file);
}

function parsePositiveInteger(rawValue, label) {
  if (!/^\d+$/.test(String(rawValue))) {
    throw new CliError(`значення «${rawValue}» для ${label} має бути додатним цілим числом.`);
  }
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new CliError(`значення для ${label} має бути додатним цілим числом.`);
  }
  return value;
}

function formatQuestionType(type) {
  const labels = {
    singleChoice: 'один варіант відповіді',
    scale: 'шкала',
    freeText: 'вільна відповідь',
  };
  return labels[type] ?? String(type ?? 'тип не вказано');
}

function formatRespondentName(name) {
  if (name === null || name === undefined || name === '') return 'ім’я не вказане';
  return String(name);
}

function formatAnswerValue(value) {
  if (value === null) return 'null (відповідь не надана)';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function findQuestion(data, rawId) {
  const id = parsePositiveInteger(rawId, 'ідентифікатора питання');
  const question = data.questions.find((item) => item && String(item.questionId) === String(id));
  if (!question) throw new CliError(`питання з ідентифікатором ${id} не знайдено.`);
  return question;
}

function printQuestionSummary(question, number) {
  const requiredLabel = question.isRequired === true
    ? 'обов’язкове'
    : question.isRequired === false
      ? 'необов’язкове'
      : 'обов’язковість не вказана';
  console.log(`${number}. [${question.questionId ?? 'без ID'}; ${formatQuestionType(question.questionType)}; ${requiredLabel}] ${question.text ?? '(текст відсутній)'}`);
}

program
  .command('list')
  .description('Показати стислий перелік питань опитування')
  .option('-l, --limit <count>', 'Обмежити кількість питань у списку')
  .action(safely((options, command) => {
    const data = getSurvey(command);
    let limit = data.questions.length;
    if (options.limit !== undefined) {
      limit = parsePositiveInteger(options.limit, 'обмеження кількості');
    }
    const questions = data.questions.slice(0, limit);
    console.log(`Опитування: ${data.surveyTitle ?? '(назву не вказано)'}`);
    console.log(`Питань у файлі: ${data.questions.length}`);
    if (questions.length === 0) {
      console.log('Питань немає.');
      return;
    }
    questions.forEach((question, index) => printQuestionSummary(question, index + 1));
    if (questions.length < data.questions.length) {
      console.log(`Показано ${questions.length} з ${data.questions.length} питань.`);
    }
  }));

program
  .command('show')
  .description('Показати одне питання повністю у форматі JSON')
  .argument('<questionId>', 'Ідентифікатор питання')
  .action(safely((rawId, _options, command) => {
    const data = getSurvey(command);
    const question = findQuestion(data, rawId);
    console.log(`Питання ${question.questionId}:`);
    console.log(JSON.stringify(question, null, 2));
  }));

program
  .command('field')
  .description('Показати значення поля за шляхом через крапки; індекси масивів також задаються через крапки')
  .argument('<path>', 'Шлях до поля, наприклад questions.0.text')
  .action(safely((fieldPath, _options, command) => {
    const data = getSurvey(command);
    const segments = String(fieldPath).split('.');
    if (segments.length === 0 || segments.some((segment) => segment.length === 0)) {
      throw new CliError('шлях до поля порожній або має порожній сегмент.');
    }

    let value = data;
    for (const segment of segments) {
      if (value === null || typeof value !== 'object') {
        throw new CliError(`не знайдено поле за шляхом «${fieldPath}».`);
      }
      if (Array.isArray(value)) {
        if (!/^\d+$/.test(segment)) {
          throw new CliError(`сегмент «${segment}» має бути числовим індексом масиву у шляху «${fieldPath}».`);
        }
        const index = Number(segment);
        if (!Number.isSafeInteger(index) || index >= value.length || !Object.hasOwn(value, index)) {
          throw new CliError(`не знайдено поле за шляхом «${fieldPath}».`);
        }
        value = value[index];
      } else {
        if (!Object.hasOwn(value, segment)) {
          throw new CliError(`не знайдено поле за шляхом «${fieldPath}».`);
        }
        value = value[segment];
      }
    }

    console.log(`Значення поля «${fieldPath}»: ${JSON.stringify(value, null, 2)}`);
  }));

program
  .command('filter-questions')
  .description('Відібрати питання за обов’язковістю та/або типом')
  .option('--required', 'Показати лише обов’язкові питання')
  .option('--optional', 'Показати лише необов’язкові питання')
  .option('-t, --type <type>', 'Фільтр за типом, наприклад singleChoice, scale або freeText')
  .action(safely((options, command) => {
    if (options.required && options.optional) {
      throw new CliError('опції --required і --optional не можна використовувати одночасно.');
    }

    const data = getSurvey(command);
    if (options.type !== undefined) {
      const validTypes = [...new Set(data.questions.map((question) => question?.questionType).filter(Boolean))];
      if (!validTypes.includes(options.type)) {
        throw new CliError(`невідомий тип питання «${options.type}». Допустимі типи у файлі: ${validTypes.join(', ') || '(немає)'}.`);
      }
    }

    const filtered = data.questions.filter((question) => {
      if (options.required && question?.isRequired !== true) return false;
      if (options.optional && question?.isRequired !== false) return false;
      if (options.type !== undefined && question?.questionType !== options.type) return false;
      return true;
    });

    console.log('Результат відбору питань:');
    if (filtered.length === 0) {
      console.log('За заданими умовами питань не знайдено.');
      return;
    }
    filtered.forEach((question, index) => printQuestionSummary(question, index + 1));
    console.log(`Знайдено питань: ${filtered.length}.`);
  }));

program
  .command('answers')
  .description('Показати відповіді всіх респондентів на одне питання')
  .argument('<questionId>', 'Ідентифікатор питання')
  .action(safely((rawId, _options, command) => {
    const data = getSurvey(command);
    const question = findQuestion(data, rawId);
    console.log(`Питання ${question.questionId}: ${question.text ?? '(текст відсутній)'}`);

    data.responses.forEach((response, index) => {
      const answers = Array.isArray(response?.answers) ? response.answers : [];
      const answer = answers.find((item) => item && String(item.questionId) === String(question.questionId));
      const name = formatRespondentName(response?.respondentName);
      if (!answer) {
        console.log(`Респондент ${index + 1} (${name}): запис відповіді відсутній.`);
      } else if (!Object.hasOwn(answer, 'answerValue')) {
        console.log(`Респондент ${index + 1} (${name}): поле answerValue відсутнє.`);
      } else {
        console.log(`Респондент ${index + 1} (${name}): ${formatAnswerValue(answer.answerValue)}`);
      }
    });
    if (data.responses.length === 0) console.log('У файлі немає респондентів.');
  }));

program
  .command('respondent')
  .description('Показати всі відповіді одного респондента разом із текстами питань')
  .argument('<index>', 'Порядковий номер респондента у масиві responses (починаючи з 1)')
  .action(safely((rawIndex, _options, command) => {
    const data = getSurvey(command);
    const index = parsePositiveInteger(rawIndex, 'порядкового номера респондента');
    const response = data.responses[index - 1];
    if (!response) {
      throw new CliError(`респондента з порядковим номером ${index} не знайдено; у файлі записів: ${data.responses.length}.`);
    }
    if (!Array.isArray(response.answers)) {
      throw new CliError(`у записі респондента ${index} поле «answers» відсутнє або не є масивом.`);
    }

    console.log(`Респондент ${index} (${formatRespondentName(response.respondentName)}):`);
    data.questions.forEach((question) => {
      const answer = response.answers.find((item) => item && String(item.questionId) === String(question?.questionId));
      const questionText = question?.text ?? '(текст питання відсутній)';
      if (!answer) {
        console.log(`Питання ${question?.questionId ?? '(без ID)'}: ${questionText}\n  Відповідь: запис відсутній.`);
      } else if (!Object.hasOwn(answer, 'answerValue')) {
        console.log(`Питання ${question?.questionId ?? '(без ID)'}: ${questionText}\n  Відповідь: поле answerValue відсутнє.`);
      } else {
        console.log(`Питання ${question?.questionId ?? '(без ID)'}: ${questionText}\n  Відповідь: ${formatAnswerValue(answer.answerValue)}`);
      }
    });

    const questionIds = new Set(data.questions.map((question) => String(question?.questionId)));
    const orphanAnswers = response.answers.filter((answer) => answer && !questionIds.has(String(answer.questionId)));
    orphanAnswers.forEach((answer) => {
      console.log(`Відповідь для невідомого питання ${answer.questionId}: ${Object.hasOwn(answer, 'answerValue') ? formatAnswerValue(answer.answerValue) : '(поле answerValue відсутнє)'}`);
    });
  }));

try {
  program.parse();
} catch (error) {
  // Commander сам друкує допомогу/версію та генерує контрольовану помилку для exitOverride.
  if (error?.code === 'commander.helpDisplayed' || error?.code === 'commander.version') {
    process.exitCode = 0;
  } else if (error?.code?.startsWith?.('commander.')) {
    process.exitCode = Number.isInteger(error.exitCode) ? error.exitCode : 1;
  } else {
    showError(error);
  }
}
```

## Додаток Б. `package.json`

```json
{
  "name": "survey-cli-lab3",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "commander": "^14.0.3"
  },
  "scripts": {
    "start": "node index.js"
  },
  "keywords": [
    "survey",
    "cli",
    "commander",
    "nodejs"
  ],
  "author": "",
  "license": "ISC",
  "description": "CLI-програма для роботи з даними опитування (Лабораторна робота №3)",
  "type": "module"
}
```

## Додаток В. `data.json`

```json
{
  "surveyTitle": "Опитування щодо якості дистанційного навчання",
  "questions": [
    {
      "questionId": 1,
      "text": "Чи зручно вам використовувати поточну платформу для навчання?",
      "questionType": "singleChoice",
      "isRequired": true
    },
    {
      "questionId": 2,
      "text": "Оцініть якість відеозв'язку під час лекцій (від 1 до 5)",
      "questionType": "scale",
      "isRequired": true
    },
    {
      "questionId": 3,
      "text": "Які додаткові інструменти ви б хотіли бачити?",
      "questionType": "freeText",
      "isRequired": false
    }
  ],
  "responses": [
    {
      "respondentName": "Іван Петренко",
      "answers": [
        {
          "questionId": 1,
          "answerValue": "Так, зручно"
        },
        {
"questionId": 2,
          "answerValue": 4
        },
        {
          "questionId": 3,
          "answerValue": "Більше інтерактивних тестів"
        }
      ]
    },
    {
      "respondentName": null,
      "answers": [
        {
          "questionId": 1,
          "answerValue": "Не дуже зручно"
        },
        {
          "questionId": 2,
          "answerValue": 3
        },
        {
          "questionId": 3,
          "answerValue": null
        }
      ]
    }
]
}
```
