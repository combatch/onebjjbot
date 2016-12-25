import winston from 'winston';
import Users from '../imports/users';

const user = new Users();

let globalMessageInfo = [];
let state = '';

class Vote {

  constructor() {

  }

  reBuildButtons(ctx) {

    winston.log('debug', 'inside rebuild function');


   // with the count data from users,
   // rebuild menu


      // let thumbsup = user.countVotes(ctx, 'thumbsup');
      // let heart = user.countVotes(ctx, 'heart');
      // let fire = user.countVotes(ctx, 'fire');
      // let clap = user.countVotes(ctx, 'clap');
      // let grin = user.countVotes(ctx, 'grin');


    // if (!state.upvoted & !state.downvoted) {
    //   state.upvoted = !state.upvoted;
    //   state.downvoted = false;
    // }
    // if (state.upvoted) {
    //   state.thumbsup++;
    //   state.upvoted = !state.upvoted;
    //   state.downvoted = !state.downvoted;
    // } else if (state.downvoted) {
    //   state.thumbsup--;
    //   state.upvoted = !state.upvoted;
    //   state.downvoted = !state.downvoted;
    // } else {
    //   state.votes;
    // }


    // ctx.editMessageText('<i>choose a button to upvote</i>', Extra
    //       .inReplyTo(originalMessageId)
    //       .notifications(false)
    //       .HTML()
    //       .markup(
    //         Markup.inlineKeyboard([
    //           Markup.callbackButton(`😂${increment}`, 'tearsofjoy'),
    //           Markup.callbackButton(`👍${increment}`, 'thumbsup'),
    //           Markup.callbackButton(`❤${increment}`, 'heart'),
    //           Markup.callbackButton(`🔥${increment}`, 'fire'),
    //           Markup.callbackButton(`👏${increment}`, 'clap'),
    //           Markup.callbackButton(`😀${increment}`, 'grin')
    //         ])));


  }

  castVote(ctx) {

    let voterUserId = ctx.update.callback_query.from.id;
    let messageId = ctx.update.callback_query.message.reply_to_message.message_id;
    let data = ctx.update.callback_query.data;

    user.castVote(voterUserId, messageId, data);

  }

  voteMiddleware(ctx, botName) {

    let msgObj = {
      id: ctx.update.callback_query.message.reply_to_message.message_id,
      usersVoted: []
    }
    let currentVoters = globalMessageInfo.find(x => x.id === msgObj.id);
    let cIndex = globalMessageInfo.findIndex(x => x.id === msgObj.id);
    let userName = ctx.update.callback_query.from.first_name;
    let voterId = ctx.update.callback_query.from.id;
    // ctx.getChatMembersCount().then((count) => {
    //     chatCount = count;
    //   })


    if (currentVoters) {
      if (currentVoters.usersVoted.indexOf(userName) > -1) {
        globalMessageInfo[cIndex].usersVoted.splice(userName, 1);
        state = 'downvote';
        user.downvoteUser(ctx, botName, voterId);
      } else {
        globalMessageInfo[cIndex].usersVoted.push(userName);
        state = 'upvote';
        user.upvoteUser(ctx, botName, voterId);

      }
    } else {
      msgObj.usersVoted.push(userName);
      globalMessageInfo.push(msgObj);
      state = 'upvote';
      user.upvoteUser(ctx, botName, voterId);
    }
    console.log(globalMessageInfo);

  }


}

module.exports = Vote;
