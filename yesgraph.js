;
(function() {

    var VERSION = "v0.0.1",
        YESGRAPH_BASE_URL = (window.location.hostname === 'localhost' && window.document.title === 'YesGraph') ? 'http://localhost:5001' : 'https://api.yesgraph.com',
        YESGRAPH_API_URL = YESGRAPH_BASE_URL + '/v0',
        CLIENT_TOKEN_ENDPOINT = '/client-token',
        ADDRBOOK_ENDPOINT = '/address-book',
        SUGGESTED_SEEN_ENDPOINT = '/suggested-seen',
        INVITES_SENT_ENDPOINT = '/invites-sent',
        INVITES_ACCEPTED_ENDPOINT = '/invites-accepted',
        ANALYTICS_ENDPOINT = '/analytics/sdk',
        CLIENT_TOKEN,
        INVITE_LINK,
        APP_NAME;

    function withScript(globalVar, script, func) {
        // Get the specified script if it hasn't been loaded already
        if (window.hasOwnProperty(globalVar)) {
            func(window[globalVar]);
        } else {
            return (function(d, t) {
                var g = d.createElement(t),
                    s = d.getElementsByTagName(t)[0];
                g.src = script;
                s.parentNode.insertBefore(g, s);
                g.onload = function() {
                    func(window[globalVar]);
                };
            }(document, 'script'));
        };
    }

    // Get jQuery if it hasn't been loaded separately
    withScript("jQuery", "https://code.jquery.com/jquery-2.1.1.min.js", function($) {
        var cookie = (function() {

            function setCookie(key, val, expDays) {
                var cookie = key + '=' + val;
                if (expDays) {
                    var expDate = new Date();
                    expDate.setTime(expDate.getTime() + (expDays * 24 * 60 * 60 * 1000));
                    cookie = cookie + '; expires=' + expDate.toGMTString();
                };
                window.document.cookie = cookie;
            }

            function readCookie(key) {
                var key = key + "=";
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i];
                    while (cookie.charAt(0) == ' ') cookie = cookie.substring(1);
                    if (cookie.indexOf(key) == 0) {
                        var value = cookie.substring(key.length, cookie.length);
                        if (value != "undefined") return value;
                    };
                };
            }

            function eraseCookie(key) {
                setCookie(key, '#', -1);
            }

            return {
                set: setCookie,
                read: readCookie,
                erase: eraseCookie
            };
        }());

        function logScreenEvent() {
            var eventData = {
                "entries": [{
                    "context": {
                        "app": {
                            "name": window.navigator.appName,
                            "version": window.navigator.appVersion
                        },
                        "library": {
                            "name": "yesgraph.js",
                            "version": VERSION
                        },
                        "device": {
                            "type": "web"
                        },
                        "os": {},
                        "userAgent": window.navigator.userAgent || null,
                        "page": {
                            "path": window.location.pathname,
                            "referrer": window.document.referrer,
                            "search": window.location.search,
                            "title": window.document.title,
                            "url": window.location.href
                        },
                    },
                    "name": window.document.title + ': ' + window.location.pathname,
                    "properties": {
                        "app_name": APP_NAME
                    },
                    "timestamp": new Date(),
                    "type": "screen"
                }, ]
            };
            return hitAPI(ANALYTICS_ENDPOINT, "POST", eventData);
        }

        function storeToken(data) {
            CLIENT_TOKEN = data.token;
            INVITE_LINK = data.inviteLink;
            cookie.set('yg-client-token', data.token);
        }

        function getClientToken(userData) {
            var data = {
                appName: APP_NAME
            };
            data.userData = userData || undefined;
            CLIENT_TOKEN = cookie.read('yg-client-token');
            data.token = CLIENT_TOKEN || undefined;
            return hitAPI(CLIENT_TOKEN_ENDPOINT, "POST", data, storeToken).fail(function(data){
                alert(data.error + " Please see docs.yesgraph.com/javascript-sdk");
            });
        }

        function rankContacts(rawContacts, done) {
            return hitAPI(ADDRBOOK_ENDPOINT, "POST", rawContacts, done);
        }

        function getRankedContacts(done) {
            return hitAPI(ADDRBOOK_ENDPOINT, "GET", null, done);
        }

        function postSuggestedSeen(seenContacts, done) {
            return hitAPI(SUGGESTED_SEEN_ENDPOINT, "POST", seenContacts, done);
        }

        function postInvitesSent(invitesSent, done) {
            return hitAPI(INVITES_SENT_ENDPOINT, "POST", invitesSent, done);
        }

        function postInvitesAccepted(invitesAccepted, done) {
            return hitAPI(INVITES_ACCEPTED_ENDPOINT, "POST", invitesAccepted, done);
        }

        function test(done) {
            return hitAPI('/test', "GET", null, done);
        }

        function YesGraphError(msg) {
            this.message = msg;
            this.name = "YesGraphError";
            this.prototype = Error.prototype;
        }

        function error(msg, fail) {
            var e = new YesGraphError(msg);
            if (fail) {
                throw e;
            } else {
                console.log(e.toString());
            };
        }

        function configureAPI() {
            APP_NAME = $('#yesgraph').data("app");
            userData = $('#yesgraph').data();
            getClientToken(userData).then(logScreenEvent);

            var api = {
                rankContacts: rankContacts,
                getRankedContacts: getRankedContacts,
                postSuggestedSeen: postSuggestedSeen,
                postInvitesSent: postInvitesSent,
                postInvitesAccepted: postInvitesAccepted,
                hitAPI: hitAPI,
                test: test,
                app: APP_NAME,
                getInviteLink: function() {
                    return INVITE_LINK;
                },
                hasClientToken: function() {
                    return Boolean(CLIENT_TOKEN);
                },
                error: error
            };
            return api;
        }

        window.YesGraphAPI = configureAPI();

        function hitAPI(endpoint, method, data, done, deferred) {
            var d = deferred || $.Deferred();
            if (method.toUpperCase() !== "GET") {
                data = JSON.stringify(data || {});
            };
            $.ajax({
                url: YESGRAPH_API_URL + endpoint,
                data: data,
                method: method,
                contentType: "application/json; charset=UTF-8",
                headers: {
                    "Authorization": "ClientToken " + CLIENT_TOKEN
                },
                success: function(data) {
                    data = typeof data === "string" ? JSON.parse(data) : data;
                    d.resolve(data);
                },
                error: function(data) {
                    d.reject(data.responseJSON);
                }
            });
            if (done) {
                d.done(done);
            }
            return d.promise();
        }
    });
}());