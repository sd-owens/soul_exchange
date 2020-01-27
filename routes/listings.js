var bodyParser  = require("body-parser"),
    express     = require("express"),
    pool        = require('../db'),
    router      = express.Router();

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

//====================
//Listing routes
//====================

//get the list of listings
router.get("/listings", function(req, res){
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
    });
});

//get form to add a listing
router.get("/listings/new", isLoggedIn, function(req, res){
  //res.render("new.ejs");
});

//create listing
router.post("/listings", isLoggedIn, function(req, res){
    res.send("This will be where to submit new listings");
});

//edit listing
router.get("/listings/:id/edit", isLoggedIn, function(req, res){
    res.send("This will be where you go to edit an existing listing");
});

//UPDATE ROUTE
router.put("/listings/:id", isLoggedIn, function(req, res){
    res.send("This will be where to submit edits to existing listings")
});  //in form action ends with "?_method=PUT" and method="POST"

//DESTROY ROUTE
router.delete("/listings/:id", isLoggedIn, function(req, res){
    res.send("DESTROY ROUTE");
})  //in form action ends with "?_method=DELETE" and method="POST"

//BID ROUTE
router.put("/listings/:id/bid", isLoggedIn, function(req, res){
    res.send("This is a put route for bidding on a listing");
});

//SHOW ROUTE
router.get("/listings/:id", function(req, res){
    var listing = req.params.id
    mysql.pool.getConnection(function (err, connection){
        sql = "SELECT * FROM soul_listings LEFT JOIN souls on soul_listings.soul_id = souls.soul_id WHERE listing_id = " + listing;
        //console.log(sql);
        connection.query(sql, function(err, result){
            connection.release();
            if(err){
                throw err;
            } else {
                var obj = result;
                //console.log(obj);
                res.render('show.ejs', {obj: obj});
            }
        });
    });
});

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

module.exports = router;