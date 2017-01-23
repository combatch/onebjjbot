# A Telegram Bot written in Node.js

## Bringing Upvotes to Telegram


![header](https://cloud.githubusercontent.com/assets/5941389/22005157/f0e793be-dc15-11e6-8ea8-292dbf54f2e3.png)

## Social Features!





## Commands


### Media
 `img <query>`
  returns a google image search based on query

  `gif <query>`
  returns a google gif search based on query

  `youtube <query>`
  returns a youtube link based on query

  `gif <query>`
  returns a google gif search based on query

### Bitcoin
  `/balance <address>`
  returns the balance of a bitcoin address in satoshis and BTC.

  `/coinbase`
  returns live exchange rate for USD/BTC via Coinbase

  `/btc`
  generates a live screenshot of bitcoinity.org/markets

  `/convert (currency) to (BTC)` or `/convert (BTC) to (currency)`
  gives you the live conversion values ie; $100 = 0.1 btc

### Social

  `/register`
  Saves the user's name and group id in order to use social features.

  `/leaderboard`
  Prints the users with the highest points in Descending order

  `upvote, lol(regex), lmao(regex), haha`
  replying to a message with these will trigger the upvote buttons.

### Etc

  `reply to message with 'translate <foreign language>'`
  translates the original message from <foreign language> to English.

  `/stocks <ticker>`
  returns live stock data based on ticker

  `/ss <url>`
  generates a live screenshot of the provided url.



## Required


  Make a copy of the `config.example` file found [here](https://github.com/combatch/onebjjbot/blob/master/config/config.example)

  This bot uses PostgresQL by default, but can be tweaked to work with MySQL.

  To make use of the google APIs, you will need API keys from http://cse.google.com/create/new

  A telegram token can be obtained by talking to the [botfather](https://core.telegram.org/bots#6-botfather)

  BitcoinAverage API key can be obtained [here](https://bitcoinaverage.com/en/register)



  Using the [telegraf](https://github.com/telegraf/telegraf) library.




## Installation
```
    git clone this repo
    npm install
    npm run dev
    or
    npm run prod
```

