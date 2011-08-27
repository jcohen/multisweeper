module.exports = function(app) {
    app.get('/', function(req, res){
        res.render('index', {
            title: 'Multisweeper'
        });
    });

    app.get('/board', function(req, res) {
        var boardId = req.param('id');
        if (boardId !== undefined) {
            console.log("Request for board:" + boardId);
            client.get(boardId, function(err, replies) {
                if (err) {
                    console.log("Error fetching board:" + boardId);
                }
                var mine = new MineSweeper(replies);
                mine.display();
                var a = mine.random(10);
                var b = mine.random(10);
                console.log("New click on ["+a+","+b+"]")
                mine.revealTile(a,b);
                mine.display();
                res.render('board', {
                    title: 'Board',
                    message: 'Simulated click on: ['+a+','+b+']',
                    board: mine.state(),
                    uuid: mine.uuid
                });
            });
        } else {
            var mine = new MineSweeper();
            console.log("Clicking 5,5");
            mine.revealTile(5,5);
            mine.display();
            client.set(mine.uuid, JSON.stringify(mine), function(err, replies) {
                if (err) {
                    console.log("Error saving new")
                }
                console.log("Stored board:" + mine.uuid);
                console.log(replies);

                res.render('board', {
                    title: 'Board',
                    message: 'Assuming you clicked 5,5 on this newly generated board: <a href="/board?id=' + mine.uuid + '">' + mine.uuid + '</a>',
                    board: mine.state(),
                    uuid: mine.uuid
                });
            });
        }
    });

    app.get("/game", function(req, res) {
        res.render("game", {
            "title" : "Multisweeper"
        });
    });
};