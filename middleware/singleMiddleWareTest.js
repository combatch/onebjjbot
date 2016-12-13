let test = (ctx, next) =>
  ctx
  .reply('yo')
  .then(next);

module.exports = test;
// in babel transpile would be
// export default test;
