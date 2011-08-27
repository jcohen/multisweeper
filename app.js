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
