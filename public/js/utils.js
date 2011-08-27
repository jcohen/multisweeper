(function(multisweeper, $) {
    var Utils = multisweeper.Utils = function() {

    };

    Utils.prototype.log = function(message) {
        $("#log").append("<b>[" + new Date().getTime() + "]</b> " + message + "<br />");
    };
})(window.multisweeper = window.multisweeper || {}, jQuery);