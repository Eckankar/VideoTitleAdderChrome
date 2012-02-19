var ytcollapseimg = "data:image/gif,GIF89a%0B%00%0B%00%A2%00%00%00%00%00%FF%FF%FF%5C%AD%E0%B6%E3%FF%FF%A5%A5%CE%CE%CE%FF%FF%FF%00%00%00!%F9%04%01%00%00%06%00%2C%00%00%00%00%0B%00%0B%00%00%03%24h%B0%CC%3A0%8E%10%96%94%15%5Ci%1B%1B%1DA%05%04Pt%9E%B9%08C%E1%BE'%20%B0%DB%3A%D7J%BA%18%09%00%3B";
var ytexpandimg = "data:image/gif,GIF89a%0B%00%0B%00%A2%00%00%00%00%00%FF%FF%FF%5C%AD%E0%B6%E3%FF%FF%A5%A5%CE%CE%CE%FF%FF%FF%00%00%00!%F9%04%01%00%00%06%00%2C%00%00%00%00%0B%00%0B%00%00%03*h%B0%CC%3A0%8E%10Vd%B0%82K%40%81%16%A3m!A%05%5D%11.%A3%0A%08%60Z%B8%02%CC%7C%C3R%C33%0E(%8D%86!%01%00%3B";
var ytdisabled = "data:image/gif,GIF89a%0B%00%0B%00%A2%00%00%00%00%00%FF%FF%FF%5C%AD%E0%B6%E3%FF%FF%A5%A5%CE%CE%CE%FF%FF%FF%00%00%00!%F9%04%01%00%00%06%00%2C%00%00%00%00%0B%00%0B%00%00%03-h%B0%CC%3A0%8E%10%16%04%11W%0C%08(%DDg%0D%40U%15%20v%9D%05%A9%96p%BB%08!%E8%A5%02%8D%92%E8%9C%B7%10%99%A2%D10%24%00%00%3B";

// Added as an additional class to links that've already been worked on.
var MAGIC_CLASSNAME = 'ytta_chrome_beenhere_already';

var ytlinks, ytimage, ytembedimage, ytreplacename;

chrome.extension.sendRequest({name : 'options'}, function (resp) {
    console.log(resp);

    ytlinks = resp["textlinks"] ? resp["textlinks"]*1 : 1;
    ytimage = resp["imglinks"] ? resp["imglinks"]*1 : 0;
    ytembedimage = resp["embed"] ? resp["embed"]*1 : 1;
    ytreplacename = resp["replacename"] ? resp["replacename"]*1 : 0;

    youtubifyLinks();
});

var allLinks, thisLink, thetitle, tubelink;

{
    var it = document.evaluate('//a[@href]', document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
    allLinks = new Array();
    var link;
    while (link = it.iterateNext()) {
        allLinks.push(link);
    }
}

function youtubifyLinks() {
    for (var i = 0; i < allLinks.length; i++) {
        var link = allLinks[i];

        if (link.href.search('youtube.com/watch') > -1) {
            var theURL = unescape(link.href);
            var videoid = theURL.match(/youtube\.com\/watch\?.*v=([-_A-Za-z0-9]{11})/)[1];
            chrome.extension.sendRequest({name: "fetchPage", videoid: videoid, i: i}, function(resp) {
                addtitle(resp.i, resp.response, resp.videoid);
            });
        } else if (link.href.search('youtu.be/') > -1) {
            var theURL = unescape(link.href);
            var videoid = theURL.match(/youtu\.be\/([-_A-Za-z0-9]{11})/)[1];
            chrome.extension.sendRequest({name: "fetchPage", videoid: videoid, i: i}, function(resp) {
                addtitle(resp.i, resp.response, resp.videoid);
            });

        }
    }
}

function addtitle(number, response, videoid) {
    var link = allLinks[number];

    var videoname = response.entry.title.$t;

    var starttime = 0;
    if (link.href.search("#t=") > -1) {
        var tsmatch = link.href.match(/#t=(?:(\d*)h)?(?:(\d*)m)?(\d*)s?/);
        var sec = 0;
        if (tsmatch[1]) {
            sec += tsmatch[1] * 60 * 60;
        }
        if (tsmatch[2]) {
            sec += tsmatch[2] * 60;
        }
        if (tsmatch[3]) {
            sec += tsmatch[3] * 1;
        }

        starttime = sec;
    }

    var videoembed =
        '<object width="425" height="355">' +
        '<param name="movie" ' +
                'value="http://www.youtube.com/v/' + videoid + '?version=3&autohide=1&showinfo=0&fs=1&start=' + starttime + '"></param>' +
        '<param name="allowScriptAccess" value="always"></param>' +
        '<param name="allowFullScreen" value="true"></param>' +
        '<embed src="http://www.youtube.com/v/' + videoid + '?version=3&autohide=1&showinfo=0&fs=1&start=' + starttime + '" ' +
                'type="application/x-shockwave-flash" ' +
                'allowscriptaccess="always" ' +
                'allowfullscreen="true" ' +
                'width="425" height="355"></embed>' +
        '</object>';

    var embeddedtag = document.createElement('div');
    var btn = document.createElement('a');

    var alink = videoname + number;
    btn.id = alink;
    var embedid = alink + "embedded";
    embeddedtag.id = embedid;
    embeddedtag.style.display = 'none';
    embeddedtag.setAttribute("align", "center");
    embeddedtag.innerHTML = videoembed;
    btn.innerHTML = '<img src="' + ytexpandimg + '" align="top" border="0" title="Click to Show Video" style="display: inline; padding-left: 3px">';
    btn.addEventListener('click', function(){toggleembed(this.id,1);}, true);

    var childImgs = link.getElementsByTagName('img');
    var isImgLink = childImgs.length > 0;

    if ((isImgLink && ytimage) || (!isImgLink && ytlinks)) {
        if (ytreplacename && link.innerHTML.search('http://') > -1) {
            link.innerHTML = '<i><b>YT: ' + videoname + '</b></i>';
        } else {
            link.innerHTML = '<i>' + link.innerHTML + " (<b>YT: " + videoname + "</b>)</i>";
        }
    }

    if (ytembedimage == 1) {
        link.parentNode.insertBefore(embeddedtag, link.nextSibling);
        link.parentNode.insertBefore(btn, link.nextSibling);
    }

    if (isImgLink && !ytimage) {
        for (var i = 0; i < childImgs.length; i++) {
            childImgs[i].setAttribute('title', 'YouTube link: Video name = "' + videoname + '"');
        }
    }

    link.setAttribute('title', 'YouTube link: Video name = "' + videoname + '"');
}

function toggleembed(id,embedable)
{
	embeddedid = id + "embedded";
	isembedded = document.getElementById(embeddedid);
	if (isembedded.style.display != 'none')
	{
		if (embedable == 1) document.getElementById(id).innerHTML = '<img src="' + ytexpandimg + '" align="top" border="0" title="Click to Show Video" style="display: inline">';
		if (embedable == 0) document.getElementById(id).innerHTML = '<img src="' + ytdisabled + '" align="top" border="0" title="Embedding disabled for this video, click to see preview thumb" style="display: inline">';
		isembedded.style.display = 'none';
	}
	else
	{
		document.getElementById(id).innerHTML = '<img src="' + ytcollapseimg + '" align="top" border="0" title="Click to Hide Video" style="display: inline">';
		isembedded.style.display = '';
	}
}

function unescapeHTML(s)
{
	return s.replace(
	  /&(amp|[lg]t|quot);/g,
	  function(m, p1)
	  {
		var map = {
		  amp:  "&",
		  lt:   "<",
		  gt:   ">",
		  quot: '"'
		};

		return map[p1];
	  });
}
