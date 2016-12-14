let Horseman = require('node-horseman');

let fs = require('fs');
let path = require('path');
let URL = require('url');
let dir = __dirname + '/tmp/'
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}


class Utils {

  constructor() {

  }

  something (ctx, next) {

    return next().then(() => {});
  }

}

module.exports = Utils;
