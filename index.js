// HN VImmy Bot
// Mike P Land
// Every Hour Scans Hacker News For Stories on Vim and Tweets Them, see mikepland.com/hn_vimmy_bot

var request = require("request")
var Twitter = require("twitter")
var CronJob = require('cron').CronJob;
var googl = require('goo.gl');

// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey(process.env.hn_vimmy_bot_google_api_key);

// Get currently set developer key
googl.getKey();

new CronJob('0 * * * * ', function() {
    fetchTopStories()
}, null, true, 'America/Chicago');

var client = new Twitter({
    consumer_key: process.env.hn_vimmy_bot_twitter_consumer_key,
    consumer_secret: process.env.hn_vimmy_bot_twitter_consumer_secret,
    access_token_key: process.env.hn_vimmy_bot_twitter_access_token_key,
    access_token_secret: process.env.hn_vimmy_bot_twitter_access_token_secret
});

function serveLogActual() {
    var offset = -5;
    var currentDateActual = new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" );
    console.log("Running HN_Vimmy_Bot Scan: " + currentDateActual);
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
    // check title for stories with "vim" in the title
    if (storyActual.title.match(/vim/gi)) {
        // Link for HN Discussion Link
        var hnLink = "";

        // shorten HN Link
        googl.shorten('https://news.ycombinator.com/item?id=' + storyActual.id)
            .then(function (shortUrl) {
                hnLink = shortUrl;

                // Shorten Story Link
                shortenStoryLink(storyActual, hnLink);
            })
        .catch(function (err) {
            console.log("Hacker New Link Error: " + err.message);
        });
    }
}

function shortenStoryLink(storyActual, hnLink) {
    // Link for Story
    var storyLink = "";
    googl.shorten(storyActual.url)
        .then(function (shortUrl) {
            storyLink = shortUrl;

            var wholeTweet = storyActual.title + "\nHN Discussion: " + hnLink + "\nStory Link: " + storyLink + "\n#vim"

            // Tweet Story
            tweet(wholeTweet)
        })
    .catch(function (err) {
        console.error("Story Link Error: " + err.message);
    });
}


fetchTopStories()
// app.listen(3000);
