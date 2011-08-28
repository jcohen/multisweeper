(function() {
    if (navigator.userAgent.match(/.*Chrome\/14.*/)) {
        var util = multisweeper.Utils;

        util.showModal("Uh oh!", "Unfortunately the latest Chrome beta doesn't work that well with Multisweeper. Please use the Chrome Stable Channel, Safari or Firefox for the optimal experience!");
    }

    $(".dismiss").live("click", function() {
        $(".overlay").hide();
        $(".modal").hide();
    });
})();