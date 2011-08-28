(function(multisweeper, $) {
    var Utils = multisweeper.Utils = function() {

    };

    Utils.prototype.message = function(message) {
        $("#log").prepend("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
    };
    Utils.prototype.log = function(message) {
        if (document.cookie && document.cookie.match(/bacon/)) {
            $("#log").prepend("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
        }
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);