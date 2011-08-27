(function(multisweeper, $) {
    var game;
    var templates = new multisweeper.Templates();
    templates.preload();

    $("#joinGame").click(function() {
        game = new multisweeper.Game($("#name").val());
        game.join(showGame);
    });

    $("#randomMove").live("click", function() {
        function random(upTo) {
            return Math.floor(Math.random() * upTo) + 1;
        }

        var boardId = random(9);
        var x = random(10);
        var y = random(10);

        game.takeTurn(boardId, x, y);
    });

    function showGame() {
        templates.get("game", function(template) {
            $("#main").empty().html(template(game.state));
        })
    }
})(window.multisweeper = window.multisweeper || {}, jQuery);
