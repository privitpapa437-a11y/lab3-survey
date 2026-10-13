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
