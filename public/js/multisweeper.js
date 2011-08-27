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
    
    $(".done").live('click', function() {
       window.location.href="/game"; 
    });

    function showGame() {
        templates.get("board", function(template) {
            $("#main").empty().html(template({uuid: game.gameId, board: game.state, players: game.players}));
        })
    }

    $(".cell").live('click', function(e) {
        var $this = $(this);
        id = $this.closest(".board").data('board-id');
        x = $this.closest(".row").data('row-id');
        y = $this.data('col-id');

        console.log("Click: " + x + "," + y);
        if (e.shiftKey) {
            game.flag(id,x,y);
        } else {
            game.takeTurn(id,x,y);
        }
    });
})(window.multisweeper = window.multisweeper || {}, jQuery);
