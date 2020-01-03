var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var mysql = require('../dbcon.js');
var bodyParser = require("body-parser");



//=====================
//index routes
//=====================

router.get("/", function(req, res){
    mysql.pool.getConnection(function (err, connection){
    sql = "SELECT * FROM soul_listings LEFT JOIN souls on soul_listings.soul_id = souls.soul_id WHERE endDatetime > NOW() ORDER BY endDatetime ASC";
    connection.query(sql, function(err, result){
        connection.release();
        if(err){
            throw err;
        } else {
            var obj = result;
            //console.log(obj);
            res.render('index.ejs', {obj: obj});
        }
    });
    console.log("connected");
    
  });
});

// router.get("/carousel", function(req, res){
//     pool.getConnection(function (err, connection){
//     sql = "SELECT * FROM soul_listings LEFT JOIN souls on soul_listings.soul_id = souls.soul_id WHERE endDatetime > NOW() ORDER BY endDatetime ASC";
//     connection.query(sql, function(err, result){
//         connection.release();
//         if(err){
//             throw err;
//         } else {
//             var obj = result;
//             //console.log(obj);
//             res.render('carousel.ejs', {obj: obj});
//         }
//     });
//     console.log("connected");
    
//   });
// });

router.get("/about", function(req, res){
    res.render("about");
})

router.get("/contact", function(req, res){
    res.render("contact");
})

router.get("/feature" ,function(req, res){
    res.render("feature");
})

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;