const express = require('express')
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');
const GoogleSpreadsheet = require('google-spreadsheet');
const creds = require('./client_secret.json');
const api = require('node-vk-bot-api/lib/api');

const app = express();
const bot = new VkBot({
  token: '03f3d3fc6f27c4919d855701eed0584dfa973e0b55bb7edf6c790428bd451d746ad06549c2e1009f51aea',
  confirmation: 'a4a77312'
});

const PORT = process.env.PORT || 80;

var doc = new GoogleSpreadsheet('1Buc1DUzCZKGN39R4pHH1JGQB3ZJaxPtb2m-ivpusHT0');

bot.command('Начать', (ctx) => {
  ctx.reply('Hello!', null, Markup
  .keyboard([
    [
      Markup.button('Инструкция', 'primary'),
    ],
    [
      Markup.button('Выдача пароля', 'positive'),
      Markup.button('Выдача всех паролей', 'negative'),
    ],
  ]));
});

bot.command('Инструкция', (ctx) => {
  ctx.reply(`В группе существуют правила, по использованию аккаунтов, не будем соблюдать, лишитесь игр, и вечный бан, если глобально смотреть. \nhttps://vk.com/topic-166006208_38549925`);
}); 

bot.command('Выдача пароля', (ctx) => {
  ctx.reply(`Для получения пароля от игры, введите её логин`);
}); 

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
            const nick = info.response[0].domain;

            const row = rows
            .map(({ mail, game, passwordlogin, t31, t32, t2 }) => (
              { mail, game, passwordlogin, t31, t32, t2 }
            ))
              .filter(({ t31, t32, t2, mail }) => [t31, t32, t2].includes(nick) && ctx.message.text === mail);
    

            if (row.length) {
              const {mail, game, passwordlogin, t31, t32} = row[0];

              const passwordText = `Ваш пароль от игры ${mail} (${game}): ${passwordlogin}`;
              const t3Instuction = '✅Т3---Следим за СВОЕЙ АКТИВАЦИЕЙ. Появился ЗАМОК, зашли активировали. \n✅Т3 аккаунт, ВСЕГДА НАХОДИТСЯ на консоли!!! Если долго не играем в игру, то активируем аккаунт \n🌈🌈КАК ОСНОВНОЙ🌈🌈 РАЗ-ДВА В 2-Е НЕДЕЛИ❗❗❗(чем чаще,тем лучше,по возможности) \n✅В противном случае, можете потерять АККАУНТ!!!\n⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔ \n🚫ЗАПРЕЩЕНО через сайт sony network ДЕАКТИВИРОВАТЬ систему, а так же менять Мейл и пароль на АККАУНТЕ!!\n✅Деактивация Т3 \n https://vk.com/topic-166006208_40320764';
              const t2Instuction = '🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 \nКто будет пытаться АКТИВИРОВАТЬ свой Т2 как Т3--ИЗЫМАЕМ АККАУНТ С ИГРОЙ!!! \n🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 \n✅Если Т2 выкинуло из игры, не ЛОМИМСЯ сразу назад в игру!!! \n✅Ожидаем 5 минут, это активируется Т3. \n👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇';
              const instuction = [t31, t32].includes(nick) ? t3Instuction : t2Instuction;

              ctx.reply(`${passwordText} \n ИНСТРУКЦИЯ:\n${instuction}`);
            } else {
              ctx.reply('У вас нет игры');
            }
          } catch (error) {
            ctx.reply('Извините, сервер временно не работает');
            console.log(error);
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

app.listen(PORT, () => {
  console.log(`Ps bot app listening on port ${PORT}!`);
});
