var opts = [];

// Saves options to localStorage.
function save_options() {
    var newOptions = {};
    for (var i = 0; i < opts.length; i++) {
        var key = opts[i];
        var elms = document.getElementsByName(key);

        if (elms) {
            var elm = elms[0];

            newOptions[key] = elm.checked ? 1 : 0;
        }
    }

    chrome.extension.sendMessage({
        "name": 'setOptions', "options": newOptions
    }, function (resp) { });
}

// Restores select box state to saved value from localStorage.
function restore_options() {
    chrome.extension.sendMessage({name : 'getOptions'}, function (resp) {
        for (var key in resp) {
            opts.push(key);

            var value = resp[key];
            var elms = document.getElementsByName(key);
            elms[0].checked = value == 1 ? true : false;
        }
    });
}

$(function () {
    restore_options();
    $('#save_options_button').click(save_options);
});

