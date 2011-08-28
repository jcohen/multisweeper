(function(multisweeper, $) {
    var templates = new multisweeper.Templates();
    templates.preload();

    function message(message) {
        $("#log").append("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
        $("#log").scrollTop(1000000);
    };

    function log(message) {
        if (document.cookie && document.cookie.match(/bacon/)) {
            $("#log").append("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
            $("#log").scrollTop(1000000);
        }
    };

    function showModal(title, message) {
        this.templates.get("modal", function(template) {
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
