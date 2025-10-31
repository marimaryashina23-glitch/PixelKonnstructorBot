const { Telegraf, Markup } = require('telegraf');

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN);

// Хранилище ответов пользователей
const userResponses = {};

// Фирменные фразы KonnCode
const brandPhrases = [
  "✨ Помни: красивый код = красивый сайт",
  "🎨 Проектирую как художник, кодирую как перфекционист", 
  "🛠 Каждый пиксель должен быть на своем месте",
  "⚡ I don't just code - I draw with code!",
  "🌟 Твой сайт - это цифровой портрет бизнеса",
  "💫 Превращаю идеи в цифровые шедевры",
  "🎯 Пиксель-перфект подход в каждом проекте"
];

// Получить случайную фирменную фразу
function getRandomBrandPhrase() {
  return brandPhrases[Math.floor(Math.random() * brandPhrases.length)];
}

// ==================== КОМАНДА /start ====================
bot.start(async (ctx) => {
  const chatId = ctx.message.chat.id;
  userResponses[chatId] = {
    step: 1,
    answers: {},
    startTime: new Date()
  };
  
  await ctx.replyWithMarkdownV2(`\
🎨 Добро пожаловать в PixelKonnstructor 

Твой проводник в мире идеальных сайтов

✨ Моя философия: I draw with code\\!
🎯 Мой подход: каждый пиксель на своем месте
💫 Моя миссия: превратить твою идею в цифровой шедевр

Готов создать проект, который расскажет твою историю?

📌 Вопрос 1/6:
Как называется твой проект или компания?`);

  // Добавляем первую фирменную фразу
  setTimeout(() => {
    ctx.reply(getRandomBrandPhrase());
  }, 1500);
});

// ==================== ОБРАБОТКА ОТВЕТОВ ====================
bot.on('text', async (ctx) => {
  const chatId = ctx.message.chat.id;
  const text = ctx.message.text;

  // Проверяем, начал ли пользователь диалог
  if (!userResponses[chatId]) {
    return ctx.reply('🎨 Пожалуйста, начни с команды /start');
  }

  const userData = userResponses[chatId];
  const currentStep = userData.step;

  try {
    switch (currentStep) {
      case 1: // Название проекта
        userData.answers.projectName = text;
        userData.step = 2;
        
        await ctx.replyWithMarkdownV2(`💫 Отлично\\! \"${text}\" - звучит интригующе\\!

${getRandomBrandPhrase()}

🎯 Вопрос 2/6:
Какая основная цель сайта?`);

        // Клавиатура с вариантами целей
        await ctx.reply('Выбери вариант или напиши свой:', Markup.keyboard([
          ['🛒 Продавать товары/услуги', '📞 Принимать заявки'],
          ['🏢 Представлять компанию', '✍️ Вести блог'],
          ['🎨 Портфолио работ', '🚀 Другое']
        ]).oneTime().resize());
        break;

      case 2: // Цель сайта
        userData.answers.goal = text;
        userData.step = 3;
        
        await ctx.replyWithMarkdownV2(`📊 Поняла цель\\! 
\"${text}\" - отличный ориентир для разработки

${getRandomBrandPhrase()}

💰 Вопрос 3/6:
Какой бюджет на создание сайта?`, Markup.removeKeyboard());

        // Клавиатура с бюджетами
        await ctx.reply('Выбери подходящий диапазон:', Markup.keyboard([
          ['💎 до 30 тыс. руб.', '🚀 30-70 тыс. руб.'],
          ['🎯 более 70 тыс. руб.', '🤝 Нужна консультация']
        ]).oneTime().resize());
        break;

      case 3: // Бюджет
        userData.answers.budget = text;
        userData.step = 4;
        
        await ctx.replyWithMarkdownV2(`💼 Бюджет \"${text}\" - я смогу предложить оптимальное решение\\!

${getRandomBrandPhrase()}

⏱️ Вопрос 4/6:
В какие сроки нужен сайт?`, Markup.removeKeyboard());

        // Клавиатура со сроками
        await ctx.reply('Выбери подходящий вариант:', Markup.keyboard([
          ['⚡ Срочно (до 2 недель)', '📅 Стандартно (1 месяц)'],
          ['🕐 Не спеша (2+ месяца)', '🗓️ Пока не знаю']
        ]).oneTime().resize());
        break;

      case 4: // Сроки
        userData.answers.deadline = text;
        userData.step = 5;
        
        await ctx.replyWithMarkdownV2(`📅 Срок \"${text}\" - учту при планировании работы\\!

${getRandomBrandPhrase()}

🎨 Вопрос 5/6:
Есть ли предпочтения по платформе?`, Markup.removeKeyboard());

        // Клавиатура с платформами
        await ctx.reply('Выбери вариант:', Markup.keyboard([
          ['💻 Чистый код (HTML/CSS/JS)', '⚙️ Tilda'],
          ['🎨 Figma макет', '🤷 Пока не знаю']
        ]).oneTime().resize());
        break;

      case 5: // Платформа
        userData.answers.platform = text;
        userData.step = 6;
        
        await ctx.replyWithMarkdownV2(`🔧 \"${text}\" - отличный выбор\\!

${getRandomBrandPhrase()}

✨ Вопрос 6/6:
Оставь контакт для связи`, Markup.removeKeyboard());

        await ctx.reply('📞 Телефон, email или username в Telegram:');
        break;

      case 6: // Контакт
        userData.answers.contact = text;
        userData.answers.completionTime = new Date();
        
        // Отправляем финальное сообщение пользователю
        await sendFinalMessage(ctx, userData.answers);
        
        // Отправляем уведомление администратору
        await sendAdminNotification(ctx, userData.answers);
        
        // Очищаем данные пользователя
        delete userResponses[chatId];
        break;
    }
  } catch (error) {
    console.error('Ошибка:', error);
    ctx.reply('🛠 Упс! Что-то пошло не так. Попробуй снова: /start');
  }
});

// ==================== ФИНАЛЬНОЕ СООБЩЕНИЕ ====================
async function sendFinalMessage(ctx, answers) {
  const finalMessage = `\
🎨 СПАСИБО ЗА ОТВЕТЫ\\!

Твой проект принят в работу PixelKonnstructor

Твои ответы стали основой для будущего шедевра:
🏢 Проект: ${answers.projectName}
🎯 Цель: ${answers.goal}  
💰 Бюджет: ${answers.budget}
⏱ Сроки: ${answers.deadline}
🔧 Платформа: ${answers.platform}
📞 Контакт: ${answers.contact}

✨ Что дальше?
1\\. Я изучаю твои ответы и продумываю концепцию
2\\. Создаю эскиз и стратегию реализации  
3\\. Связываюсь с тобой в течение 24 часов для обсуждения деталей

🛠 Помни: я не просто кодер \\- я художник цифрового пространства
💫 I draw with code \\- и твой сайт станет моим новым холстом\\!

С уважением,
Мария Коннова \\(KonnCode\\)
Автор PixelKonnstructor

💌 P\\.S\\. Ты только что стал частью цифрового искусства\\!`;

  await ctx.replyWithMarkdownV2(finalMessage);
}

// ==================== УВЕДОМЛЕНИЕ АДМИНИСТРАТОРУ ====================
async function sendAdminNotification(ctx, answers) {
  const adminChatId = process.env.ADMIN_CHAT_ID;
  
  if (!adminChatId) {
    console.log('ADMIN_CHAT_ID не настроен');
    return;
  }

  const notification = `\
🎉 НОВАЯ ЗАЯВКА В PIXELKONNSTRUCTOR

👤 Клиент: ${ctx.message.from.first_name} ${ctx.message.from.last_name || ''} 
📱 Username: @${ctx.message.from.username || 'не указан'}
🆔 ID: ${ctx.message.from.id}
📞 Контакт: ${answers.contact}

ДЕТАЛИ ПРОЕКТА:
🏢 Проект: ${answers.projectName}
🎯 Цель: ${answers.goal}
💰 Бюджет: ${answers.budget}  
⏱ Сроки: ${answers.deadline}
🔧 Платформа: ${answers.platform}

⚡ I draw with code \\- time to create magic\\!`;

  try {
    await ctx.telegram.sendMessage(adminChatId, notification, { 
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [[
          { text: '💌 Написать клиенту', url: tg://user?id=${ctx.message.from.id} }
        ]]
      }
    });
  } catch (error) {
    console.error('Ошибка отправки уведомления:', error);
  }
}

// ==================== КОМАНДА /help ====================
bot.help((ctx) => {
  ctx.replyWithMarkdownV2(`\
🛠 PixelKonnstructor \\- помощь

Доступные команды:
/start \\- начать опрос для нового проекта
/help \\- показать эту справку

О боте:
PixelKonnstructor \\- это интеллектуальный помощник для создания идеальных сайтов от Марии Конновой \\(KonnCode\\)

✨ Философия: I draw with code\\!
🎨 Подход: пиксель\\-перфект

По вопросам сотрудничества:
💌 Напиши мне @KonnCode`);
});

// ==================== ОБРАБОТКА СТИКЕРОВ И ДРУГИХ СООБЩЕНИЙ ====================
bot.on('sticker', (ctx) => ctx.reply('🎨 Крутой стикер! Но давай лучше поговорим о твоём будущем сайте 😊'));
bot.on('photo', (ctx) => ctx.reply('🖼 Интересное изображение! Можешь описать, какой стиль тебе нравится для сайта?'));

// ==================== ОБРАБОТКА ОШИБОК ====================
bot.catch((err, ctx) => {
  console.error(Ошибка для ${ctx.updateType}:, err);
  ctx.reply('🛠 Упс! Произошла техническая ошибка. Попробуй снова: /start');
});

// ==================== ЗАПУСК БОТА ====================
bot.launch().then(() => {
  console.log('🎨 PixelKonnstructor запущен и готов к творчеству!');
}).catch(err => {
  console.error('Ошибка запуска бота:', err);
});

// ==================== ГРАЦИОЗНОЕ ВЫКЛЮЧЕНИЕ ====================
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
