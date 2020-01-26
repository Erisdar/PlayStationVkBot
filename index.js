const express = require('express')
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./client_secret.json');
const api = require('node-vk-bot-api/lib/api');

const app = express();
const bot = new VkBot({
  token: '5e76bc1692b69aae0f347bb98481890e1357b47d1c57ea3d26d8f7e1e01af0d73c84d8c338244af7b3ba7',
  confirmation: 'ca7bac18'
});

var doc = new GoogleSpreadsheet('1YU-mxkinvXoRJw-BQ1MqVPk8BC-zPatjP6MnvkQ1olo');

bot.on((ctx) => {
  api('users.get', {
    user_ids: ctx.message.from_id,
    fields: ['domain'],
    access_token: '5e76bc1692b69aae0f347bb98481890e1357b47d1c57ea3d26d8f7e1e01af0d73c84d8c338244af7b3ba7',
  }).then(info => {
    const nick = info.response[0].domain;

    doc.useServiceAccountAuth(creds, function (err) {
      doc.getRows(1, function (err, rows) {
        const row = rows
          .map(({ email, password, message, login }) => { return { email, password, message, login }; })
          .filter(({ login }) => login === nick);

        if (row.length) {
          ctx.reply(JSON.stringify(row));
        } else {
          ctx.reply('У вас нет аккаунта');
        }
      });
    });
  })
})

app.use(bodyParser.json())

app.post('/', bot.webhookCallback)

app.listen(8080)