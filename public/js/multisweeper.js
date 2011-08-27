(function(multisweeper, $) {
    var game = new multisweeper.Game();
    var connected = false;

    $("#connect").bind("click", function(e) {
        if (connected) { return; }

        console.log("Connecting...")
        game.connect();

        connected = true;
    });

    $("#turn").bind("click", function() {
        console.log("Taking turn...");

        game.takeTurn()
    });
})(window.multisweeper = window.multisweeper || {}, jQuery);