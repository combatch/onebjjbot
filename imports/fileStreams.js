import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import winston from 'winston';

let loadingGif = path.resolve('loading.gif');

/** Class to handle streams and buffers. */
class FileStreams {
  constructor(ctx) {
    this.ctx = ctx;
  }
  insertLoader (ctx) {
    let loader = fs.createReadStream(loadingGif);

    ctx.replyWithVideo({ source: loader }, { reply_to_message_id: ctx.message.message_id })
    winston.log('debug', 'inside insert loader function');

    ctx.getChatMember('173516336').then( (data) => {
      winston.log('debug', data);
    })
  }
  static createImageStream() {

    return 'something';
  }
  static createSoundStream() {

  }
  static createVideoStream() {

  }


}


export default FileStreams;
