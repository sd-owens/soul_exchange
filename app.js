//========================================================
//Soul Exchange(tm) - app.js
//CS 340: Project:
//Steve Owens & Chris Douglass
//entry point into the application
//========================================================

//RESTFUL ROUTE EXAMPLES
//name      url         verb        desc
//============================================================
//INDEX     /dogs       GET         Display a list of all dogs
//NEW       /dogs/new   GET         Displays form to create new dog
//CREATE    /dogs       POST        Adds a new dog to the database
//SHOW      /dogs/:id   GET         Shows info about one dog
//EDIT      /dogs/:id/edit  GET     Show edit form for one dog
//UPDATE    /dogs/:id   PUT         Update particular dog, then redirect somewhere
//DESTROY   /dogs/:id   DELETE      remove one dog

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

//OLD ROUTES
var authRoutes = require("./routes/auths");
var indexRoutes = require("./routes/index");
var listingRoutes = require("./routes/listings");

app.use(authRoutes);
app.use(indexRoutes);
app.use(listingRoutes);

//==============
//  BID ROUTES
//==============
app.post("/listings", function(req, res){
    //add bid to listing
    //redirect 
    res.redirect('/listings/:id');
});


//=============
//  MANAGE
//=============

app.get("/manage", function(req, res){
    console.log(res.locals.currentUser);
     mysql.pool.getConnection(function (err, connection){
    sql = "SELECT * FROM souls INNER JOIN users on souls.owner_id = users.id WHERE users.username ='" + res.locals.currentUser.username +"'" ;
    console.log(sql);
    connection.query(sql, function(err, result){
        connection.release();
        if(err){
            throw err;
        } else {
            var obj = result;
            console.log(obj);
            res.render('manage', {obj: obj});
        }
    });
    console.log("connected");
    
  });
});

app.get("/manage/new", function(req, res){
    res.render("rank");

});

app.post("/manage", function(req, res){
    console.log(res.locals.currentUser);
    mysql.pool.getConnection(function (err, connection){
        console.log(req.body);
        sql = "SELECT id FROM users where username = "+ "'" + res.locals.currentUser.username + "'";
        console.log(sql);
        connection.query(sql, function(err, result){
            if(err){
                throw err;
            } else {
                var obj = result;
                sql = "UPDATE souls SET soul_score = 7 WHERE soul_id = '" + obj[0].id +"'";
                connection.query(sql, function(err, result){
                    connection.release();
                    if(err){
                        throw err;
                    }
                });
            }
        });    
    });
    res.redirect("/manage");
});

app.listen(3000, function(){
    console.log("server running");
});