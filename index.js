var request = require("request")
var Twitter = require("twitter")
var twitterCreds = require("./twitterCreds.js")

var client = new Twitter({
  consumer_key: twitterCreds.consumer_key,
  consumer_secret: twitterCreds.consumer_secret,
  access_token_key: twitterCreds.access_token_key,
  access_token_secret: twitterCreds.access_token_secret
});

client.post('statuses/update', {status: 'I\'M HN Vimmy Bot, testing my code here - sent via Node'},  function(error, tweet, response){
      if(error) throw error;
        console.log(tweet);  // Tweet body. 
        console.log(response);  // Raw response object. 
});

function fetchTopStories() {
    request({
        url: "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
    json: true
    }, function (error, response, body) {

        if (!error && response.statusCode === 200) {
            fetchStory(body)
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
            hnChecker(body)
        }
    })
}

function hnChecker(storyActual) {
    if (storyActual.title.match(/sake/gi)) {
        console.log(storyActual.title)
    }
}

// fetchTopStories()
// fetchStory(9602092)


var groupOfStories = [ 9602092, 9602323, 9602055, 9600015, 9601777, 9602052, 9601814, 9600364, 9601925, 9601118, 9601995, 9601697, 9601651, 9601770, 9602046, 9601234, 9600400, 9600427, 9601090, 9600803, 9599870, 9600832, 9599722, 9600028, 9601330, 9600955, 9599905, 9600776, 9601852, 9601737, 9600571, 9600354, 9599341, 9600584, 9600320, 9600567, 9601181, 9600084, 9600148, 9602238, 9600906, 9601928, 9602130, 9599834, 9599254, 9599961, 9596160, 9599976, 9602147, 9600401, 9600717, 9601748, 9599969, 9600351, 9599437, 9599544, 9601334, 9599479, 9601065, 9598943, 9598619, 9602090, 9598333, 9598527, 9600582, 9601880, 9599501, 9600415, 9598616, 9598972, 9599891, 9598974, 9602199, 9598443, 9601735, 9599427, 9598458, 9599998, 9598210, 9601179, 9600139, 9599496, 9598885, 9599081, 9600342, 9601486, 9598617, 9601108, 9602081, 9600106, 9600325, 9599266, 9598512, 9600036, 9599903, 9599726, 9600215, 9602145, 9601168, 9600885, 9595579, 9599164, 9602024, 9601253, 9601550, 9600817, 9601849, 9598871, 9601462, 9598015, 9600721, 9596841, 9601683, 9601659, 9601847, 9593085, 9600954, 9601750, 9600990, 9598255, 9597873, 9596496, 9601200, 9598211, 9588901, 9600063, 9597718, 9601203, 9600958, 9598911, 9601185, 9599528, 9598812, 9598918, 9596268, 9598396, 9600474, 9601469, 9598014, 9599148, 9599732, 9594158, 9600622, 9601249, 9601061, 9599292, 9598345, 9597348, 9598844, 9600707, 9600533, 9597862, 9594635, 9587627, 9592069, 9592637, 9595853, 9600433, 9600363, 9598256, 9599670, 9597999, 9600586, 9591739, 9596424, 9592588, 9599858, 9600749, 9595944, 9599142, 9594201, 9597409, 9598438, 9592601, 9600522, 9592210, 9591348, 9598660, 9598460, 9598525, 9590672, 9596752, 9572426, 9560839, 9587772, 9597042, 9591441, 9546382, 9589733, 9591703, 9553243, 9591732, 9585169, 9589706, 9545180, 9588794, 9599243, 9592357, 9536193, 9591711, 9591132, 9576777, 9580746, 9516093, 9508372, 9588223, 9587961, 9601594, 9562212, 9582839, 9595439, 8965608, 9496480, 9599212, 9596655, 9596564, 9593507, 9584325, 9596490, 9598302, 9597580, 9599273, 9596488, 9595977, 9598877, 9597811, 9597416, 9597406, 9597652, 9598867, 9597263, 9597576, 9577476, 9562379, 9568636, 9560426, 9590018, 9600066, 9598261, 9596410, 9597328, 9597198, 9597323, 9596612, 9595437, 9593916, 9596688, 9592812, 9592928, 9599692, 9598414, 9593294, 9596312, 9596618, 9599077, 9599665, 9596033, 9595881, 9598674, 9595506, 9588128, 9596356, 9583384, 9595507, 9597170, 9595116, 9596032, 9598223, 9597934, 9596401, 9593412, 9593292, 9593033, 9596895, 9591650, 9597836, 9595874, 9595038, 9598930, 9598902, 9597758, 9597976, 9597567, 9599237, 9598950, 9598899, 9595127, 9595377, 9599151, 9598003, 9598309, 9582969, 9598370, 9595759, 9590694, 9595792, 9596379, 9596269, 9597835, 9595833, 9598872, 9592500, 9591795, 9598933, 9597457, 9596599, 9588589, 9576396, 9597473, 9586365, 9598521, 9592085, 9590359, 9590470, 9596596, 9594134, 9597075, 9594702, 9586582, 9595561, 9598658, 9595431, 9597672, 9583196, 9598659, 9585631, 9569934, 9574408, 9595925, 9577861, 9597316, 9596567, 9597207, 9596758, 9594278, 9589104, 9551937, 9543005, 9594388, 9582478, 9581862, 9592673, 9583357, 9593410, 9596558, 9598097, 9597231, 9593700, 9597091, 9594452, 9595983, 9597893, 9588175, 9597460, 9598075, 9595434, 9597764, 9594786, 9596535, 9598016, 9595152, 9592378, 9592984, 9596685, 9594972, 9590008, 9597503, 9588492, 9587981, 9592781, 9590699, 9591868, 9577581, 9558976, 9587746, 9598550, 9585794, 9593435, 9594028, 9596748, 9596821, 9593254, 9591230, 9591841, 9596948, 9592574, 9593114, 9593500, 9597572, 9596623, 9594531, 9590986, 9592678, 9596325, 9593574, 9591627, 9593128, 9595817, 9596668, 9586991, 9588271, 9562923, 9558996, 9596970, 9596958, 9587295, 9593314, 9594397, 9588547, 9593332, 9563431, 9589034, 9525266, 9592138, 9594958, 9509698, 9518870, 9594536, 9596295, 9596048, 9596901, 9596342, 9595504, 9596443, 9593102, 9593790, 9595099, 9592947, 9591937, 9577920, 9592531, 9591098, 9588848, 9595031, 9588845, 9588455, 9593280, 9587819, 9586489, 9594449, 9582690, 9585965, 9593336, 9535541, 9586401, 9458268, 9592175, 9594268, 9595835, 9596315, 9595645, 9593045, 9592681, 9592104, 9595130, 9596200, 9596339, 9588148, 9594091, 9592933, 9592451, 9591057, 9571827, 9594506, 9589021, 9587393, 9521151, 9522467, 9592675, 9597475, 9595213, 9591126, 9594904, 9593436, 9595254, 9593130, 9594480, 9594216, 9587739, 9595819, 9595654, 9586413, 9595852, 9593630, 9587388, 9590637, 9591460, 9593031, 9590264, 9586515, 9590828, 9590082, 9586913, 9589736, 9592113, 9589276, 9592464, 9588729, 9593512, 9585466 ]


// compileTop30Stories(groupOfStories)
