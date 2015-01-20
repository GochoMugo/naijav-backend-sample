// A sample backend for naijav

// Node.js modules
var http = require("http");

// Npm modules
var debug = require("debug")("naijav-backend-sample:index");
var express = require("express");
var mysql = require("mysql");

// Script variables
var app = express();
var server = http.Server(app);
var port = 8090;

// Getting configuration files from config.json
var userConfig;
try {
  userConfig = require("./config.json");
} catch (err) {
  userConfig = {msql: {}};
}
var config = {};
config.mysql = {};
config.mysql.host = userConfig.mysql.host || "localhost";
config.mysql.user = userConfig.mysql.user || "root";
config.mysql.password = userConfig.mysql.password || "";

//  Creating a mysql connection
var connection = mysql.createConnection(config.mysql);
connection.connect(function(err) {
  if (err) { return debug("error connecting to mysql: %s", err.code); }
});

// Allowing CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Member count
app.get("/members/count", function(req, res) {
  res.send({count: 201});
});


// Starting server
server.listen(port, function() {
  debug("server started at port: %d", port);
});

// Exit cleanup
process.on("exit", function() {
  try {
    connection.end();
  } catch(err) {
    // we cant help here
  }
});
