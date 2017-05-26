import path from 'path';
import winston from 'winston';
import conf from '../config/config.js';
import _ from 'lodash';
import request from 'request';
import fs from 'fs';

let tmp = path.resolve('tmp');


/** Class representing Sounds. */
class Sounds {

  /**
   * description would be here.
   */
  constructor() {

  }


  /**
   * runs Sounds
   * @param {object} ctx - telegraf context object.
   */
  getSoundy(ctx) {

    let query = ctx.match[1].replace(/[?=]/g, " ");
    let replyTo = ctx.update.message.message_id;

    let options = {
      method: 'GET',
      url: `https://www.soundy.top/api/sounds/?q=${query}`,
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) { console.log('debug', error) };

      let data = JSON.parse(body);

        winston.log('debug', 'data', data);

      if (data != '') {

        ctx.replyWithChatAction('upload_audio');


        let first = data[0];
        let name = first['name'];
        let url = `http:${first['url']}`;

        request(url)
          .pipe(fs.createWriteStream(`${tmp}/${query}.mp3`))
          .on("finish", function(data, err) {
            var mp3 = fs.createReadStream(`${tmp}/${query}.mp3`);
            return ctx.replyWithAudio({ source: mp3 }, { title: name, disable_notification: true });

          })

      } else {
        return ctx.replyWithMarkdown(`no results for ${query}.`, { disable_notification: true });
      }

    });


  }


  getIndividualSound(ctx, id){

    let options = {
      method: 'GET',
      url: `https://www.soundy.top/api/sounds/${id}`,
      headers: { 'cache-control': 'no-cache' }
    };

    request(options, function(error, response, body) {
      if (error) { winston.log('debug', error) };

      let data = JSON.parse(body);


      if (data != '') {

        ctx.replyWithChatAction('upload_audio');

        let name = data['name'];
        let url = `http:${data['url']}`;

        request(url)
          .pipe(fs.createWriteStream(`${tmp}/${id}.mp3`))
          .on("finish", function(data, err) {
            var mp3 = fs.createReadStream(`${tmp}/${id}.mp3`);
            return ctx.replyWithAudio({ source: mp3 }, { title: name, disable_notification: true });

          })

      } else {
        return ctx.replyWithMarkdown(`error with that sound id: ${id}.`, { disable_notification: true });
      }

    });


  }

  returnMenu(ctx){

    return ctx.replyWithHTML('<strong>Usage</strong>: snd (query) to search for sounds.\n or choose from the following \n/oss \n/shieeeeeeeeet \n/airhorn \n/caralho \nYou can upload your own here and it will appear when you search the name \nhttps://www.soundy.top/sounds/new', { disable_web_page_preview: true, disable_notification: true });

  }



}



export default Sounds;
