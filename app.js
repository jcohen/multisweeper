// server.js
var nko = require('nko')('+huZsg3PXM49A7mS');
var MineSweeper = require('./mine').MineSweeper;
var express = require('express');

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
        board: mine.state()
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
        board: mine.state()
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

var players = [];

io.sockets.on("connection", function (socket) {
  socket.emit("connected", { "players" : players });

  socket.on("register", function(data) {
      players.push(data);
      io.sockets.emit("newPlayer", data);
  });

  socket.on("turn", function (data) {
    console.log(data);
    io.sockets.emit("moveMade", data);
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
