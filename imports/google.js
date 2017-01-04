import path from 'path';
import winston from 'winston';
import conf from '../config/config.js';
import _ from 'lodash';
import request from 'request';



//let env = process.env.NODE_ENV || 'development';


/** Class representing knex Google. */
class Google {

  /**
   * description would be here.
   */
  constructor() {

  }


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
      method: 'GET',
      url: 'https://www.googleapis.com/language/translate/v2',
      qs: {
        q: text,
        target: 'en',
        format: 'text',
        source: source,
        key: conf.apis.TRANSLATE
      },
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) { console.log('debug', error) };
      let data = JSON.parse(body);

      if (data.error) {
        console.log('error', data.error);
        return ctx.reply(`${data.error.message} for foreign language`);
      } else {
        console.log('info', data);
        let translated = data.data.translations[0].translatedText;

        return ctx.reply(`${translated}`, { reply_to_message_id: replyTo });
      }

    });


  }

  getGifs(ctx, next) {

    console.log('inside get gifs');


    return next().then(() => {

      let query = ctx.match[1];
      let replyTo = ctx.update.message.message_id;

      request('https://www.googleapis.com/customsearch/v1?q=' + query + '&cx=' + conf.apis.CX + '&imgSize=large&fileType=gif&imgType=photo&num=10&safe=off&searchType=image&key=' + conf.apis.IMAGE, function(error, response, body) {
        if (error) {
          console.log('debug', error)
          return ctx.reply(`error: ${error}`, { reply_to_message_id: replyTo });
        }


        let data = JSON.parse(body);

        if (data.searchInformation.totalResults == 0) {
          return ctx.reply(`no results found for ${query}`, { reply_to_message_id: replyTo });
        } else {

          let filtered = filterImageResults(data);
          console.log(filtered);
          console.log(filtered.length);

          if (filtered.length) {
            let random = _.sample(filtered);
            console.log(random);

            ctx.replyWithChatAction('upload_video');
            return ctx.replyWithVideo({ url: random['url'] });
          } else {
            return ctx.reply(`no valid results found for ${query}`, { reply_to_message_id: replyTo });
          }

        }

      });

    });

  }

  tenorSearch(ctx) {


    let query = ctx.match[1];


    var options = {
      method: 'GET',
      url: 'https://api.tenor.co/v1/search',
      qs: {
        tag: query,
        key: '41S2CSB7PHJ7',
        safesearch: 'off' },
      headers: {
        'cache-control': 'no-cache'
      }
    };

    request(options, function(error, response, body) {
      if (error) { console.log('debug', error) };
      let data = JSON.parse(body);

      if (!data.results.length) {
          return ctx.reply(`no results found for ${query}`, { reply_to_message_id: replyTo });
      }
      else{

          let filtered = filterTenorResults(data);

          if (filtered.length) {
            let random = _.sample(filtered);
            console.log(random);

            ctx.replyWithChatAction('upload_video');
            return ctx.replyWithVideo({ url: random['url'] });
          } else {
            return ctx.reply(`no valid results found for ${query}`, { reply_to_message_id: replyTo });
          }

      }


    });


  }


}

function filterImageResults(data) {

  let filtered = data.items.map(function(gif) {
    let obj = {};
    // console.log(gif.image.byteSize);
    // console.log(gif.link);

    if (gif.image.byteSize < '3097152' && gif.image.byteSize > '524288') {
      //if (gif.image.byteSize <= '2097152' && gif.link.startsWith("https")) {
      obj['url'] = gif.link;
      return obj;
    }
  });

  filtered = _.remove(filtered, undefined);
  return filtered;

}


function filterTenorResults(data) {

  let filtered = data.results.map(function(gif) {
    let obj = {};
      obj['url'] = gif.media[0]['mp4']['url'];
      return obj;
  });

  filtered = _.remove(filtered, undefined);
  return filtered;

}



function languageToCode(text) {
  let string = text.toLowerCase();

  switch (string) {
    case 'afrikaans':
      string = 'af';
      break;
    case 'albanian':
      string = 'sq';
      break;
    case 'amharic':
      string = 'am';
      break;
    case 'arabic':
      string = 'ar';
      break;
    case 'armenian':
      string = 'hy';
      break;
    case 'azeerbaijani':
      string = 'az';
      break;
    case 'basque':
      string = 'eu';
      break;
    case 'belarusian':
      string = 'be';
      break;
    case 'bengali':
      string = 'bn';
      break;
    case 'bosnian':
      string = 'bs';
      break;
    case 'bulgarian':
      string = 'bg';
      break;
    case 'catalan':
      string = 'ca';
      break;
    case 'cebuano':
      string = 'ceb';
      break;
    case 'chichewa':
      string = 'ny';
      break;
    case 'chinese':
      string = 'zh-cn';
      break;
    case 'chinesetraditional':
      string = 'zh-tw';
      break;
    case 'corsican':
      string = 'co';
      break;
    case 'croatian':
      string = 'hr';
      break;
    case 'czech':
      string = 'cs';
      break;
    case 'danish':
      string = 'da';
      break;
    case 'dutch':
      string = 'nl';
      break;
    case 'english':
      string = 'en';
      break;
    case 'esperanto':
      string = 'eo';
      break;
    case 'estonian':
      string = 'et';
      break;
    case 'filipino':
      string = 'tl';
      break;
    case 'finnish':
      string = 'fi';
      break;
    case 'french':
      string = 'fr';
      break;
    case 'frisian':
      string = 'fy';
      break;
    case 'galician':
      string = 'gl';
      break;
    case 'georgian':
      string = 'ka';
      break;
    case 'german':
      string = 'de';
      break;
    case 'greek':
      string = 'el';
      break;
    case 'gujarati':
      string = 'gu';
      break;
    case 'haitian':
      string = 'creole ht';
      break;
    case 'hausa':
      string = 'ha';
      break;
    case 'hawaiian':
      string = 'haw';
      break;
    case 'hebrew':
      string = 'iw';
      break;
    case 'hindi':
      string = 'hi';
      break;
    case 'hmong':
      string = 'hmn';
      break;
    case 'hungarian':
      string = 'hu';
      break;
    case 'icelandic':
      string = 'is';
      break;
    case 'igbo':
      string = 'ig';
      break;
    case 'indonesian':
      string = 'id';
      break;
    case 'irish':
      string = 'ga';
      break;
    case 'italian':
      string = 'it';
      break;
    case 'japanese':
      string = 'ja';
      break;
    case 'javanese':
      string = 'jw';
      break;
    case 'kannada':
      string = 'kn';
      break;
    case 'kazakh':
      string = 'kk';
      break;
    case 'khmer':
      string = 'km';
      break;
    case 'korean':
      string = 'ko';
      break;
    case 'kurdish':
      string = 'ku';
      break;
    case 'kyrgyz':
      string = 'ky';
      break;
    case 'lao':
      string = 'lo';
      break;
    case 'latin':
      string = 'la';
      break;
    case 'latvian':
      string = 'lv';
      break;
    case 'lithuanian':
      string = 'lt';
      break;
    case 'luxembourgish':
      string = 'lb';
      break;
    case 'macedonian':
      string = 'mk';
      break;
    case 'malagasy':
      string = 'mg';
      break;
    case 'malay':
      string = 'ms';
      break;
    case 'malayalam':
      string = 'ml';
      break;
    case 'maltese':
      string = 'mt';
      break;
    case 'maori':
      string = 'mi';
      break;
    case 'marathi':
      string = 'mr';
      break;
    case 'mongolian':
      string = 'mn';
      break;
    case 'burmese':
      string = 'my';
      break;
    case 'nepali':
      string = 'ne';
      break;
    case 'norwegian':
      string = 'no';
      break;
    case 'pashto':
      string = 'ps';
      break;
    case 'persian':
      string = 'fa';
      break;
    case 'polish':
      string = 'pl';
      break;
    case 'portuguese':
      string = 'pt';
      break;
    case 'punjabi':
      string = 'ma';
      break;
    case 'romanian':
      string = 'ro';
      break;
    case 'russian':
      string = 'ru';
      break;
    case 'samoan':
      string = 'sm';
      break;
    case 'scots':
      string = 'gaelic gd';
      break;
    case 'serbian':
      string = 'sr';
      break;
    case 'sesotho':
      string = 'st';
      break;
    case 'shona':
      string = 'sn';
      break;
    case 'sindhi':
      string = 'sd';
      break;
    case 'sinhala':
      string = 'si';
      break;
    case 'slovak':
      string = 'sk';
      break;
    case 'slovenian':
      string = 'sl';
      break;
    case 'somali':
      string = 'so';
      break;
    case 'spanish':
      string = 'es';
      break;
    case 'sundanese':
      string = 'su';
      break;
    case 'swahili':
      string = 'sw';
      break;
    case 'swedish':
      string = 'sv';
      break;
    case 'tajik':
      string = 'tg';
      break;
    case 'tamil':
      string = 'ta';
      break;
    case 'telugu':
      string = 'te';
      break;
    case 'thai':
      string = 'th';
      break;
    case 'turkish':
      string = 'tr';
      break;
    case 'ukrainian':
      string = 'uk';
      break;
    case 'urdu':
      string = 'ur';
      break;
    case 'uzbek':
      string = 'uz';
      break;
    case 'vietnamese':
      string = 'vi';
      break;
    case 'welsh':
      string = 'cy';
      break;
    case 'xhosa':
      string = 'xh';
      break;
    case 'yiddish':
      string = 'yi';
      break;
    case 'yoruba':
      string = 'yo';
      break;
    case 'zulu':
      string = 'zu';
    default:
      console.log('in the switch function !');
      break;

  }



}
export default Google;
