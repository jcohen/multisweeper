var RedisGameClient = require("./redis-game-client");

module.exports = function(app) {
    app.get('/', function(req, res){
        res.render('index', {
            title: 'Multisweeper'
        });
    });

    app.get("/game", function(req, res) {
        res.render("game", {
            "title" : "Multisweeper"
        });
    });
    
    app.get("/scores", function(req, res) {
        var gameClient = new RedisGameClient();
        gameClient.loadScores(function (err, data) {
            if (err) {
                console.log("Error loading scores");
            }
            console.log(data);
            var results = []
            for (var i=0;i<data.length;i+=2) {
                results.push({'name': data[i], 'score': data[i+1]});
            }
            res.render("scores", {'scores': results});
        });
    });
    
    app.get("/nom", function(req, res) {
       res.cookie('bacon', 'nomnom');
       res.end('OK\n');
    });
};