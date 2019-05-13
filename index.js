// HN VImmy Bot
// Mike P Land
// Every Hour Scans Hacker News For Stories on Vim and Tweets Them, see mikepland.com/hn_vimmy_bot
// Script is being run with Crontab, ($ crontab -e)

let currentDateActual = new Date(new Date().getTime() + -(new Date().getTimezoneOffset()/60) * 3600 * 1000);
console.log("Running HN_Vimmy_Bot Scan: " + currentDateActual);

var request = require("request")
var Twitter = require("twitter")
var async = require('async');
var util = require('util');
var admin = require("firebase-admin");

var chatEmoji = '💬';
var linkEmoji = '🔗';

var shortUrl = require('node-url-shortener');
 
var client;
var searchTerm;
var locationIs;

if (new Date().getMinutes() < 30) {
    console.log("Loading VIM Profile");
    client = new Twitter({
        consumer_key: process.env.twitter_consumer_key,
        consumer_secret: process.env.twitter_consumer_secret,
        access_token_key: process.env.twitter_access_token_key,
        access_token_secret: process.env.twitter_access_token_secret
    });

    searchTerm = "vim";
    locationIs = "hnvimmybot";
} else {
    console.log("Loading Kotlin Profile");
    client = new Twitter({
        consumer_key: process.env.twitter_kotlin_consumer_key,
        consumer_secret: process.env.twitter_kotlin_consumer_secret,
        access_token_key: process.env.twitter_kotlin_access_token_key,
        access_token_secret: process.env.twitter_kotlin_access_token_secret
    });
    searchTerm = "kotlin"
    locationIs = "hnkotlinbot";
}

admin.initializeApp({
    credential: admin.credential.cert("/home/pi/newDayPi/HN_Vimmy_Bot/config/hnbot-8bb67-firebase-adminsdk-rszpo-c0cd32c24f.json"),
   // credential: admin.credential.cert("./config/hnbot-8bb67-firebase-adminsdk-rszpo-c0cd32c24f.json"),
    databaseURL: "https://hnbot-8bb67.firebaseio.com/"
});

var db = admin.database();
var ref = db.ref("/bots");

function grabDBSnapshot(callback) {
    ref.on("value", function(snapshot) {
        ref.off();
        callback(snapshot.val());
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
        process.exit(1);
    });
};

function saveNewStory(botPWD, savePackage, saveCallback) {
    console.log("Saving User Infomation To Database");
    ref.child(botPWD).update(savePackage).then(function() {
        console.log("Successfully Saved User Info to Database");
        saveCallback();
    }).catch(function(error) {
        console.log("Firebase Error: " + error);
        saveCallback();
    });
}

// Async makes sure to keep callback straight
var q = async.queue(function (task, finalCallback) {
    async.waterfall([
            function(mainCallback) {
                request(task.url, {timeout: 8000}, function(err, res, body) {
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

                // check title for stories with "vim" in the title
                var re = new RegExp("\\b" + searchTerm + "\\b", "gi");
                if (storyActualJSON.title.match(re)) {
                    // shorten HN Link
                    console.log("Found story on VIM: " + storyActualJSON.title);
                    console.log("Shortening HN Discussion Link", storyActualJSON.id);
                    shortUrl.short('https://news.ycombinator.com/item?id=' + storyActualJSON.id, function (err, url) {
                            // Shorten Story Link
                        if (err) {
                            console.log(util.inspect("Hacker News Link Error: " + err, false, null));
                            finalCallback();
                        } else {
                            console.log("Link Successfully Shortened");
                            mainCallback(null, storyActualJSON, url);
                        }
                    })
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
                    shortUrl.short(storyActualJSON.url, function (err, url) {
                        if (err) {
                            console.log(util.inspect("Story Link Error: " + err, false, null));
                            finalCallback();
                        } else {
                            console.log("Successfully Shortened Story Link");
                            var outgoingTweet = storyActualJSON.title + "\n" + chatEmoji + " " + hnLink + "\n" + linkEmoji + " " + url + "\n#HackerNews #VIM";
                            mainCallback(null, outgoingTweet)
                        }
                    })
                }
            },
            function(outgoingTweet, mainCallback) {
                console.log("Tweeting out Story");
                client.post('statuses/update', {status: outgoingTweet},  function(error, tweet, response){
                    if (!error && response.statusCode === 200) {
                        console.log("Just Successfully Tweeted");
                        mainCallback();
                    } else if (error) {
                        console.log(util.inspect("Tweet Error: " + error, false, null));
                        finalCallback();
                    } else {
                        finalCallback();
                    }
                });
            },
            function(mainCallback) {
                let savePackage = {};
                savePackage[task.storyID] = {status:"sent"};
                saveNewStory(locationIs + "/", savePackage, function() {
                    finalCallback();
                });
            },
            ]);
}, 10);

q.drain = function() {
    console.log("----------------------------------- SCAN COMPLETE -----------------------------------");
    process.exit(1);
};

// Grab top 500 stories
function fetchTopStories() {
    var postedStories = {};
    async.waterfall([
            function(outsideCallback) {
                grabDBSnapshot(function(snapshotOfDB) {
                    postedStories[locationIs] = snapshotOfDB[locationIs]
                    outsideCallback();
                });
            },
            function(outsideCallback) {
                request({
                    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
                    json: true
                }, function (error, response, groupOfStories) {
                    if (!error && response.statusCode === 200) {
                        let arrayOfStoryIDs = Object.keys(postedStories[locationIs]);

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
                    }
                })
            },
            ]);
}

// start script
fetchTopStories();
