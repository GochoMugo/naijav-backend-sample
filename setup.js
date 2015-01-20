// This should be run the first time to setup
var debug = require("debug")("naijav-backend-sample:setup");
var mysql = require("mysql");
var util = require("util");


// Reading configuration values
var mysqlVars = {
  host: "localhost",
  user: "root",
  password: "",
  database: "naijav_sample"
};
try {
  var config = require("./config.json");
  mysqlVars = config.mysql;
} catch(err) {}


// Creating a connection
var connection = mysql.createConnection({
  host: mysqlVars.host,
  user: mysqlVars.user,
  password: mysqlVars.password
});


// Actually connecting to database
connection.connect();


// Creating Database if is not created yet
connection.query("CREATE DATABASE IF NOT EXISTS " + mysqlVars.database, function(err) {
  if (err) { return debug("error creating database: %j", err); }
  return debug("connected to database server");
});


// Changing to our database
connection.query("USE " + mysqlVars.database, function(err) {
  if (err) { return debug("error changing to database: %j", err); }
  return debug("changed database");
});


// Creating necessary tables
var tables = {
  "members": "email text, password text, email_updates bool"
};
for (var table in tables) {
  var sqlStr = util.format("CREATE TABLE IF NOT EXISTS %s (%s)", table, tables[table]);
  connection.query(sqlStr, function(err) {
    if (err) { return debug("creating table failed: %j",  err); }
  });
}


// Exit clean-up
connection.end();
