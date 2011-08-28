(function(multisweeper, $) {
    var templates = new multisweeper.Templates();
    templates.preload();

    function message(playerName, message) {
        if (typeof message === "undefined") {
            message = playerName;
            playerName = null;
        }
        templates.get("message", function(template) {
            $("#log").append(template({
                "time" : new Date().getTime(),
                "playerName" : playerName,
                "message" : message
            }));
            $("#log").scrollTop(1000000);
        });
    };

    function log(playerName, message) {
        if (document.cookie && document.cookie.match(/bacon/)) {
            message(playerName, message);
        }
    };

    function showModal(title, message) {
        templates.get("modal", function(template) {
            $("#modal").html(template({ "title" : title, "message" : message }));
            $(".overlay").show();
            $("#modal").show();
        });
    };

    var Utils = multisweeper.Utils = {
        "templates" : templates,
        "log" : log,
        "message": message,
        "showModal" : showModal
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);
