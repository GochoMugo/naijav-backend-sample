// A sample backend for naijav

// Node.js modules
var http = require("http");
var util = require("util");

// Npm modules
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
var debug = require("debug")("naijav-backend-sample:index");
var express = require("express");
var mysql = require("mysql");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

// own modules
var utils = require("./utils");

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
config.mysql.database = userConfig.mysql.database || "test";

//  Creating a mysql connection
debug("connecting to mysql server");
var connection = mysql.createConnection(config.mysql);
connection.connect(function(err) {
  if (err) { return debug("error connecting to mysql: %s", err.code); }
});

// Adding Body-Parsing Middleware using both json & urlencoded
debug("configuring body-parser middleware");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Adding Passport Initialization middleware
debug("configuring passport middleware");
app.use(passport.initialize());

// passport local stratgey
passport.use(new LocalStrategy(
  function(username, password, done) {
    return done(null, {name: "gocho"});
  }
));

// Allowing CORS
app.use(function(req, res, next) {
  debug("hit: %s", req.path);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Member count
app.get("/members/count", function(req, res) {
  var sqlStr = util.format(utils.sqlStr["membersCount"]);
  connection.query(sqlStr, function(err, result) {
    if (err) {
      debug("getting members count failed: %j", err);
      return res.status(500).json({message: "our bad!"});
    }
    res.json({count: result[0]["count(*)"]});
  });
});

// Member signup
app.post("/members/signup", function(req, res) {
  // Ensuring all values required have been passed
  debug(req.param("username"))
  var missingParam = utils.checkParams(req, ["username", "email", "password"]);
  if (missingParam) {
    return res.status(400).json({
      message: "missing parameter",
      param: missingParam
    });
  }
  // Hashing password
  bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(req.param("password"), salt, function(err, hash) {
          if (err) {
            debug("hashing password failed: %j", err);
            return res.status(500).json({message: "server goofed up!"});
          }
          // we now store user details into database
          var sqlStr = util.format(utils.sqlStr["insertMember"], req.param("username"),
            req.param("email"), hash);
          connection.query(sqlStr, function(err) {
            if (err) {
              debug("error storing user details into db: %j", err);
              if (err.code === "ER_DUP_ENTRY") {
                return res.status(400).json({message: "user already exists!"});
              }
              return res.status(500).json({message: "server goofed up!"});
            } // if (err)
            return res.json({message: "user created"});
          }); // connection.query
      }); // bcrypt.hash
  }); // bcrypt.genSalt
});

// Member login
app.post("/members/login",
  passport.authenticate('local', { session: true }),
  function(req, res) {
    res.json(req.user);
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
