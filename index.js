const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const https = require('https');

require('dotenv').config();

const {
  TELEGRAM_KEY, YANDEX_IAM_KEY, YANDEX_FOLDER
} = process.env;

const bot = new TelegramBot(TELEGRAM_KEY, { polling: true });

bot.on('message', async (msg) => {
  if (msg?.text && msg.text.includes('странно')) {
    await bot.sendMessage(msg.chat.id, 'Под словом `странно` подразумевается оценочное суждение. Данное слово не пытается никого оскорбить или задеть.')
  }

  if (msg && msg.voice) {
    try {
      const url = await bot.getFileLink(msg.voice.file_id);
      const path = `./data/${msg.voice.file_id}.ogg`;

      const file = fs.createWriteStream(path);
      https.get(url, async (response) => {
        response.pipe(file);

        const result = await convertAudioToText(path);
        bot.sendMessage(msg.chat.id, result);
        fs.unlinkSync(path)
      });

    } catch (err) {
      console.error(err);
    }

  }
});

const convertAudioToText = async (filePath) => {

  const fileStream = fs.createReadStream(filePath);

  const r = await axios({
    url: `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId=${YANDEX_FOLDER}&lang=ru-RU`,
    method: 'POST',
    headers: {
        'ContentType': 'audio/ogg',
        'content-type': 'audio/ogg',
        'Authorization': `Bearer ${YANDEX_IAM_KEY}`,
    },
    data: fileStream,
    transformRequest: (data, headers) => {
      headers['ContentType'] = 'audio/ogg';
      return data;
    }
  });

  return r.data.result;

}
