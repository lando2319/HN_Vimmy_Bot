require('dotenv').config({path:__dirname+'/.env'})
var searchTerm = process.argv[2] || "vim";

var async = require('async');
var util = require('util');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require(process.env.pwdToServiceFile);
const { TwitterApi } = require('twitter-api-v2');

var chatEmoji = '💬';
var linkEmoji = '🔗';

var shortUrl = require('node-url-shortener');

var client = new TwitterApi({
    appKey: process.env[searchTerm + "TwitterAPIKey"],
    appSecret: process.env[searchTerm + "TwitterAPIKeySecret"],
    accessToken: process.env[searchTerm + "TwitterAccessToken"],
    accessSecret: process.env[searchTerm + "TwitterAccessSecret"]
});

var date = new Date();
var prettyDate = date.toLocaleDateString('en-US', {
    year: "numeric",
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
});

console.log("========================\n\nStarting HN Bot Process for", searchTerm, prettyDate, "\n");

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

var queue = async.queue(function(storyID, callback) {
    var outgoingTweet = "";
    (async () => {
        try {
            storyID = storyID.toString();
            const response = await fetch('https://hacker-news.firebaseio.com/v0/item/' + storyID + '.json');
            const story = await response.json();

            var re = new RegExp("\\b" + searchTerm + "\\b", "gi");
            if (story.title.match(re)) {
                console.log("Found story on ", searchTerm, story.title);
                console.log("Shortening HN Discussion Link", story.id);
            } else {
                return callback();
            }

            var storyDoc = await db.collection(searchTerm).doc(storyID).get();

            if (storyDoc.exists) {
                console.log("Story Has Already Been Tweeted");
                return callback();
            }

            console.log("Shortening HN Link");
            var shortHNLink = await shortenURL('https://news.ycombinator.com/item?id=' + storyID);
            console.log("Successfully Shortened HN Link as", shortHNLink);

            var shortStoryURL = ""

            if (!story.url) {
                console.log("ASK HN Detected");
                outgoingTweet = story.title + "\n" + chatEmoji + ": " + shortHNLink + "\n#HackerNews #" + searchTerm.toUpperCase();
            } else {
                console.log("Shortening Story Link");
                shortStoryURL = await shortenURL(story.url);
                outgoingTweet = story.title + "\n" + chatEmoji + " " + shortHNLink + "\n" + linkEmoji + " " + shortStoryURL + "\n#HackerNews #" + searchTerm.toUpperCase();
                console.log("Successfully Shortened HN Link as", shortStoryURL);
            }

            console.log("Tweeting:\n\n", outgoingTweet);
            var tweetResponse = await client.v2.tweet(outgoingTweet, {});
            console.log("Successfully Tweeted", tweetResponse.data.id);

            console.log("Setting Record to firestore");
            await db.collection(searchTerm).doc(storyID).set({
                dateTweeted:new Date(),
                tweetID:tweetResponse.data.id,
                urlLink:shortStoryURL,
                shortHNLink:shortHNLink,
                tweetMessage:outgoingTweet
            });
            console.log("Successfully Saved Record To DB, Ending Process");
            callback();
        } catch(err) {
            console.log("ERROR in Queue", err);
            callback();
        }
    })();
}, 1);

queue.drain(function () {
    console.log("HN Bot for", searchTerm, "Process Complete");
    process.exit(0);
});

(async () => {
    try {
        const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
        const topStories = await response.json();

        topStories.forEach(storyID => {
            queue.push(storyID);
        })
    } catch (err) {
        console.log("ERROR", err);
        process.exit(1);
    }
})();

async function shortenURL(urlToShorten) {
    return new Promise(function (resolve, reject) {
        shortUrl.short(urlToShorten, function (err, url) {
            // Shorten Story Link
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        })
    })
}

