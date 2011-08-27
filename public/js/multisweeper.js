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
    
    $(".cell").bind('click', function() {
      if (!connected) {
        game.connect();
      }
      id = $(this).parent().parent().data('board-id');
      x = $(this).parent().data('row-id');
      y = $(this).data('col-id')
      console.log("Click:" + x + "," + y);
      game.reveal(id,x,y);
    })
})(window.multisweeper = window.multisweeper || {}, jQuery);