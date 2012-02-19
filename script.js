var YTTA = function () {};

YTTA.URLREGEX = /(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([-_A-Za-z0-9]{11})/i;
YTTA.ATTR_ID = 'data-ytta-id';
YTTA.ATTR_EMBED_ID = 'data-ytta-embed-id';
YTTA.ATTR_ORIG_HTML = 'data-ytta-html';
YTTA.ATTR_VISITED = 'data-ytta-visited';
YTTA.ATTR_EMBEDCODE = 'data-ytta-embedcode';

YTTA.CLASS_UPVOTES = 'ytta-vote-up';
YTTA.CLASS_DOWNVOTES = 'ytta-vote-down';
YTTA.CLASS_EMBED_ICON = 'ytta-embed-icon';
YTTA.CLASS_EMBED_DISABLED = 'ytta-embed-disabled';
YTTA.CLASS_EMBED_ENABLED = 'ytta-embed-enabled';

YTTA.EXTENSION_ID = chrome.i18n.getMessage('@@extension_id');
YTTA.EMBED_IMG = 'chrome-extension://' + YTTA.EXTENSION_ID + '/icons/embed.ico';


$(document).ready(function () {
    chrome.extension.sendRequest({name : 'options'}, function (resp) {
        YTTA.links = resp["textlinks"] ? resp["textlinks"]*1 : 1;
        YTTA.image = resp["imglinks"] ? resp["imglinks"]*1 : 0;
        YTTA.embedimage = resp["embed"] ? resp["embed"]*1 : 1;
        YTTA.replacename = resp["replacename"] ? resp["replacename"]*1 : 0;
        YTTA.tooltip = resp["tooltip"] ? resp["tooltip"]*1 : 1;

        $('body').on('DOMNodeInserted', function (e) {
            youtubifyLinks(e.target);
        });

        youtubifyLinks('body');
    });
});

function youtubifyLinks(target) {
    $(target).find('a[href]:not(['+YTTA.ATTR_ID+'])').each( function (i, elm) {
        var e = $(elm);
        e.attr(YTTA.ATTR_ID, '-');

        var match = e.attr('href').match(YTTA.URLREGEX);
        if (match) {
            var id = match[1];
            e.attr(YTTA.ATTR_ID, id);
            e.attr(YTTA.ATTR_ORIG_HTML, e.html());

            chrome.extension.sendRequest({
                "name": "fetchPage",
                "videoid": id,
            }, addTitle);
        }
    });
}

function addTitle(resp) {
    var gdata = resp.response;
    var id = resp.videoid;

    console.log(gdata);
    var title = gdata.entry.title.$t;
    var thumbnails = getThumbnails(gdata);
    var upvotepercent = getUpvotePercent(gdata);

    var e = $('a['+YTTA.ATTR_ID+'='+id+']:not(['+YTTA.ATTR_VISITED+'])').first();
    e.attr(YTTA.ATTR_VISITED, 'true');

    var isImage = e.find('img').length > 0;
    if (YTTA.links && !isImage || YTTA.image && isImage) {
        var text = '<b>YT: ' + title + '</b>';

        var orightml = e.attr(YTTA.ATTR_ORIG_HTML);
        if (!YTTA.replacename || orightml.search('http://') == -1) {
            text = orightml + " (" + text + ")";
        }

        text = '<i>'+text+'</i>';
        e.html(text);
    }

    if (YTTA.embedimage) {
        var starttime = extractTime(e.attr('href'));
        var embed = embedCode(id, starttime);

        e.after('<img src="' + YTTA.EMBED_IMG + '" ' +
                'class="' + YTTA.CLASS_EMBED_ICON + '" ' +
                'title="Click to play video inline." />' +
                '<div class="' + YTTA.CLASS_EMBED_DISABLED + '">' +
                    embed +
                '</div>');


        var embedimg = e.next();
        embedimg.on('click', function (e) {
            var embeddiv = $(e.target).next();
            if (embeddiv.hasClass(YTTA.CLASS_EMBED_DISABLED)) {
                embeddiv.removeClass(YTTA.CLASS_EMBED_DISABLED);
                embeddiv.addClass(YTTA.CLASS_EMBED_ENABLED);
            } else {
                embeddiv.removeClass(YTTA.CLASS_EMBED_ENABLED);
                embeddiv.addClass(YTTA.CLASS_EMBED_DISABLED);
            }
        });
    }

    if (YTTA.tooltip) {
        var tooltip = "<h1>" + title + "</h1>";

        tooltip += '<div>';
        for (var i = 0; i < thumbnails.length; i++) {
            var thumb = thumbnails[i];
            console.log(thumb);
            tooltip += '<img src="' + thumb['url'] + '" ' +
                       'width=' + thumb['width'] + ' ' +
                       'height=' + thumb['height'] + '/>';
        }
        tooltip += '</div>';
        tooltip += '<div class="'+YTTA.CLASS_DOWNVOTES+'">';
        tooltip += '<div class="'+YTTA.CLASS_UPVOTES+'" '+
                   'style="width: '+upvotepercent+'%"></span>';
        tooltip += '</div>';

        e.simpletip( {
            baseClass: 'ytta-tooltip',
            content: tooltip
        } );
    }
}

function getThumbnails(gdata) {
    var rawThumbs = gdata.entry.media$group.media$thumbnail;
    var thumbs = [];

    for (var i = 1; i < rawThumbs.length; i++) {
        thumbs.push(rawThumbs[i]);
    }
    return thumbs;
}

function getUpvotePercent(gdata) {
    var rating = gdata.entry.gd$rating;
    return 100*(rating.average - rating.min)/(rating.max - rating.min)
}

function extractTime(url) {
    var time = 0;
    if (url.search("#t=") > -1) {
        var tsmatch = url.match(/#t=(?:(\d*)h)?(?:(\d*)m)?(\d*)s?/);
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

        time = sec;
    }

    return time;
}

function embedCode(id, time) {
    return '<object width="425" height="355">' +
           '<param name="movie" ' +
                   'value="http://www.youtube.com/v/' + id + '?version=3&autohide=1&showinfo=0&fs=1&start=' + time + '"></param>' +
           '<param name="allowScriptAccess" value="always"></param>' +
           '<param name="allowFullScreen" value="true"></param>' +
           '<embed src="http://www.youtube.com/v/' + id + '?version=3&autohide=1&showinfo=0&fs=1&start=' + time + '" ' +
                   'type="application/x-shockwave-flash" ' +
                   'allowscriptaccess="always" ' +
                   'allowfullscreen="true" ' +
                   'width="425" height="355"></embed>' +
           '</object>';
}
