// HN VImmy Bot
// Mike P Land
// Every Hour Scans Hacker News For Stories on Vim and Tweets Them, see mikepland.com/hn_vimmy_bot
// Script is being run with Crontab, ($ crontab -e)

var request = require("request")
var Twitter = require("twitter")
var googl = require('goo.gl');
var async = require('async');

var chatEmoji = '💬';
var linkEmoji = '🔗';

// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
googl.setKey(process.env.hn_vimmy_bot_google_api_key);

// Get currently set developer key
googl.getKey();

var client = new Twitter({
    consumer_key: process.env.twitter_consumer_key,
    consumer_secret: process.env.twitter_consumer_secret,
    access_token_key: process.env.twitter_access_token_key,
    access_token_secret: process.env.twitter_access_token_secret
});

// Async makes sure to keep callback straight
var q = async.queue(function (task, finalCallback) {

    async.waterfall([
            function(mainCallback) {
                request(task.url, function(err, res, body) {
                    if (err) {
                        console.log("Error in fetchStory" + err);
                        finalCallback();
                    } else if (res.statusCode != 200) {
                        console.log("Error in fetchStory" + res);
                        finalCallback();
                    } else {
                        mainCallback(null, body)
                    }
                });
            },
            function(body, mainCallback) {
                var storyActualJSON = JSON.parse(body);

                // check title for stories with "vim" in the title
                if (storyActualJSON.title.match(/vim/gi)) {
                    // shorten HN Link
                    console.log("Found story on VIM: " + storyActualJSON.title);
                    console.log("Shortening HN Discussion Link");
                    googl.shorten('https://news.ycombinator.com/item?id=' + storyActualJSON.id)
                        .then(function (shortUrl) {
                            // Shorten Story Link
                            console.log("Link Successfully Shortened");
                            mainCallback(null, storyActualJSON, shortUrl);
                        })
                    .catch(function (err) {
                        console.log("Hacker New Link Error: " + err.message);
                        finalCallback();
                    });
                } else {
                    // console.log("no match for " + storyActualJSON.title)
                    finalCallback();
                }

            },
            function(storyActualJSON, hnLink, mainCallback) {
                console.log("Checking to see if story is \"ASK HN:\"");
                // check to see if post is "Ask HN:" and thus no story link
                if (storyActualJSON.url == undefined) {
                    var outgoingTweet = storyActualJSON.title + "\n" + chatEmoji + ": " + hnLink + "\n#HackerNews #VIM";
                    mainCallback(null, outgoingTweet);
                } else {
                    console.log("Shortening Story Link");
                    googl.shorten(storyActualJSON.url)
                        .then(function (shortUrl) {
                            console.log("Successfully Shortened Story Link");
                            var outgoingTweet = storyActualJSON.title + "\n" + chatEmoji + " " + hnLink + "\n" + linkEmoji + " " + shortUrl + "\n#HackerNews #VIM";
                            mainCallback(null, outgoingTweet)
                        })
                    .catch(function (err) {
                        console.error("Story Link Error: " + err.message);
                        // sendDMErrorMessage(error);
                        finalCallback();
                    });
                }
            },
            function(outgoingTweet, mainCallback) {
                console.error("Tweeting out Story");
                client.post('statuses/update', {status: outgoingTweet},  function(error, tweet, response){
                    if (!error && response.statusCode === 200) {
                        console.log("Just Successfully Tweeted");
                        finalCallback();
                    } else if (error) {
                        console.log(error);
                        finalCallback();
                    }
                });
            }
            ]);
}, 1);

// Grab top 500 stories
function fetchTopStories() {
    request({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    json: true
    }, function (error, response, groupOfStories) {
        serveLogActual();
        if (!error && response.statusCode === 200) {
            var numberOfStories = Object.keys(groupOfStories).length;

            for (i = 0; i < numberOfStories; i++) {
                // fetch actual story to check it's title
                q.push({ url: 'https://hacker-news.firebaseio.com/v0/item/' + groupOfStories[i] + '.json' });
            }    
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
