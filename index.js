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
  try {
    if (msg?.text && msg.text.includes('странно')) {
      await bot.sendMessage(msg.chat.id, 'Под словом `странно` подразумевается оценочное суждение. Данное слово не пытается никого оскорбить или задеть.')
    }

    if (msg && msg.voice) {

      const url = await bot.getFileLink(msg.voice.file_id);
      const path = `./data/${msg.voice.file_id}.ogg`;

      const file = fs.createWriteStream(path);
      https.get(url, async (response) => {
        response.pipe(file);

        const result = await convertAudioToTextSync(path);
        bot.sendMessage(msg.chat.id, result, { reply_to_message_id: msg.message_id });
        fs.unlinkSync(path)
      });
    }

    } catch (e) {
    console.error(e);
  }
});

bot.onText(/\/voice (.+)/, async (msg, match) => {

  const chatId = msg.chat.id;
  const resp = match[1];


  const promise = convertTextToAudioSync(resp, msg.message_id);
  promise.then(() => {
    const buffer = fs.readFileSync(`./data/${msg.message_id}.ogg`);
    bot.sendAudio(chatId, buffer);
  })

});

const convertAudioToTextSync = async (filePath) => {

  const fileStream = fs.createReadStream(filePath);

  const r = await axios({
    url: `https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?folderId=${YANDEX_FOLDER}&lang=ru-RU`,
    method: 'POST',
    headers: {
        'ContentType': 'audio/ogg',
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

const convertTextToAudioSync = async (text, id) => {
  return axios({
    url: `https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize?folderId=${YANDEX_FOLDER}&lang=ru-RU&text=${text}`,
    method: 'POST',
    responseType: 'arraybuffer',
    headers: {
      'Authorization': `Bearer ${YANDEX_IAM_KEY}`,
    }
  }).then((response) => {
    return fs.writeFileSync(`./data/${id}.ogg`, response.data)
  })
}
