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

//=====================
//index routes
//=====================

router.get("/", async function(req, res){
    res.redirect("/index");
});

router.get("/about", function(req, res){
    res.render("about");
})

router.get("/contact", function(req, res){
    res.render("contact");
})

router.get("/feature" ,function(req, res){
    res.render("feature");
})

//==============
//  BID ROUTES
//==============
router.post("/listings", function(req, res){
    //add bid to listing
    //redirect 
    res.redirect('/listings/:id');
});


//=============
//  MANAGE
//=============

//=============================================================================================
//  Loads the page that lists all the souls of the owner and allows them to interact with them.
//=============================================================================================
router.get("/manage", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
    console.log(req.body)
    sql = "SELECT * FROM souls INNER JOIN users on souls.owner_id = users.user_id WHERE users.user_name =?" ; 
    try {
        var rows = await pool.query(sql, [res.locals.currentUser.name]);
        // console.log(rows);
        res.render('manage.ejs', {rows: rows});
    } catch {
        console.log(pool.err);
    }
});

//=============================================================================================
//  Render form to rank soul (only accessible by originator, required prior to listing soul)
//=============================================================================================
router.get("/rank/:id", function(req, res){
    var soul_id = req.params.id
    console.log(soul_id);
    res.render("rank.ejs", {soul_id: soul_id});
});

//=============================================================================================
//  Updates soul ranking of a user and redirects to the manage page.
//=============================================================================================
router.post("/manage", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
     try {
        var rank = Math.max(req.body.mortalSin, req.body.cardinalSin);
        console.log(rank);
        console.log("req.body: " + req.body);
        sql = "UPDATE souls SET soul_score = ? WHERE soul_id = ?";
        await pool.query(sql, [rank, req.body.soul_id]);

        res.redirect("/manage");
    } catch {
        console.log(pool.err);
    }
});

//====================
//Listing routes
//====================

//get the list of listings
router.get("/index", async function(req, res){
    try {
        //get active soul listings
        sql = 'SELECT * FROM listings \
                INNER JOIN listing_details l_d on l_d.listing_id = listings.listing_id \
                INNER JOIN souls on souls.soul_id = l_d.soul_id;'
        var rows = await pool.query(sql);
        console.log(rows);
        res.render('index.ejs', {rows: rows});
    } catch {
        console.log(pool.err);
    };
});



//get form to add a listing
router.get("/index/new", sessionChecker, function(req, res){
  res.render("newListing.ejs");
});

//create listing
router.post("/index", sessionChecker, function(req, res){
    res.send("This will be where to submit new listings");
});

//edit listing
router.get("/index/:id/edit", sessionChecker, function(req, res){
    res.send("This will be where you go to edit an existing listing");
});

//UPDATE ROUTE
router.put("/index/:id", sessionChecker, function(req, res){
    res.send("This will be where to submit edits to existing listings")
});  //in form action ends with "?_method=PUT" and method="POST"

//DESTROY ROUTE
router.delete("/index/:id", sessionChecker, function(req, res){
    res.send("DESTROY ROUTE");
})  //in form action ends with "?_method=DELETE" and method="POST"

//BID ROUTE
router.put("/index/:id/bid", sessionChecker, function(req, res){
    res.send("This is a put route for bidding on a listing");
});

//SHOW ROUTE
router.get("/index/:id", function(req, res){
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

//middleware to check for a session
function sessionChecker(req, res, next){
    if (req.session.user) {
        next();
    } else {
    res.redirect('/login');
    }    
};

module.exports = router;