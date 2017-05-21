// HN VImmy Bot
// Mike P Land
// Every Hour Scans Hacker News For Stories on Vim and Tweets Them, see mikepland.com/hn_vimmy_bot
// Script is being run with Crontab, ($ crontab -e)

var request = require("request")
var Twitter = require("twitter")
var googl = require('goo.gl');
var async = require('async');
var util = require('util');
var admin = require("firebase-admin");

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

admin.initializeApp({
    credential: admin.credential.cert("./config/hnbot-8bb67-firebase-adminsdk-rszpo-c0cd32c24f.json"),
    databaseURL: "https://hnbot-8bb67.firebaseio.com/"
});

var db = admin.database();
var ref = db.ref("/bots");

function grabDBSnapshot(callback) {
    console.log("Taking DB Snapshot");
    ref.on("value", function(snapshot) {
        console.log("Successfully got DB Snapshot");
        ref.off();
        callback(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        slackbot.deliverTheNutReport(false);
    });
};

function saveNewStory(botPWD, savePackage, saveCallback) {
    console.log("Saving User Infomation To Database");
    ref.child(botPWD).update(savePackage).then(function() {
        console.log("Successfully Saved User Info to Database");
        process.exit(1);
        saveCallback();
    }).catch(function(error) {
        console.log("Firebase Error: " + error);
        process.exit(1);
        saveCallback();
    });
}

// Async makes sure to keep callback straight
var q = async.queue(function (task, finalCallback) {
    async.waterfall([
            function(mainCallback) {
                request(task.url, function(err, res, body) {
                    if (err) {
                        console.log(util.inspect("Error in fetchStory " + err, false, null));
                        finalCallback();
                    } else if (res.statusCode != 200) {
                        console.log(util.inspect("Error in fetchStory response not 200 " + res.statusCode, false, null));
                        finalCallback();
                    } else {
                        mainCallback(null, body)
                    }
                });
            },
            function(body, mainCallback) {
                var storyActualJSON = JSON.parse(body);

                console.log("Found story: " + storyActualJSON.title);

                // check title for stories with "vim" in the title
                // if (storyActualJSON.title.match(/vim\b/gi)) {
                if (storyActualJSON.title.match(/Kotlin\b/gi)) {
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
                        console.log(util.inspect("Hacker News Link Error: " + err, false, null));
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
                        console.log(util.inspect("Story Link Error: " + err, false, null));
                        // sendDMErrorMessage(error);
                        finalCallback();
                    });
                }
            },
            function(outgoingTweet, mainCallback) {
                console.error("Tweeting out Story");
                // client.post('statuses/update', {status: outgoingTweet},  function(error, tweet, response){
                //     if (!error && response.statusCode === 200) {
                //         console.log("Just Successfully Tweeted");
                //         finalCallback();
                //     } else if (error) {
                //         console.log(util.inspect("Tweet Error: " + error, false, null));
                        // finalCallback();
                        mainCallback();
                //     } else {
                //         finalCallback();
                //     }
                // });
            },
            function(mainCallback) {
                let savePackage = {};
                savePackage[task.storyID] = {status:"sent"};
                saveNewStory("hnvimmybot/", savePackage, function() {
                    console.log("STOP");
                    process.exit(1);
                    finalCallback();
                });
            },
            ]);
}, 1);

// Grab top 500 stories
function fetchTopStories() {
    var postedStories = {};

    async.waterfall([
            function(outsideCallback) {
                grabDBSnapshot(function(snapshotOfDB) {
                    postedStories["hnvimmybot"] = snapshotOfDB.hnvimmybot;
                    outsideCallback();
                });
            },
            function(outsideCallback) {
                request({
                    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
                    json: true
                }, function (error, response, groupOfStories) {
                    serveLogActual();
                    if (!error && response.statusCode === 200) {

                        console.log("before");
                        console.log(postedStories);

                        let arrayOfStoryIDs = Object.keys(postedStories.hnvimmybot);
                        console.log(arrayOfStoryIDs)

                        let cleanStoriesList = groupOfStories.filter(function(val) {
                            let stringVal = val.toString();
                            return arrayOfStoryIDs.indexOf(stringVal) == -1;
                        });

                        for (i = 0; i < cleanStoriesList.length; i++) {
                            // fetch actual story to check it's title
                            q.push({ url: 'https://hacker-news.firebaseio.com/v0/item/' + cleanStoriesList[i] + '.json', storyID: cleanStoriesList[i]
                            });
                        }    
                        outsideCallback();
                    } else {
                        console.log(util.inspect("Error on fetchTopStories: " + error, false, null));
                        // sendDMErrorMessage(error);
                    }
                })
            },
            ]);
}

// Log time
function serveLogActual() {
    var currentDateActual = new Date()
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
