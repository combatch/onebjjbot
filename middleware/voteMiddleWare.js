let voteMiddleware = (ctx, next) => {
  ctx.state.increment = false;

  if (ctx.state.increment == false) {

    console.log('in here false')
    ctx.state.increment = !ctx.state.increment;

    console.log(ctx.state.increment)
  } else {
    console.log('in here true');
    ctx.state.increment = !ctx.state.increment;

    console.log(ctx.state.increment)
  }

  ctx
    .reply(`${ctx.state.increment}`)
    .then(next);

}

export default voteMiddleware;
