import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import winston from 'winston';
import request from 'request';
import conf from '../config/config.js';
import ffmpeg from 'fluent-ffmpeg';

let command = ffmpeg();
let env = process.env.NODE_ENV || 'development';
let token = conf[`${env}`]['token'];
let tmp = path.resolve('tmp');




/** Class to handle streams and buffers. */
class FileStreams {
  constructor(ctx) {
    this.ctx = ctx;
  }

  convertToMp4(ctx) {

    let downloadedFileName, newFileName;

    let filename = ctx.update.message.document.file_name;
    let fileid = ctx.update.message.document.file_id;
    let ext = filename.split('.');
    ext = ext[1];

    if (ext == "webm" ||  ext == "mov" ) {

      ctx.telegram.getFileLink(fileid)
        .then(data => {
          downloadedFileName = data.split('/').pop();
          newFileName = filename.split('.');
          newFileName = newFileName[0];

          ctx.reply(`attempting to convert file to .mp4`, { disable_notification: true });
        })
        .then((stuff) => {
          ctx.telegram.getFile(fileid)
            .then(tFile => {

              var options = {
                method: 'GET',
                url: `https://api.telegram.org/file/bot${token}/${tFile.file_path}`,
                headers: { 'cache-control': 'no-cache' }
              };


              request(options)
                .pipe(fs.createWriteStream(`${tmp}/${downloadedFileName}`))
                .on("finish", function(data, err) {

                  ffmpeg(`${tmp}/${downloadedFileName}`)
                    .videoCodec('libx264')
                    //.audioCodec('libmp3lame')
                    .on('error', function(err) {
                      winston.log('error', err);
                      ctx.reply(`${err} `);
                    })
                    .save(`${tmp}/${newFileName}.mp4`)
                    .on('end', function() {
                      let vid = fs.createReadStream(`${tmp}/${newFileName}.mp4`);
                      ctx.replyWithVideo({ source: vid, disable_notification: true });
                    });

                })

            });
        })


    }

  }

  static createImageStream() {
    // var stream = function (file, dir){
    // createreadstream
    // return the stream
    //
    // }
    return 'something';
  }
  static createSoundStream() {

  }
  static createVideoStream() {

  }


}


export default FileStreams;
