// server.js
var nko = require('nko')('+huZsg3PXM49A7mS');
var MineSweeper = require('./mine').MineSweeper;
var express = require('express');

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
  var mine = new MineSweeper();
  mine.display();
  console.log("Clicking 5,5");
  mine.revealTile(5,5);
  mine.display();
  res.render('board', {
    title: 'Board',
    board: mine.state()
  });
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
