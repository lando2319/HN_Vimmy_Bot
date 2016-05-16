var request = require("request")
var twitterCreds = require("./twitterCreds.js")
var Twitter = require("twitter")
var CronJob = require('cron').CronJob;
var googl = require('goo.gl');

// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey(twitterCreds.googleLinkShortenerAPI);

// Get currently set developer key
googl.getKey();

// Shorten a long url and output the result
googl.shorten('http://www.mikepland.com/apps')
    .then(function (shortUrl) {
        console.log("shorty is");
        console.log(shortUrl);
    })
    .catch(function (err) {
        console.error(err.message);
    });

new CronJob('0 * * * * ', function() {
    fetchTopStories()
}, null, true, 'America/Chicago');

var client = new Twitter({
    consumer_key: twitterCreds.consumer_key,
    consumer_secret: twitterCreds.consumer_secret,
    access_token_key: twitterCreds.access_token_key,
    access_token_secret: twitterCreds.access_token_secret
});

function serveLogActual() {
    var offset = -5;
    var currentDateActual = new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );
    console.log("Running HN_Vimmy_Bot Scan: " + currentDateActual);
}

function tweet(tweetActual) {
    client.post('statuses/update', {status: tweetActual},  function(error, tweet, response){
        if (!error && response.statusCode === 200) {
            console.log("I just Tweeted");
        } else if (error) {
            // console.log("Is this going to call??");
            console.log(error);
        }
    });
}

function fetchTopStories() {
    request({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
    json: true
    }, function (error, response, body) {
        serveLogActual();
        if (!error && response.statusCode === 200) {
            compileTop30Stories(body)
        } else {
            console.log(error)
        }
    })
}

function compileTop30Stories(groupOfStories) {
    for (i = 0; i < 30; i++) {
        fetchStory(groupOfStories[i])
    }    
}

function fetchStory(storyID) {
    request({
        url: "https://hacker-news.firebaseio.com/v0/item/" + storyID + ".json?print=pretty",
    json: true
    }, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            vimChecker(body)
        } else {
            console.log(error)
        }
    })
}

function vimChecker(storyActual) {
    if (storyActual.title.match(/vim/gi)) {
        var wholeTweet = storyActual.title + " " + storyActual.url
        tweet(wholeTweet)
    }
}

fetchTopStories()
// app.listen(3000);
