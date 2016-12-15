import fs from 'fs-extra';
import path from 'path';
import Horseman from 'node-horseman';
import URL from 'url';
import _ from 'lodash';
import winston from 'winston';

let dir = path.resolve(`tmp/`);
console.info(dir);
if (!fs.existsSync(dir)) {
  fs.mkdirsSync(dir);
}


class ScreenShots {

  constructor() {
    winston.log('debug', 'inside constructor');
  }

  createScreenshot(ctx, next) {

    winston.log('debug', 'inside create screenshot method');

    let query = ctx.match[1];
    let parsedUrl = URL.parse(query);
    let website = parsedUrl.href;
    let cleanUrl = (parsedUrl.protocol == null ? `http://${website}` : website)
    let cleanString = (parsedUrl.protocol == 'https:' ? _.replace(website, "https://", '') : _.replace(website, "http://", ''));
    let dirString = _.replace(cleanString, /\/+/g, "-");
    let screenshot = `${dir}/${dirString}.png`;
    let horseman = new Horseman();

    horseman
      .viewport(3100, 1800)
      .zoom(2)
      .open(cleanUrl)
      .waitForNextPage()
      .screenshot(screenshot)
      .then(() => {
        winston.log('info', 'screenshot saved', cleanString);
        let ss = fs.createReadStream(screenshot);
        ctx.replyWithPhoto({ source: ss }, { caption: `screenshot of ${cleanUrl}`, disable_notification: true });
      })
      .catch((err) => {
        ctx.reply(`an error occured with that URL. check logs for more info`, { reply_to_message_id: ctx.message.message_id })
        winston.log('error', err);
      })
      .close();

  }



}


export default ScreenShots;
