import path from 'path';
import winston from 'winston';
import conf from '../config/config.js';
import _ from 'lodash';
import request from 'request';
import fs from 'fs';

let tmp = path.resolve('tmp');


/** Class representing Dictionary. */
class Dictionary {

  /**
   * description would be here.
   */
  constructor() {

  }


  /**
   * runs Dictionary
   * @param {object} ctx - telegraf context object.
   */
  urbanDictionary(ctx) {


    let query = ctx.match[1];
    let replyTo = ctx.update.message.message_id;
    let topScore, leastControversial;

    let options = {
      method: 'GET',
      url: `http://api.urbandictionary.com/v0/define?term=${query}`,
      headers: { 'cache-control': 'no-cache' }
    };


    request(options, function(error, response, body) {
      if (error) { console.log('debug', error) };
      let sound = '';

      let data = JSON.parse(body);

      if (data.result_type !== 'no_results') {

        let results = cleanResults(data.list);

        topScore = highestScoring(results);
        leastControversial = getleastControversial(results);

        if (topScore === leastControversial) {
          let msg = generateMarkdown(query, topScore);
          ctx.replyWithMarkdown(msg, { disable_notification: true });
        } else {

          let msg = generateMarkdown(query, topScore);
          let message = generateMarkdown(query, leastControversial);
          let combined = '`Top Scoring`' + ` \n${msg} \n ` + '`Least Controversial`' + `\n ${message}`;

          ctx.replyWithMarkdown(combined, { disable_notification: true });
        }

        if (!_.isEmpty(data.sounds)) {
          sound = _.sample(data.sounds)
          return ctx.replyWithAudio({ url: sound, filename: `${query}.mp3` }, { disable_notification: true });
        };


      } else {
        return ctx.replyWithMarkdown(`no results for ${query}.`, { disable_notification: true });
      }

    });


  }


}

function generateMarkdown(word, data) {

  let markdown = `*${word}*\n ${data.definition}\n _Example_` +
    '```' + `${data.example}` + '```\n' + `${data.thumbs_up} 👍 | ${data.thumbs_down} 👎
  `;

  return markdown;
}

function cleanResults(dirtyObj) {

  let filtered = dirtyObj.map(function(entry) {

    let obj = {};
    obj['definition'] = entry.definition.replace(`*`, ``);
    obj['thumbs_up'] = entry.thumbs_up;
    obj['thumbs_down'] = entry.thumbs_down;
    obj['example'] = entry.example.replace(`*`, ``);

    obj['score'] = entry.thumbs_up / entry.thumbs_down;

    return obj;

  });
  return filtered;

}

function highestScoring(filteredResults) {

  let highestScoring = _.maxBy(filteredResults, 'thumbs_up');
  return highestScoring;

}

function getleastControversial(filteredResults) {

  let score = _.maxBy(filteredResults, 'score');
  return score;

}


export default Dictionary;
