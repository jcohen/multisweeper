(function(multisweeper, $) {
    var game;
    var util = multisweeper.Utils;

    $("#joinGame").click(function() {
        var name = $("#name").val();

        if (!name) {
            util.showModal("Name is required", "You don't want to make the multisweeper bot angry. He's got a ROOM full of mines!");
            return;
        }

        game = new multisweeper.Game($("#name").val());
        game.join(showGame);
    });

    $("#name").keypress(function(event){
        if (event.keyCode === 13){
            event.preventDefault();

            $("#joinGame").click();
        }
    });
    
    $("#chat").keypress(function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            game.chat($("#chat").val());
            $("#chat").val('');
        }
    });
    
    $(".start").live('click', function() {
       game.start(); 
    });
    
    $(".done").live('click', function() {
       window.location.href="/game";
    });

    $(".dismiss").live("click", function() {
        $(".overlay").hide();
        $(".modal").hide();
    });

    $(".help").live('click', function() {
        $(".overlay").show();
        $(".help-overlay").show();
    });

    function showGame() {
        util.templates.get("board", function(template) {
            $("#main").empty().html(template({uuid: game.gameId, board: game.state, players: game.players, active: game.active}));
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
