var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
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
            sql = "INSERT INTO users (username, first_name, last_name, created, modified, balance) VALUES (" + "'" + req.body.username + "'" + ",'" + req.body.first_name + "'" +",'" + req.body.last_name + "'" + ", NOW(), NOW(), 10000 )";
            console.log(sql);
            connection.query(sql, function(err, result){
                if(err){
                    throw err;
                }
                sql = "SELECT id FROM users where username = "+ "'" + req.body.username + "'";
                connection.query(sql, function(err, result){
                    if(err){
                        throw err;
                    } else {
                        var obj = result;
                        console.log(obj);
                        sql = "INSERT INTO souls (soul_id, owner_id, soul_name, soul_score) VALUES (" + obj[0].id + "," + obj[0].id + ",'" + req.body.first_name + " " + req.body.last_name + "'," + 0 +")";
                        console.log(sql);
                        connection.query(sql, function(err, result){
                            connection.release();
                            if(err){
                                throw err;
                            } else {
                                var obj = result;
                                console.log(obj);
                            }
                        });
                    }
                });
            });
        });
        passport.authenticate("local")(req, res, function(){
            res.redirect("/");
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