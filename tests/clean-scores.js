var client = require("redis").createClient();

client.del("scores", function(err, data) {
   console.log("err: " + err);
   console.log("data: " + data);
});