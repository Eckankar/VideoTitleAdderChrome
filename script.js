var YTTA = function () {};

YTTA.URLREGEX = /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|y2u\.be\/)([-_A-Za-z0-9]{11})/i;
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
YTTA.CLASS_RESTRICTED_ICON = 'ytta-restricted-icon';
YTTA.CLASS_VIDEOLENGTH = 'ytta-video-length';

YTTA.EXTENSION_ID = chrome.i18n.getMessage('@@extension_id');
YTTA.EMBED_IMG = 'chrome-extension://' + YTTA.EXTENSION_ID + '/icons/embed.svg';
YTTA.RESTRICTED_IMG = 'chrome-extension://' + YTTA.EXTENSION_ID + '/icons/restricted.gif';


$(document).ready(function () {
    chrome.extension.sendMessage({name : 'getOptions'}, function (resp) {
        YTTA.links = resp["textlinks"]*1;
        YTTA.image = resp["imglinks"]*1;
        YTTA.embedimage = resp["embed"]*1;
        YTTA.replacename = resp["replacename"]*1;
        YTTA.tooltip = resp["tooltip"]*1;
        YTTA.timestamp = resp["timestamp"]*1;
        YTTA.timestamptooltip = resp["timestamptooltip"]*1;
        YTTA.restrictedicon = resp["restrictedicon"]*1;
        YTTA.embedleft = resp["embedleft"]*1;

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver( function (mutations) {
            mutations.forEach( function (mutation) {
                if (mutation.type == 'childList') {
                    [].slice.call(mutation.addedNodes).forEach(youtubifyLinks);
                }
            } );
        } );
        observer.observe($('body').get(0), {
            childList: true,
            subtree: true,
        });
        youtubifyLinks('body');
    });
});

function youtubifyLinks(target) {
    $(target).find('a[href]:not(['+YTTA.ATTR_ID+'])').each( function (i, elm) {
        var e = $(elm);

        // Don't replace links in Twitter's "What's happening" box.
        if (e.hasClass('twitter-timeline-link') &&
            e.closest('.tweet-form').length > 0) { return; }

        e.attr(YTTA.ATTR_ID, '-');

        var match = e.attr('href').match(YTTA.URLREGEX);
        if (match) {
            var id = match[1];
            e.attr(YTTA.ATTR_ID, id);
            e.attr(YTTA.ATTR_ORIG_HTML, e.html());

            chrome.extension.sendMessage({
                "name": "fetchPage",
                "videoid": id,
            }, addTitle);
        }
    });
}

function addTitle(resp) {
    var id = resp.videoid;
    var gdata = resp.response.items[0];
    if (!gdata) return;

    console.log(gdata);

    var title = gdata.snippet.title;
    var videolength = getVideoLength(gdata);
    var thumbnails = getThumbnails(gdata);
    var upvotepercent = getUpvotePercent(gdata);
    var isrestricted = false; // XXX: Get working on API v3? getRestrictedInfo(gdata);

    var e = $('a['+YTTA.ATTR_ID+'='+id+']:not(['+YTTA.ATTR_VISITED+'])').first();
    e.attr(YTTA.ATTR_VISITED, 'true');

    var isImage = e.find('img').length > 0 ||
                  document.location.href.match(/reddit\.com/) && e.hasClass('thumbnail');
    if (YTTA.links && !isImage || YTTA.image && isImage) {
        var text = '<b>YT: ' + title;
        if (YTTA.timestamp) { text += ' (' + videolength + ')'; }
        text += '</b>';

        var orightml = e.attr(YTTA.ATTR_ORIG_HTML);
        if (!YTTA.replacename || orightml.search('http://') == -1) {
            text = orightml + " (" + text + ")";
        }

        text = '<i>'+text+'</i>';
        e.html(text);
    }

    if (!isImage) {
        if (YTTA.embedimage) {
            var starttime = extractTime(e.attr('href'));
            var embed = embedCode(id, starttime);

            var embedhtml = '<img src="' + YTTA.EMBED_IMG + '" ' +
                            'class="' + YTTA.CLASS_EMBED_ICON + '" ' +
                            'title="Click to play video inline." />' +
                            '<div class="' + YTTA.CLASS_EMBED_DISABLED + '">' +
                            embed +
                            '</div>';
            var embedimg;

            if (YTTA.embedleft) {
                e.before(embedhtml);
                embedimg = e.prev().prev();
            } else {
                e.after(embedhtml);
                embedimg = e.next();
            }

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

        if (isrestricted && YTTA.restrictedicon) {
            e.after('<img src="' + YTTA.RESTRICTED_IMG + '" ' +
                    'class="' + YTTA.CLASS_RESTRICTED_ICON + '" ' +
                    'title="This video is restricted in your country" />');
        }
    }

    if (YTTA.tooltip) {
        if (YTTA.timestamptooltip) { title += '<span class="'+YTTA.CLASS_VIDEOLENGTH+'">(' + videolength + ')</span>'; }

        tooltip = '<div>';
        for (var i = 0; i < thumbnails.length; i++) {
            var thumb = thumbnails[i];
            tooltip += '<img src="' + thumb['url'] + '" ' +
                       'width=' + thumb['width'] + ' ' +
                       'height=' + thumb['height'] + '/>';
        }
        tooltip += '</div>';
        if (upvotepercent) {
            tooltip += '<div class="'+YTTA.CLASS_DOWNVOTES+'">';
            tooltip += '<div class="'+YTTA.CLASS_UPVOTES+'" '+
                    'style="width: '+upvotepercent+'%"></span>';
            tooltip += '</div>';
        }

        $(e).qtip( {
            content: {
                title: title,
                text: tooltip
            },
            position: {
                adjust: { x: 5, y: 5 },
                target: 'mouse'
            },
            style: "qtip-light ytta-tooltip"
        });
    }
}

function getThumbnails(gdata) {
    var thumbs = [gdata.snippet.thumbnails.medium];

    return thumbs;
}

function getUpvotePercent(gdata) {
    try {
        var up   = 1*gdata.statistics.likeCount;
        var down = 1*gdata.statistics.dislikeCount;
        var percentage = 100*up/(up+down);
        return percentage;
    } catch (e) {
        return undefined;
    }
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

// Based on http://stackoverflow.com/q/1267283/79061 and http://gugod.org/2007/09/padding-zero-in-javascript/
function zeroPad(n, len) {
    return (new Array(len).join("0") + n).slice(-len);
}

// Inspired by http://stackoverflow.com/a/29153059/79061
function parseDuration(dur) {
    var matches = dur.match(/(-)?P(?:([\.,\d]+)Y)?(?:([\.,\d]+)M)?(?:([\.,\d]+)W)?(?:([\.,\d]+)D)?T(?:([\.,\d]+)H)?(?:([\.,\d]+)M)?(?:([\.,\d]+)S)?/);

    var pDur = {
        sign: matches[1] === undefined ? '+' : '-',
        years: matches[2] === undefined ? 0 : matches[2],
        months: matches[3] === undefined ? 0 : matches[3],
        weeks: matches[4] === undefined ? 0 : matches[4],
        days: matches[5] === undefined ? 0 : matches[5],
        hours: matches[6] === undefined ? 0 : matches[6],
        minutes: matches[7] === undefined ? 0 : matches[7],
        seconds: matches[8] === undefined ? 0 : matches[8]
    };

    return pDur;
}

function getVideoLength(gdata) {
    var dur = parseDuration(gdata.contentDetails.duration);
    var secs = dur.seconds, mins = dur.minutes, hrs = dur.hours;
    var length = zeroPad(secs, 2);
    if (hrs > 0) {
        length = hrs + ":" + zeroPad(mins, 2) + ":" + length;
    } else {
        length = mins + ":" + length;
    }

    return length;
}

function getRestrictedInfo(gdata) {
    try {
        var state = gdata.entry.app$control.yt$state;
        return state.name == 'restricted' && state.reasonCode == 'requesterRegion';
    } catch (e) {
        return false;
    }
}

function embedCode(id, time) {
    return '<object width="425" height="355">' +
           '<param name="movie" ' +
                   'value="//www.youtube.com/v/' + id + '?version=3&autohide=1&showinfo=0&fs=1&start=' + time + '"></param>' +
           '<param name="allowScriptAccess" value="always"></param>' +
           '<param name="allowFullScreen" value="true"></param>' +
           '<embed src="//www.youtube.com/v/' + id + '?version=3&autohide=1&showinfo=0&fs=1&start=' + time + '" ' +
                   'type="application/x-shockwave-flash" ' +
                   'allowscriptaccess="always" ' +
                   'allowfullscreen="true" ' +
                   'width="425" height="355"></embed>' +
           '</object>';
}
