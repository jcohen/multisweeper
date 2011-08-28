(function(multisweeper, $) {
    var templates = new multisweeper.Templates();
    templates.preload();

    function message(message) {
        $("#log").prepend("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
    };

    function log(message) {
        if (document.cookie && document.cookie.match(/bacon/)) {
            $("#log").prepend("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
        }
    };

    function showModal(title, message) {
        this.templates.get("modal", function(template) {
            $(".modal").html(template({ "title" : title, "message" : message }));
            $(".overlay").show();
            $(".modal").show();
        });
    };

    var Utils = multisweeper.Utils = {
        "templates" : templates,
        "log" : log,
        "message": message,
        "showModal" : showModal
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);
