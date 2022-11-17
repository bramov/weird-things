const TelegramBot = require('node-telegram-bot-api');

require('dotenv').config();
const token = process.env.TELEGRAM_KEY;
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  if (msg.text.includes('странно')) {
    await bot.sendMessage(msg.chat.id, 'Под словом `странно` подразумевается оценочное суждение. Данное слово не пытается никого оскорбить или задеть.')
  }
});