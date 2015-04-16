chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.name == "fetchPage") {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "https://www.googleapis.com/youtube/v3/videos?id=" + request.videoid + "&part=snippet,contentDetails,statistics&key=AIzaSyBUd0hFaYWyHwbNYKobR3af9utLz4zn6j4", true);
        xhr.onreadystatechange = function (evt) {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log("Successful.");
                    sendResponse({response: JSON.parse(xhr.responseText), videoid: request.videoid});
                } else {
                    console.log("Hmm. Failed for " + request.videoid + ".");
                }
            }
        }
        xhr.send();
        return true;
    } else if (request.name == "getOptions") {
        var defaults = {
            "textlinks":        1,
            "imglinks":         0,
            "embed":            1,
            "embedleft":        0,
            "replacename":      1,
            "tooltip":          1,
            "timestamp":        0,
            "timestamptooltip": 1,
            "restrictedicon":   1,
        };

        var resp = {};
        for (var key in defaults) {
            if (!(key in localStorage)) {
                localStorage[key] = defaults[key];
            }

            resp[key] = localStorage[key];
        }
        sendResponse(resp);
    } else if (request.name == "setOptions") {
        var options = request.options;
        for (var key in options) {
            localStorage[key] = options[key];
        }
    }
  }
);
