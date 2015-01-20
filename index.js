// A sample backend for naijav

// Node.js modules
var https = require("http");

// Npm modules
var debug = require("debug");
var express = require("express");

// Script variables
var app = express();
var server = http.Server(app);
var port = 8090;

// Starting server
server.listen(port, function() {
  debug("server started");
});
