var request = require("request")
var twitterCreds = require("./twitterCreds.js")
var Twitter = require("twitter")
var CronJob = require('cron').CronJob;

new CronJob('0 * * * * ', function() {
    serveLogActual()
    fetchTopStories()
}, null, true, 'America/Chicago');

var client = new Twitter({
    consumer_key: twitterCreds.consumer_key,
    consumer_secret: twitterCreds.consumer_secret,
    access_token_key: twitterCreds.access_token_key,
    access_token_secret: twitterCreds.access_token_secret
});

function serveLogActual() {
    var currentdate = new Date(); 
    var datetime = "HN_Vimmy_Bot running Scan: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth()+1)  + "/" 
                    + currentdate.getFullYear() + " @ "  
                    + currentdate.getHours() + ":"  
                    + currentdate.getMinutes() + ":" 
                    + currentdate.getSeconds();

    console.log(datetime)
}

function tweet(tweetActual) {
    client.post('statuses/update', {status: tweetActual},  function(error, tweet, response){
        if (!error && response.statusCode === 200) {
            console.log("I just Tweeted");
        } else {
            console.log(error)
        }
    });
}

function fetchTopStories() {
    request({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
    json: true
    }, function (error, response, body) {
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
