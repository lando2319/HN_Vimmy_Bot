var request = require("request")
var twitterCreds = require("./twitterCreds.js")
var Twitter = require("twitter")
var CronJob = require('cron').CronJob;
var express = require("express")
// var app = express()

var lastFetches = [9655252]

new CronJob('0 * * * * ', function() {
    console.log("I'm fetching")
    // addToArrayOfFetches(new Date())
    fetchTopStories()
}, null, true, 'America/Chicago');

// app.get('/', function(req, res) {
//     res.send(lastFetches);
// });

var client = new Twitter({
    consumer_key: twitterCreds.consumer_key,
    consumer_secret: twitterCreds.consumer_secret,
    access_token_key: twitterCreds.access_token_key,
    access_token_secret: twitterCreds.access_token_secret
});

function tweet(tweetActual) {
    client.post('statuses/update', {status: tweetActual},  function(error, tweet, response){
        if(error) throw error;
        console.log("I just Tweeted");
        addToArrayOfFetches("I just Tweeted")
    });
}

// function addToArrayOfFetches(fetchActual) {
//     if (fetchActual.count == 10) {
//         delete fetchActual[0]
//         lastFetches.push(fetchActual)
//     } else {
//         lastFetches.push(fetchActual)
//     }
// }

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
    if (storyActual.title.match(/React/gi)) {
    // if (storyActual.title.match(/Jerk/gi)) {
        var wholeTweet = storyActual.title + " " + storyActual.url
        // checkForRepeats(storyActual.id, wholeTweet)
        tweet(wholeTweet)
    }
}

function checkForRepeats(storyID, wholeTweet) {
    // THis isn't working it's suppose to check for repeats
    for (i = 0; i < lastFetches.length; i++) { 
        if (lastFetches[i] == storyID) {
            break
        }
    }
    lastFetches.push(storyID)
    tweet(wholeTweet)
    // console.log(lastFetches)
    // console.log("pseudo tweet")
}

fetchTopStories()
// app.listen(3000);
