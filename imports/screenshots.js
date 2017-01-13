import fs from 'fs-extra';
import path from 'path';
import Horseman from 'node-horseman';
import URL from 'url';
import _ from 'lodash';
import winston from 'winston';
import Jimp from 'jimp';

let dir = path.resolve(`tmp/`);
if (!fs.existsSync(dir)) {
  fs.mkdirsSync(dir);
}

/** Class representing screenshots. */
class ScreenShots {

  /**
   * description would be here.
   */
  constructor() {}


  /**
   * creates a screenshot to the tmp directory.
   * @param {object} ctx - telegraf context object.
   * @return {boolean} i dunno lol.
   */
  createScreenshot(ctx, url,  captionText) {

    winston.log('debug', 'inside create screenshot method');

    let query = url || ctx.match[1];
    let parsedUrl = URL.parse(query);
    let website = parsedUrl.href;
    let cleanUrl = (parsedUrl.protocol == null ? `http://${website}` : website)
    let cleanString = (parsedUrl.protocol == 'https:' ? _.replace(website, "https://", '') : _.replace(website, "http://", ''));
    let dirString = _.replace(cleanString, /\/+/g, "-");
    dirString = _.replace(dirString, /[?=]/g, "");
    dirString = _.replace(dirString, /[&=]/g, "");
    let screenshotDir = `${dir}/${dirString}.png`;


    let horseman = new Horseman();
    ctx.replyWithChatAction('upload_photo');

    return horseman
      .viewport(3100, 1800)
      .zoom(2)
      .open(cleanUrl)
      .waitForNextPage()
      .screenshot(screenshotDir)
      .then(() => {
        winston.log('info', 'screenshot saved', cleanString);

        Jimp.read(screenshotDir)
          .then((img) => {
            img.scaleToFit(3100, 4000)
              .quality(80)
              .write(screenshotDir, (img) => {
                let caption = captionText || `screenshot of ${cleanUrl}`;
                return ctx.replyWithPhoto({ source: screenshotDir }, { caption: caption, disable_notification: true });
              })
          })
          .catch((err) => {
            return ctx.reply(`${err}`, { reply_to_message_id: ctx.message.message_id })
            winston.log('error', err);
          })

      })
      .catch((err) => {
        return ctx.reply(`an error occured with that URL. check logs for more info`, { reply_to_message_id: ctx.message.message_id })
        winston.log('error', err);
      })
      .close();

    return true;
  }


}


export default ScreenShots;
