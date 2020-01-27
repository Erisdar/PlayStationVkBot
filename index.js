const express = require('express')
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./client_secret.json');
const api = require('node-vk-bot-api/lib/api');

const app = express();
const bot = new VkBot({
  token: '03f3d3fc6f27c4919d855701eed0584dfa973e0b55bb7edf6c790428bd451d746ad06549c2e1009f51aea',
  confirmation: 'a4a77312'
});

var doc = new GoogleSpreadsheet('1Buc1DUzCZKGN39R4pHH1JGQB3ZJaxPtb2m-ivpusHT0');

bot.on((ctx) => {
  try {
    api('users.get', {
      user_ids: ctx.message.from_id,
      fields: ['domain'],
      access_token: '03f3d3fc6f27c4919d855701eed0584dfa973e0b55bb7edf6c790428bd451d746ad06549c2e1009f51aea',
    }).then(info => { 
      doc.useServiceAccountAuth(creds, (err) => {
        doc.getRows(1, (err, rows) => { 
          try {
            const nick = info.response[1].domain;

            const row = rows
            .map(({ login, game, password, t31, t32, t2 }) => (
              { login, game, password, t31, t32, t2 }
            ))
              .filter(({ t31, t32, t2, game }) => [t31, t32, t2].includes(nick) && ctx.message.text === game);
    
            if (row.length) {
              ctx.reply(`Ваш пароль от игры ${row[0].game}: ${row[0].password}`);
            } else {
              ctx.reply('У вас нет игры');
            }
          } catch (error) {
            ctx.reply('Извините, сервер временно не работает');
          }     
         
        });
      });
    })
  } catch (error) {   
    ctx.reply('Извините, сервер временно не работает');
  }
})

app.use(bodyParser.json())

app.post('/', bot.webhookCallback)

app.listen(8080)