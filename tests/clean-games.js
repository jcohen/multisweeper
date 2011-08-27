var client = require("redis").createClient();

client.del("games", function(err, data) {
   console.log("err: " + err);
   console.log("data: " + data);
});