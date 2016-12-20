let winston = require('./winston');
let globalMessageInfo = [];
let state = '';

let voteMiddleware = (ctx, next) => {
  let msgObj = {
    id: ctx.update.callback_query.message.reply_to_message.message_id,
    usersVoted: []
  }
  let currentVoters = globalMessageInfo.find(x => x.id === msgObj.id);
  let cIndex = globalMessageInfo.findIndex(x => x.id === msgObj.id);
  let userName = ctx.update.callback_query.from.first_name;

  if (currentVoters) {
    if (currentVoters.usersVoted.indexOf(userName) > -1) {
      globalMessageInfo[cIndex].usersVoted.splice(userName, 1);
      state = 'downvote';
    } else {
      globalMessageInfo[cIndex].usersVoted.push(userName);
      state = 'upvote';
    }
  } else {
    msgObj.usersVoted.push(userName);
    globalMessageInfo.push(msgObj);
    state = 'upvote';
  }
  console.log(globalMessageInfo);
  ctx
    .reply(`${state}`)
    .then(next);

}

export default voteMiddleware;
