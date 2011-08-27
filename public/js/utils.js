(function(multisweeper, $) {
    var Utils = multisweeper.Utils = function() {

    };

    Utils.prototype.log = function(message) {
        $("#log").prepend("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);