// server.js
var nko = require('nko')('+huZsg3PXM49A7mS');
var MineSweeper = require('./mine').MineSweeper;
var express = require('express');
var Handlebars = require('handlebars');

var redis = require("redis"),
    client = redis.createClient();

client.on("error", function (err) {
  console.log("Redis Error " + err);
});

var app = module.exports = express.createServer();

var io = require("socket.io").listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

require('hbs').handlebars = require("handlebars");

// Routes

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

// Socket.io

var games = {};

io.sockets.on("connection", function (socket) {
  socket.on("join", function(data) {
      var gameId = "some-game-id"; // TODO: find a game waiting for more players or create a new one

      var game = games[gameId];
      if (!game) {
          game = games[gameId] = {
              "id" : gameId,
              "players" : []
          };
      }

      game.players.push(data);

      console.log("players: ", game.players);

      socket.join(game.id);
      socket.emit("game-assignment", {
          "gameId" : game.id,
          "players" : game.players
      });

      socket.broadcast.to(game.id).emit("new-player", data);
  });

  socket.on("turn", function handleTurn(data) {
      console.log("games: %j", games);
      var game = games[data.game];

      if (!game) {
          console.log("Unknown game: %s", data.game);
          // TODO: message to user
          return;
      }

      console.log("handling turn in game %s with data: %j", game.id, data);

      socket.broadcast.to(game.id).emit("move-made", data);
  });
  
  socket.on("reveal", function(data) {
    console.log(data);
    client.get(data.id, function(err, replies) {
      if (err) {
        console.log("Error fetching board:" + data.id);
      }
      var mine = new MineSweeper(replies);
      mine.revealTile(data.x,data.y);
      client.set(mine.uuid, JSON.stringify(mine), function(err, replies) {
        if (err) {
          console.log("Error saving new")
        }
        io.sockets.emit("revealed", mine.state());
      });
    });
  });
});

//WTB: each_with_index
Handlebars.registerHelper("index", function(array, fn, elseFn) {
  if (array && array.length > 0) {
    var buffer = "";
    for (var i = 0, j = array.length; i < j; i++) {
      var item = array[i];
      if (typeof item === 'object') {
        item.idx = i;
        buffer += fn(item);
      } else {
        buffer += fn({"item": item, idx: i});
      }
    }
 
    return buffer;
  }
  else {
    return elseFn();
  }
});



// Listen

app.listen(process.env.NODE_ENV === 'production' ? 80 : 8000, function() {
  console.log('Ready');

  // if run as root, downgrade to the owner of this file
  if (process.getuid() === 0)
    require('fs').stat(__filename, function(err, stats) {
      if (err) return console.log(err)
      process.setuid(stats.uid);
    });
});
