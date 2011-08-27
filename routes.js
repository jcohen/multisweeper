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
};