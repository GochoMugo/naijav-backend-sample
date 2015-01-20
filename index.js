// A sample backend for naijav

// Node.js modules
var http = require("http");
var util = require("util");

// Npm modules
var bodyParser = require("body-parser");
var bcrypt = require("bcrypt");
var cookieParser = require("cookie-parser");
var debug = require("debug")("naijav-backend-sample:index");
var express = require("express");
var expressSession = require("express-session");
var mysql = require("mysql");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

// own modules
var utils = require("./utils");

// Script variables
var app = express();
var server = http.Server(app);
var port = 8090;
var appSecret = 'FlAtUi*iS!AlL?';

// Getting configuration files from config.json
var userConfig;
try {
  userConfig = require("./config.json");
} catch (err) {
  userConfig = { msql: { } };
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

// Cookie parsing
debug("configuring cookie parser middleware");
app.use(cookieParser(appSecret));

// Enabling sessions (Express comes before Passport)
app.use(expressSession({
  secret: appSecret,
  resave: false,
  saveUninitialized: true
}));

// Adding Passport Initialization middleware (Must come after express session middleware)
debug("configuring passport middleware");
app.use(passport.initialize());

// Enabling passport sessions
debug("configuring passport session middleware");
app.use(passport.session());

// Serializing and Deseralizing passport functions
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  var sqlStr = util.format(utils.sqlStr["lookupMemberId"], id);
  connection.query(sqlStr, function(err, resultSet) {
    if (err) {
      debug("error deserializing user: %j", err);
      return done(err);
    }
    return done(null, resultSet[0]);
  });
});

// passport local stratgey
passport.use(new LocalStrategy(
  function(username, password, done) {
    var sqlStr = util.format(utils.sqlStr["lookupMember"], username);
    connection.query(sqlStr, function(err, resultSet) {
      if (err) {
        debug("error looking up member: %j", err);
        return done(err);
      }
      if (! resultSet[0]) { return done(null, false); }
      bcrypt.compare(password, resultSet[0]["password"], function(err, res) {
          if (err) {
            debug("error comparing password and hash: %j", err);
            return done(err);
          }
          if (! res) { return done(null, false); }
          return done(null, resultSet[0]);
      });
    });
  }
));

// Allowing CORS
app.use(function(req, res, next) {
  debug("hit: %s", req.path);
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", "http://localhost:4000");
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
    res.json({
      email_updates: req.user["email_updates"]
    });
});

// Retrieving User data
app.get("/members/settings",
  utils.ensureLoggedInFailFast,
  function(req, res) {
    res.json({
      email_updates: req.user["email_updates"]
    });
});

// Saving user data
app.post("/members/settings",
  utils.ensureLoggedInFailFast,
  function(req, res) {
    // for now we shall require all settings be passed along with request
    var missingParam = utils.checkParams(req, ["email_updates"]);
    if (missingParam) {
      return res.status(400).json({message: "missing parameter", param: missingParam});
    }
    var sqlStr = util.format(utils.sqlStr["storeSettings"], req.param("email_updates"), req.user.id);
    connection.query(sqlStr, function(err) {
      if (err) {
        debug("error storing settings: %j", err);
        return res.status(500).json({message: "server goofed up!"});
      }
      return res.json({message: "settings saved!"});
    });
});

// Getting feedback
app.post("/members/feedback",
  utils.ensureLoggedInFailFast,
  function(req, res) {
    var missingParam = utils.checkParams(req, ["feedback"]);
    if (missingParam) {
      return res.status(400).json({message: "missing parameter", param: missingParam});
    }
    var sqlStr = util.format(utils.sqlStr["storeFeedback"], req.user.id, req.param("feedback"));
    connection.query(sqlStr, function(err) {
      if (err) {
        debug("error storing feedback: %j", err);
        return res.status(500).json({message: "server goofed up!"});
      }
      return res.json({message: "feedback received!"});
    });
  }
);

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
