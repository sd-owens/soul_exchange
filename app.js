//========================================================
//Soul Exchange(tm) - app.js
//CS 340: Project:
//Steve Owens & Chris Douglass
//entry point into the application
//========================================================

var bodyParser      = require('body-parser'),
    express         = require('express'),
    methodOverride  = require("method-override"),
    mysql           = require('mysql'),
    path            = require('path'),
    pool            = require('./db'),
    session         = require('express-session'),
    util            = require('util'),
    app             = express();

app.use(
    session(
        {
        secret: '@2f6d4hNF.;LjyE=',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 60000}
        })
    );

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));

app.set("view engine", "ejs");


// middleware to make 'user' available to all templates
app.use(function(req, res, next) {
  res.locals.currentUser = req.session.user;
  next();
});

var authRoutes = require("./routes/auths");
var indexRoutes = require("./routes/index");
var listingRoutes = require("./routes/listings");

app.use(authRoutes);
app.use(indexRoutes);
app.use(listingRoutes);

app.listen(3000, function(){
    console.log("server running");
});