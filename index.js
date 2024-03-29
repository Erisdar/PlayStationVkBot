const express = require("express");
const VkBot = require("node-vk-bot-api");
const Markup = require("node-vk-bot-api/lib/markup");
const api = require("node-vk-bot-api/lib/api");
const Cache = require("node-cache");
const dotenv = require("dotenv");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { INSTRUCTION, GET_PASSSWORD } = require("./constant/ui.constant");
const ACCOUNT_TYPE = require("./constant/account.constant");

dotenv.config();

const {
  VK_TOKEN,
  VK_CONFIRMATION,
  GOOGLE_SHEET,
  PORT = 80,
  GOOGLE_CLIENT_EMAIL,
  GOOGLE_PRIVATE_KEY,
} = process.env;

const google_creds = {
  private_key: GOOGLE_PRIVATE_KEY,
  client_email: GOOGLE_CLIENT_EMAIL,
};

const VK_URL_REGEX = /[^/]*$/;

const doc = new GoogleSpreadsheet(GOOGLE_SHEET);

(async function () {
  await doc.useServiceAccountAuth(google_creds);
  await doc.loadInfo();
})();

let sheets;
const loadSheetsCache = async () => {
  sheets = await doc.sheetsByIndex[0].getRows().then((rows) =>
    rows.map(({ mail, game, passwordLogin, t31, t32, t2 }) => ({
      mail,
      game,
      passwordLogin,
      t31,
      t32,
      t2,
    }))
  );
};

setInterval(loadSheetsCache, 30_000);

const getInfo = (id) =>
  api("users.get", {
    user_ids: id,
    fields: ["domain"],
    access_token: VK_TOKEN,
  });

const getPasswordWithInstruction = ({ mail, game, passwordLogin, account }) => {
  const passwordText = `Ваш пароль: ${game} (${account}) \u2013 ${mail} \u2013 ${passwordLogin}`;
  const t3Instuction =
    "✅Т3---Следим за СВОЕЙ АКТИВАЦИЕЙ. Появился ЗАМОК, зашли активировали. \n✅Т3 аккаунт, ВСЕГДА НАХОДИТСЯ на консоли!!! Если долго не играем в игру, то активируем аккаунт \n🌈🌈КАК ОСНОВНОЙ🌈🌈 РАЗ-ДВА В 2-Е НЕДЕЛИ❗❗❗(чем чаще,тем лучше,по возможности) \n✅В противном случае, можете потерять АККАУНТ!!!\n⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔⛔ \n🚫ЗАПРЕЩЕНО через сайт sony network ДЕАКТИВИРОВАТЬ систему, а так же менять Мейл и пароль на АККАУНТЕ!!\n✅Деактивация Т3 \n https://vk.com/topic-166006208_40320764";
  const t2Instuction =
    "🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 \nКто будет пытаться АКТИВИРОВАТЬ свой Т2 как Т3--ИЗЫМАЕМ АККАУНТ С ИГРОЙ!!! \n🔴🔴🔴🔴🔴🔴🔴🔴🔴🔴 \n✅Если Т2 выкинуло из игры, не ЛОМИМСЯ сразу назад в игру!!! \n✅Ожидаем 5 минут, это активируется Т3. \n👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇👇";
  const instuction = account === ACCOUNT_TYPE.T3 ? t3Instuction : t2Instuction;

  return `${passwordText} \n ИНСТРУКЦИЯ:\n${instuction}`;
};

const getAllPasswords = (games) => {
  return `Ваши пароли:\n ${games
    .map(
      ({ mail, game, passwordLogin, account }) =>
        `${game} (${account}) \u2013 ${mail} \u2013 ${passwordLogin}`
    )
    .join("\n")}`;
};

const KEYBOARD = Markup.keyboard([
  [Markup.button(INSTRUCTION, "primary")],
  [
    Markup.button(GET_PASSSWORD, "positive"),
    // Markup.button(GET_ALL_PASSWORDS, 'negative'),
  ],
]);

const bot = new VkBot({
  token: VK_TOKEN,
  confirmation: VK_CONFIRMATION,
});

bot.command("Начать", (ctx) => {
  ctx.reply("Привет!", null, KEYBOARD);
});

bot.command(INSTRUCTION, (ctx) => {
  ctx.reply(
    `В группе существуют правила, по использованию аккаунтов, не будем соблюдать, лишитесь игр, и вечный бан, если глобально смотреть. \nhttps://m.vk.com/wall-166006208_56690`,
    null,
    KEYBOARD
  );
});

bot.command(GET_PASSSWORD, (ctx) => {
  ctx.reply(
    `Для получения пароля от игры, введите логин (почту)`,
    null,
    KEYBOARD
  );
});

const cache = new Cache({
  stdTTL: 10 * 60, // 10 минут кеш
});

bot.on((ctx) => {
  const info = cache.get(ctx.message.from_id);
  (info ? Promise.resolve(info) : getInfo(ctx.message.from_id))
    .then((info) => {
      const nick = info.response[0].domain;
      cache.set(ctx.message.from_id, info);

      const row = sheets
        .map(({ t31, t32, t2, mail, game, passwordLogin }) => {
          let account = null;
          if (
            [t31, t32].some((vkUrl) => VK_URL_REGEX.exec(vkUrl)[0] === nick)
          ) {
            account = ACCOUNT_TYPE.T3;
          }
          if (VK_URL_REGEX.exec(t2)[0] === nick) {
            account = ACCOUNT_TYPE.T2;
          }
          return { mail, game, passwordLogin, account };
        })
        .filter(({ account, mail }) => account && ctx.message.text === mail);
      // .filter(({ account, mail}) => account && (ctx.message.text === mail || ctx.message.text === GET_ALL_PASSWORDS));

      if (!row.length) {
        ctx.reply("У вас нет игры");
      }

      if (row.length === 1) {
        ctx.reply(getPasswordWithInstruction(row[0]), null, KEYBOARD);
      }

      if (row.length > 1) {
        ctx.reply(getAllPasswords(row), null, KEYBOARD);
      }
    })
    .catch((error) => {
      ctx.reply("Извините, сервер временно не работает");
      console.log(error);
    });
});

const app = express();

app.use(express.json());

app.post("/", bot.webhookCallback);

app.listen(PORT, () => {
  console.log(`Ps bot app listening on port ${PORT}!`);
});
