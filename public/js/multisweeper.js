(function(multisweeper, $) {
    var game;
    var templates = new multisweeper.Templates();
    templates.preload();

    $("#joinGame").click(function() {
        game = new multisweeper.Game($("#name").val());
        game.join(showGame);
    });

    $("#name").keypress(function(event){
        if (event.keyCode === 13){
            event.preventDefault();

            $("#joinGame").click();
        }
    });

    function showGame() {
        templates.get("board", function(template) {
            $("#main").empty().html(template({uuid: game.gameId, board: game.state, players: game.players}));
        })
    }

    $(".cell").live('click', function() {
        var $this = $(this);
        id = $this.closest(".board").data('board-id');
        x = $this.closest(".row").data('row-id');
        y = $this.data('col-id');

        console.log("Click: " + x + "," + y);

        game.takeTurn(id,x,y);
    });
})(window.multisweeper = window.multisweeper || {}, jQuery);
