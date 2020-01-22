var express         = require("express"),
    app             = express(),
    mysql           = require('./dbcon.js'),
    bodyParser      = require("body-parser"),
    methodOverride  = require("method-override"),
    mongoose        = require("mongoose"), 
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require("./models/user"); 

app.use(express.static(__dirname + '/public'));

var authRoutes = require("./routes/auths");
var indexRoutes = require("./routes/index");
var listingRoutes = require("./routes/listings");
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));

mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb://localhost/login_test", { useNewUrlParser: true });

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "this is a string",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware to put current user info on all routes.
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

app.use(authRoutes);
app.use(indexRoutes);
app.use(listingRoutes);

//==============
//  BID ROUTES
//==============
app.post("/listings", isLoggedIn, function(req, res){
    //add bid to listing
    //redirect 
    res.redirect('/listings/:id');
});


//=============
//  MANAGE
//=============

app.get("/manage", isLoggedIn, function(req, res){
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

app.get("/manage/new", isLoggedIn, function(req, res){
    res.render("rank");

});

app.post("/manage", isLoggedIn, function(req, res){
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

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000, function(){
    console.log("server running");
})