var opts = [];

// Saves options to localStorage.
function save_options() {
    var newOptions = {};
    for (var i = 0; i < opts.length; i++) {
        var key = opts[i];
        var elms = document.getElementsByName(key);

        for (var j = 0; j < elms.length; j++) {
            var child = elms[j];
            if (child.checked) {
                newOptions[key] = child.value;
                break;
            }
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
            for (var j = 0; j < elms.length; j++) {
                var child = elms[j];
                if (child.value == value) {
                    child.checked = "true";
                    break;
                }
            }
        }
    });
}

$(function () {
    restore_options();
    $('#save_options_button').click(save_options);
});

