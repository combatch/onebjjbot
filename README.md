# A Telegram Bot written in Node.js

## Bringing Upvotes to Telegram


![header](https://cloud.githubusercontent.com/assets/5941389/23197671/c7905320-f876-11e6-852d-64645180704d.png)

## Social Features!





## Commands


### Social

![upvote](https://cloud.githubusercontent.com/assets/5941389/23198385/0eb63954-f87c-11e6-8f30-82b4ddee9d73.gif)

  `upvote, lol(regex), lmao(regex), haha`
  replying to a message with these will trigger the upvote buttons.


![leaderboard](https://cloud.githubusercontent.com/assets/5941389/23198418/477b35f0-f87c-11e6-9ea8-dbebd8fcfde8.gif)

  `/leaderboard`
  Prints the users with the highest points in Descending order


  `/register`
  Saves the user's name and group id in order to use social features.


### Media

![img](https://cloud.githubusercontent.com/assets/5941389/23198376/fa660fce-f87b-11e6-813e-1050ba6ad8fb.gif)

 `img <query>`
  returns a google image search based on query.

![gif](https://cloud.githubusercontent.com/assets/5941389/23198380/0580b080-f87c-11e6-8c14-4dba81300898.gif)

  `giphy <query>`
  returns a .mp4 file based on query (faster but less reliable results).

  `gif <query>`
  returns a google gif search based on query.

  `youtube <query>`
  returns a youtube link based on query.


### Bitcoin
  `/balance <address>`
  returns the balance of a bitcoin address in satoshis and BTC.

![coinbase](https://cloud.githubusercontent.com/assets/5941389/23198424/4ed9b52e-f87c-11e6-846f-efe66153472c.gif)

  `/coinbase`
  returns live exchange rate for USD/BTC via Coinbase

  `/btc`
  generates a live screenshot of bitcoinity.org/markets

  `/convert (currency) to (BTC)` or `/convert (BTC) to (currency)`
  gives you the live conversion values ie; $100 = 0.1 btc

### Etc

![translate](https://cloud.githubusercontent.com/assets/5941389/23198432/589efd1c-f87c-11e6-8340-a447a10abc86.gif)


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

