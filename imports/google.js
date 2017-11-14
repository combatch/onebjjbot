let path = require("path");
let winston = require("winston");
let conf = require("../config/config.js");
let _ = require("lodash");
let request = require("request");
let axios = require("axios");
let fs = require("fs");
let YouTube = require("youtube-node");
let jsonfile = require("jsonfile");
const { URL } = require("url");

const Telegraf = require("telegraf");
const { Extra, memorySession, Markup } = Telegraf;

let tmp = path.resolve("tmp");
let youTube = new YouTube();

youTube.setKey(conf.apis.youtube);

const Job = require("./jobs.js");

/** Class representing knex Google. */
class Google {
  /**
   * description would be here.
   */
  constructor() {}

  /**
   * runs Google
   * @param {object} ctx - telegraf context object.
   */
  translate(ctx) {
    let language = ctx.match[1];
    let text = ctx.update.message.reply_to_message.text;
    let replyTo = ctx.update.message.reply_to_message.message_id;
    let source = languageToCode(language);

    var options = {
      method: "GET",
      url: "https://www.googleapis.com/language/translate/v2",
      qs: {
        q: text,
        target: "en",
        format: "text",
        source: source,
        key: conf.apis.TRANSLATE
      },
      headers: { "cache-control": "no-cache" }
    };

    request(options, function(error, response, body) {
      if (error) {
        console.log("debug", error);
      }
      let data = JSON.parse(body);

      if (data.error) {
        return ctx.reply(`${data.error.message} for foreign language`);
      } else {
        let translated = data.data.translations[0].translatedText;
        return ctx.reply(`${translated}`, { reply_to_message_id: replyTo });
      }
    });
  }

  async asyncimgSearch(ctx, bot) {
    let query = ctx.match[1].replace(/[?=]/g, " ");
    let replyTo = ctx.update.message.message_id;
    let chatId = ctx.update.message.chat.id;

    let googleResults = await this.getImgResults(query);
    let filtered = await this.cleanImageResults(googleResults);

    if (!filtered) {
      return ctx.replyWithHTML(`no valid results found for <i>${query}</i>`, {
        reply_to_message_id: replyTo
      });
    }

    let newContext = await this.insertLoadingGif(ctx);
    let gifChatId = newContext.chat.id;
    let gifMessageId = newContext.message_id;

    let first = filtered[0];
    ctx.session.imageCache = filtered;

    ctx.replyWithChatAction("upload_photo");

    if (ctx.session.unUsed) {
      if (!ctx.session.oldImage) {
        ctx.telegram.deleteMessage(chatId, ctx.session.unUsed);
      }
    }

    await ctx.telegram.deleteMessage(gifChatId, gifMessageId);
    let job = new Job();
    await job.createButtons(ctx, bot);

    if (ctx.session.oldImage) {
      ctx.telegram.deleteMessage(chatId, ctx.session.oldImage);
    }
  }

  async getImgResults(query) {
    return axios
      .get(
        `https://www.googleapis.com/customsearch/v1?q=${query}&cx=${conf.apis
          .CX}&imgSize=large&imgType=photo&num=7&safe=off&searchType=image&key=${conf
          .apis.IMAGE}`
      )
      .then(x => {
        return x.data;
      })
      .catch(err => {
        winston.log("error", "failed in getImgResults", err);
      });
  }

  cleanImageResults(data) {
    if (data.searchInformation.totalResults == 0) {
      return false;
    }
    return filterImageResults(data);
  }

  async imgSearch(ctx, bot) {
    let query = ctx.match[1].replace(/[?=]/g, " ");
    let replyTo = ctx.update.message.message_id;
    let chatId = ctx.update.message.chat.id;

    let googleResults = await this.getImgResults(query);
    let filtered = await this.cleanImageResults(googleResults);

    if (!filtered) {
      return ctx.replyWithHTML(`no valid results found for <i>${query}</i>`, {
        reply_to_message_id: replyTo
      });
    }
    let first = filtered[0];
    console.log(first);
    ctx.session.imageCache = filtered;

    await ctx.replyWithChatAction("upload_photo");

    await ctx.replyWithPhoto({ url: first.url });
    // if status != 200, return error;
    axios
      .get(first.url)
      .then(x => {
        console.log(x.status);
        if (x.status !== 200) {
          return ctx.replyWithPhoto(filtered[1].url);
        } else {
          return ctx.replyWithHTML(`error with: ${first}`);
        }
      })
      .catch(err => {
        console.log("err", err);
        return ctx.replyWithHTML(`error: ${err}`);
      });
  }

  async insertLoadingGif(ctx) {
    let returnCTX = await ctx.replyWithVideo(`https://i.imgur.com/sWnfVTj.gif`);

    return returnCTX;
  }

  async getGifResults(query) {
    return axios
      .get(
        `https://api.tenor.co/v1/search?q=${query}&key=41S2CSB7PHJ7&safesearch=off`
      )
      .then(x => {
        return x.data;
      })
      .catch(err => {
        winston.log("error", "failed in getGifResults", err);
      });
  }

  async tenorSearch(ctx) {
    let query = ctx.match[1].replace(/[?=]/g, " ");
    let replyTo = ctx.update.message.message_id;

    let newContext = await this.insertLoadingGif(ctx);

    let chatId = newContext.chat.id;
    let messageId = newContext.message_id;

    let data = await this.getGifResults(query);

    if (data.results.length == 0) {
      await ctx.telegram.deleteMessage(chatId, messageId);
      return ctx.reply(`no results found for ${query}`, {
        reply_to_message_id: replyTo
      });
    }

    let filtered = filterTenorResults(data);

    if (filtered.length) {
      let random = _.sample(filtered);

      ctx.replyWithChatAction("upload_video");

      await ctx.replyWithVideo(random["url"]);
      return ctx.telegram.deleteMessage(chatId, messageId);
    } else {
      await ctx.telegram.deleteMessage(chatId, messageId);
      return ctx.reply(`no valid results found for ${query}`, {
        reply_to_message_id: replyTo
      });
    }
  }

  searchYoutube(ctx) {
    let query = ctx.match[1].replace(/[?=]/g, " ");
    let replyTo = ctx.update.message.message_id;

    youTube.search(query, 3, function(error, data) {
      if (error) {
        console.log("debug", error);
      }

      if (data.pageInfo.totalResults != 0) {
        let filtered = filterYoutubeResults(data);
        if (filtered.length) {
          let random = _.sample(filtered);

          return ctx.reply(`https://www.youtube.com/watch?v=${random.url}`);
        } else {
          return ctx.reply(`no results found for ${query}`, {
            reply_to_message_id: replyTo
          });
        }
      } else {
        return ctx.reply(`no valid results found for ${query}`, {
          reply_to_message_id: replyTo
        });
      }
    });
  }
}

function filterYoutubeResults(data) {
  let filtered = data.items.map(function(vid) {
    let obj = {};

    if (vid.id.kind == "youtube#video") {
      obj["url"] = vid.id.videoId;
      return obj;
    }
  });

  filtered = _.remove(filtered, undefined);
  return filtered;
}

function filterGifResults(data) {
  let filtered = data.items.map(function(gif) {
    let obj = {};

    if (gif.image.byteSize < "2497152" && gif.image.byteSize > "101788") {
      //if (gif.image.byteSize <= '2097152' && gif.link.startsWith("https")) {
      obj["url"] = gif.link;
      return obj;
    }
  });

  filtered = _.remove(filtered, undefined);
  return filtered;
}

function filterImageResults(data) {
  let bannedHosts = "photobucket.com";
  let allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"];
  let filtered = data.items.map(function(image) {
    let obj = {};
    let imgURL = image.link;
    let extension = path.extname(imgURL);
    let urlObj = new URL(imgURL);

    let host = urlObj.host;
    if (_.includes(host, bannedHosts)) {
      console.log("contains photobucket host, get rid");
    }
    if (!_.includes(host, bannedHosts)) {
      if (isInArray(extension, allowedExtensions)) {
        obj["url"] = image.link;
        obj["extension"] = extension;
        obj["title"] = image.title;
        return obj;
      }
    }
  });

  filtered = _.remove(filtered, undefined);
  return filtered;
}

function filterTenorResults(data) {
  let filtered = data.results.map(function(gif) {
    let obj = {};
    obj["url"] = gif.media[0]["mp4"]["url"];
    return obj;
  });

  filtered = _.remove(filtered, undefined);
  return filtered;
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

function validImageCheck(urlsObj) {
  let result = urlsObj.map(function(each) {
    let obj = {};
    return request(each, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        winston.log("debug", "each is", each);
        return true;
      }
    });
  });
}

function languageToCode(text) {
  let string = text.toLowerCase();

  switch (string) {
    case "afrikaans":
      string = "af";
      break;
    case "albanian":
      string = "sq";
      break;
    case "amharic":
      string = "am";
      break;
    case "arabic":
      string = "ar";
      break;
    case "armenian":
      string = "hy";
      break;
    case "azeerbaijani":
      string = "az";
      break;
    case "basque":
      string = "eu";
      break;
    case "belarusian":
      string = "be";
      break;
    case "bengali":
      string = "bn";
      break;
    case "bosnian":
      string = "bs";
      break;
    case "bulgarian":
      string = "bg";
      break;
    case "catalan":
      string = "ca";
      break;
    case "cebuano":
      string = "ceb";
      break;
    case "chichewa":
      string = "ny";
      break;
    case "chinese":
      string = "zh-cn";
      break;
    case "chinesetraditional":
      string = "zh-tw";
      break;
    case "corsican":
      string = "co";
      break;
    case "croatian":
      string = "hr";
      break;
    case "czech":
      string = "cs";
      break;
    case "danish":
      string = "da";
      break;
    case "dutch":
      string = "nl";
      break;
    case "english":
      string = "en";
      break;
    case "esperanto":
      string = "eo";
      break;
    case "estonian":
      string = "et";
      break;
    case "filipino":
      string = "tl";
      break;
    case "finnish":
      string = "fi";
      break;
    case "french":
      string = "fr";
      break;
    case "frisian":
      string = "fy";
      break;
    case "galician":
      string = "gl";
      break;
    case "georgian":
      string = "ka";
      break;
    case "german":
      string = "de";
      break;
    case "greek":
      string = "el";
      break;
    case "gujarati":
      string = "gu";
      break;
    case "haitian":
      string = "creole ht";
      break;
    case "hausa":
      string = "ha";
      break;
    case "hawaiian":
      string = "haw";
      break;
    case "hebrew":
      string = "iw";
      break;
    case "hindi":
      string = "hi";
      break;
    case "hmong":
      string = "hmn";
      break;
    case "hungarian":
      string = "hu";
      break;
    case "icelandic":
      string = "is";
      break;
    case "igbo":
      string = "ig";
      break;
    case "indonesian":
      string = "id";
      break;
    case "irish":
      string = "ga";
      break;
    case "italian":
      string = "it";
      break;
    case "japanese":
      string = "ja";
      break;
    case "javanese":
      string = "jw";
      break;
    case "kannada":
      string = "kn";
      break;
    case "kazakh":
      string = "kk";
      break;
    case "khmer":
      string = "km";
      break;
    case "korean":
      string = "ko";
      break;
    case "kurdish":
      string = "ku";
      break;
    case "kyrgyz":
      string = "ky";
      break;
    case "lao":
      string = "lo";
      break;
    case "latin":
      string = "la";
      break;
    case "latvian":
      string = "lv";
      break;
    case "lithuanian":
      string = "lt";
      break;
    case "luxembourgish":
      string = "lb";
      break;
    case "macedonian":
      string = "mk";
      break;
    case "malagasy":
      string = "mg";
      break;
    case "malay":
      string = "ms";
      break;
    case "malayalam":
      string = "ml";
      break;
    case "maltese":
      string = "mt";
      break;
    case "maori":
      string = "mi";
      break;
    case "marathi":
      string = "mr";
      break;
    case "mongolian":
      string = "mn";
      break;
    case "burmese":
      string = "my";
      break;
    case "nepali":
      string = "ne";
      break;
    case "norwegian":
      string = "no";
      break;
    case "pashto":
      string = "ps";
      break;
    case "persian":
      string = "fa";
      break;
    case "polish":
      string = "pl";
      break;
    case "portuguese":
      string = "pt";
      break;
    case "punjabi":
      string = "ma";
      break;
    case "romanian":
      string = "ro";
      break;
    case "russian":
      string = "ru";
      break;
    case "samoan":
      string = "sm";
      break;
    case "scots":
      string = "gaelic gd";
      break;
    case "serbian":
      string = "sr";
      break;
    case "sesotho":
      string = "st";
      break;
    case "shona":
      string = "sn";
      break;
    case "sindhi":
      string = "sd";
      break;
    case "sinhala":
      string = "si";
      break;
    case "slovak":
      string = "sk";
      break;
    case "slovenian":
      string = "sl";
      break;
    case "somali":
      string = "so";
      break;
    case "spanish":
      string = "es";
      break;
    case "sundanese":
      string = "su";
      break;
    case "swahili":
      string = "sw";
      break;
    case "swedish":
      string = "sv";
      break;
    case "tajik":
      string = "tg";
      break;
    case "tamil":
      string = "ta";
      break;
    case "telugu":
      string = "te";
      break;
    case "thai":
      string = "th";
      break;
    case "turkish":
      string = "tr";
      break;
    case "ukrainian":
      string = "uk";
      break;
    case "urdu":
      string = "ur";
      break;
    case "uzbek":
      string = "uz";
      break;
    case "vietnamese":
      string = "vi";
      break;
    case "welsh":
      string = "cy";
      break;
    case "xhosa":
      string = "xh";
      break;
    case "yiddish":
      string = "yi";
      break;
    case "yoruba":
      string = "yo";
      break;
    case "zulu":
      string = "zu";
    default:
      console.log("in the switch function !");
      break;
  }
}
module.exports = Google;
