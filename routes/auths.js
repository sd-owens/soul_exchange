var express = require("express");
var router = express.Router();
var mysql = require('../dbcon.js');

// AUTH ROUTES

//show register form
router.get("/register", function(req, res){
    res.render("register");
})

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password,function(err, user){
        if(err){
            console.log(err);
            return res.render("register")
        }
        mysql.pool.getConnection(function (err, connection){
            sql = 'INSERT INTO users (user_name, first_name, last_name, password) VALUES (?,?,?,?)'
            const newUser = await connection.query(sql, [username, firstname, lastname, password]); 
            sql = 'SELECT * FROM users WHERE user_name = ?'
            const userRecord = await connection.query(sql, [username]);
            var obj = result;



        //     connection.query(sql, , function(err, result, fields){
        //     if(err){
        //         throw err;
        //     } else {
        //         sql = 'INSERT INTO souls () VALUES()'
        //         connection.query(sql, [username, firstname, lastname, password], function(err, result, fields){
        //         if(err){
        //             throw err;
        //         } else {
        //             var obj = result;
        //             console.log(obj);
        //             req.session.loggedin = true;
        //             req.session.username = username;
        //             res.redirect("/");
        //         }
        });
    });
});

//show login form
router.get("/login", function(req, res){
    res.render("login");
})

//handle login logic
router.post("/login", passport.authenticate("local", 
            {
                successRedirect: "/", 
                failureRedirect: "/login"
            }), function(req, res){
});

//logout route
router.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;