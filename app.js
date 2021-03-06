//========================================================
//Soul Exchange(tm) - app.js
//CS 340: Project:
//Steve Owens & Chris Douglass
//entry point into the application
//========================================================

var bodyParser      = require('body-parser'),
//    dotenv          = require('dotenv'),
    express         = require('express'),
    methodOverride  = require("method-override"),
    mysql           = require('mysql'),
    //flash           = require('connect-flash'),
    path            = require('path'),
    pool            = require('./db'),
    session         = require('express-session'),
    util            = require('util'),
    helmet          = require('helmet'),
    app             = express();


app.use(
    session(
        {
        secret: '@2f6d4hNF.;LjyE=',
        resave: true,
        saveUninitialized: true,
        cookie: { maxAge: 3600000}
        })
    );

//app.use(flash);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));


app.set("view engine", "ejs");

// middleware to make 'user' available to all templates
app.use(function(req, res, next) {
  res.locals.currentUser = req.session.user;
  //res.locals.error = req.flash('error');
  //res.locals.success = req.flash('success');
  next();
});

var authRoutes = require("./routes/auths");
var indexRoutes = require("./routes/index");

app.use(authRoutes);
app.use(indexRoutes);

app.listen(3000, function(){
    console.log("server running");
})