// server.js
var nko = require('nko')('+huZsg3PXM49A7mS');
var express = require('express');
var Handlebars = require('handlebars');


var app = module.exports = express.createServer();

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

require('hbs').handlebars = Handlebars;

require("./routes")(app);
require("./socket")(app);

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
    if (typeof elseFn === 'function') {
        return elseFn();
    }
  }
});
Handlebars.registerHelper("inc", function(val, fn, elseFn) {
    return val + 1;
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
