// HN VImmy Bot
// Mike P Land
// Every Hour Scans Hacker News For Stories on Vim and Tweets Them, see mikepland.com/hn_vimmy_bot

var request = require("request")
var Twitter = require("twitter")
var googl = require('goo.gl');
var async = require('async');

function getAndSetAPIKey() {
    // Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
    googl.setKey(process.env.hn_vimmy_bot_google_api_key);

    // Get currently set developer key
    googl.getKey();
}

var client = new Twitter({
    consumer_key: process.env.twitter_consumer_key,
    consumer_secret: process.env.twitter_consumer_secret,
    access_token_key: process.env.twitter_access_token_key,
    access_token_secret: process.env.twitter_access_token_secret
});

// Async makes sure to keep callback straight
var q = async.queue(function (task, done) {
    request(task.url, function(err, res, body) {
        if (err) {
            console.log("Error in fetchStory" + err);
            sendDMErrorMessage(err);
            return done(err);
        }
        if (res.statusCode != 200) {
            console.log("Error in fetchStory" + err);
            sendDMErrorMessage(err);
            return done(res.statusCode);
        } else {
            // check if story is about VIM
            vimChecker(body);
        }

        done();
    });
}, 1);

// Grab top 500 stories
function fetchTopStories() {
    request({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    json: true
    }, function (error, response, body) {
        serveLogActual();
        if (!error && response.statusCode === 200) {
            compileTop30Stories(body)
        } else {
            console.log("Error on fetchTopStories" + error);
            sendDMErrorMessage(error);
        }
    })
}

// Log time
function serveLogActual() {
    var offset = -5;
    var currentDateActual = new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );
    console.log("Running HN_Vimmy_Bot Scan: " + currentDateActual);
}

// Grab top 30 stories
function compileTop30Stories(groupOfStories) {
    for (i = 0; i < 30; i++) {
        // fetch actual story to check it's title
        q.push({ url: 'https://hacker-news.firebaseio.com/v0/item/' + groupOfStories[i] + '.json' });
    }    
}

// Check to see if it's a VIM story
function vimChecker(storyActual) {
    // get JSON Parsed version
    var storyActualJSON = JSON.parse(storyActual)

    // check title for stories with "vim" in the title
    if (storyActualJSON.title.match(/vim/gi)) {
        // get and set Google API key for link shortening
        getAndSetAPIKey();

        // shorten HN Link
        googl.shorten('https://news.ycombinator.com/item?id=' + storyActualJSON.id)
            .then(function (shortUrl) {
                // Shorten Story Link
                shortenStoryLink(storyActualJSON, shortUrl);
            })
        .catch(function (err) {
            console.log("Hacker New Link Error: " + err.message);
        });
    } else {
        // console.log("no match for " + storyActualJSON.title)
    }
}

function shortenStoryLink(storyActual, hnLink) {
    // check to see if post is "Ask HN:" and thus no story link
    if (storyActual.url == undefined) {
        var wholeTweet = storyActual.title + "\nHN Discussion: " + hnLink + "\n#vim"

        // Tweet Story
        tweet(wholeTweet)
    } else {
        googl.shorten(storyActual.url)
            .then(function (shortUrl) {
                var wholeTweet = storyActual.title + "\nHN Discussion: " + hnLink + "\nStory Link: " + shortUrl + "\n#vim"

                // Tweet Story
                tweet(wholeTweet)
            })
        .catch(function (err) {
            console.error("Story Link Error: " + err.message);
            sendDMErrorMessage(error);
        });
    }
}

function tweet(tweetActual) {
    client.post('statuses/update', {status: tweetActual},  function(error, tweet, response){
        if (!error && response.statusCode === 200) {
            console.log("Just Tweeted");
        } else if (error) {
            console.log(error);
        }
    });
}

function sendDMErrorMessage(errorActual) {
    client.post('direct_messages/new', {text: errorActual, screen_name:"mikepland"},  function(error, tweet, response){
        if (!error && response.statusCode === 200) {
            console.log("Just DMed an Error Message");
        } else if (error) {
            console.log(error);
        }
    });
}

// start script
fetchTopStories();
