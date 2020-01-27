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

//==================================================================
//NEW ROUTES FOR TESTING MYSQL AUTHENTICATION
//==================================================================
//RESTFUL ROUTES
//name      url         verb        desc
//============================================================
//INDEX     /dogs       GET         Display a list of all dogs
//NEW       /dogs/new   GET         Displays form to create new dog
//CREATE    /dogs       POST        Adds a new dog to the database
//SHOW      /dogs/:id   GET         Shows info about one dog
//EDIT      /dogs/:id/edit  GET     Show edit form for one dog
//UPDATE    /dogs/:id   PUT         Update particular dog, then redirect somewhere
//DESTROY   /dogs/:id   DELETE      remove one dog


app.get('/register', function(req, res){
    res.render('register.ejs');
});


//==================================================================
//Register new users- built with asyn, await.  
//==================================================================

app.post('/register', async function(req, res){
    try{
        //insert new user into users table
        var new_user = [req.body.user_name, req.body.first_name, req.body.last_name, req.body.password];
        var sql = 'INSERT INTO users (user_name, first_name, last_name, password) VALUES (?,?,?,?)';
        await pool.query(sql, new_user);
    } catch {
        console.log(pool.err);
    } 
    try {
        //get the new user_id from the users table
        sql = 'SELECT user_id, user_name FROM users WHERE user_name = ?';
        var rows = await pool.query(sql, req.body.user_name);
    } catch {
        console.log(pool.err)
    };
    try {
        //insert a new soul into the souls table and associate it with the new user. (note, might need a ginger-conditional)
        soul_name = req.body.first_name + " " + req.body.last_name;
        user_id = rows[0].user_id;
        user_name = rows[0].user_name;
        sql = 'INSERT INTO souls (originator_id, owner_id, soul_name) VALUES (?,?,?)';
        await pool.query(sql, [user_id, user_id, soul_name]);
    } catch {
        console.log(pool.err);
    };
    try {
        //create a session and redirect
        var sess                = req.session;      //initialize session variable
        req.session.user_id     = user_id;          //set user id
        req.session.user_name   = user_name;        //set user name
        res.redirect('/dbtest');
    } catch {
        console.log(pool.err);
    };
});

//show login form
app.get("/login", function(req, res){
    res.render("login.ejs");
})


//handle login logic
app.post("/login", async function(req, res){
    var user_name = req.body.user_name;
    var password = req.body.password;
    console.log("user: " + user_name + " password " + password);
    sql = 'SELECT user_name, user_id, password from users WHERE user_name = ?';
    try{
        //get record of user with user_name, create their session, and redirect them
        var rows = await pool.query(sql, user_name);
        // console.log(rows);
        // console.log("len test:" + rows.length);
        // console.log(rows[0].password == password);
        // make sure it returns a result
        if(rows.length > 0){
            //make sure the password matches (TODO - figure out how to implement bcrypt and don't store plaintext passwords)
            if(rows[0].password == password){
                //console.log("passed tests");
                if(sessionData){                            //destroy any existing session before creating a new one
                    sessionData.destroy();
                }
                var sessionData         = req.session;      //initialize session variable
                sessionData.user = {"id": rows[0].user_id,
                                    "name": rows[0].user_name
                                    };     
                //console.log(sessionData);
                res.redirect('/dbtest');
            }
            else {
                res.send({
                    "code":204,"success":"User name and password do not match"});
            }
        } else {
            res.send({"code":204,"success":"Email does not exist"});    
        }
    } catch {
        console.log(pool.err);
        res.send({"code":400,"failed":"error ocurred in catch"});
    }
});

//logout route - destroys the session
app.get("/logout", function(req, res){
    var sessionData = req.session;
    sessionData.destroy(function(err) {
        if(err){
            msg = 'Error destroying session';
        }else{
            msg = 'Session destroy successfully';
            console.log(msg)
        }
    });
    res.redirect("/login");
});

//ASYNC AWAIT EXAMPLE WORKING WITH DB
app.get('/dbtest', sessionChecker, async function(req, res){

    try{
        //console.log(req.session);
        var sql = 'SELECT * FROM users where user_id = ?';
        curr_user = req.session.user;
        //console.log("Current User ID: " + curr_user);
        var rows = await pool.query(sql, [curr_user.id]);
        //console.log({rows});
        res.render('test.ejs', {rows});
    } catch(err) {
       console.log(err);
    }
    try {

    } catch {
        
    };

});

//middleware to check for a session
function sessionChecker(req, res, next){
    if (req.session.user) {
        next();
    } else {
    res.redirect('/login');
    }    
};

app.listen(3000, function(){
    console.log("server running");
});