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

//=============
//  MANAGE
//=============

//=============================================================================================
//  Loads the page that lists all the souls of the owner and allows them to interact with them.
//=============================================================================================
router.get("/manage", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
    let sql = 'SELECT * FROM souls s \
                JOIN users u ON s.owner_id = u.user_id \
                LEFT JOIN listings l ON l.seller_id = u.user_id \
                WHERE u.user_name =?'; 
    let sqlTxn = 'SELECT * FROM listings l \
                JOIN listing_details ld on l.listing_id = ld.listing_id \
                JOIN souls s on s.soul_id = ld.soul_id \
                WHERE l.end_datetime < NOW() \
                AND ld.high_bidder = ? \
                AND NOT l.archived';
    let sqlListings = 'SELECT *, unix_timestamp(end_datetime) * 1000 endUTX \
                FROM listings l \
                JOIN listing_details ld on l.listing_id = ld.listing_id \
                JOIN souls s on s.soul_id = ld.soul_id \
                WHERE l.seller_id = ? AND NOT l.archived';
    try {
        let rows = await pool.query(sql, [res.locals.currentUser.name]);
        let txns = await pool.query(sqlTxn, [res.locals.currentUser.id]);
        let lst = await pool.query(sqlListings, [res.locals.currentUser.id]);
        console.log(txns);
        console.log(lst);
        res.render('manage.ejs', {rows: rows, txns: txns, lst: lst});
    } catch {
        console.log(pool.err);
    }
});

//=============================================================================================
//  Render form to rank soul (only accessible by originator, required prior to listing soul)
//=============================================================================================
router.get("/rank/:id", sessionChecker, function(req, res){
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

//=============================================================================================
//  Added funds to a User's wallet and redirects to the Manage page.
//=============================================================================================
router.post("/manage/wallet", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
    console.log(req.body.newFunds);
     try {
        sql1 = "SELECT balance FROM users WHERE user_id = ?";
        var rows = await pool.query(sql1, [res.locals.currentUser.id]);
        console.log(rows);
        if(!rows[0].balance){
            var newBalance = parseInt(req.body.newFunds);
        }
        else{
            var newBalance = rows[0].balance + parseInt(req.body.newFunds);    
        }
        console.log(newBalance);
        sql2 = "UPDATE users SET balance = ? WHERE user_id = ?";
        await pool.query(sql2, [newBalance, res.locals.currentUser.id]);
        res.redirect("/manage");
    } catch {
        console.log(pool.err);
    }
});

//=============================================================================================
//  GET form to add funds to wallet
//=============================================================================================
router.get("/wallet", sessionChecker, function(req, res){
    res.render("addFunds.ejs");
});


//====================
//Listing routes
//====================

// INDEX ROUTE (RETURNS THE LIST OF CURRENT LISTINGS)
router.get("/index", async function(req, res){
    try {
        //get active soul listings
        sql = 'SELECT * FROM listings l \
               JOIN listing_details ld on ld.listing_id = l.listing_id \
               JOIN souls s ON s.soul_id = ld.soul_id WHERE l.start_datetime < NOW() AND l.end_datetime > NOW() AND NOT l.archived;'
        var rows = await pool.query(sql);
        //console.log(rows);
        res.render('index.ejs', {rows: rows});
    } catch {
        console.log(pool.err);
    };
});

// NEW LISTING ROUTE (DISPLAY FORM TO CREATE A NEW LISTING) <--- (:ID here is soul to be listed, NOT listing_id since it does not exist yet)
router.get("/index/:id/new", sessionChecker, async function(req, res){
    try {
        // pre-populate form to add new listing with soul_name and owner_name;
        let sql = 'SELECT * FROM souls JOIN users ON souls.owner_id = users.user_id WHERE soul_id =?';
        let data = await pool.query(sql, req.params.id);
        // console.log(data);
        res.render("newListing.ejs", {data: data});
    } catch {
        console.log(pool.err);
    };
});

// CREATE LISTING ROUTE (ADDS A NEW LISTING TO THE DATABASE)
router.post("/index", sessionChecker, async function(req, res){
    console.log(req.body);
    var description = req.body.description;
    var min_bid = req.body.min_bid;
    var soul_id = req.body.soul_id;
    var seller_id = req.body.owner_id;
    var start_datetime = req.body.start_date + " " + req.body.start_time + ":00";
    var end_datetime = req.body.end_date + " " + req.body.end_time + ":00";

    try {
    // Add new columns into listings table
        var sql1 = "INSERT INTO listings (seller_id, start_datetime, end_datetime) VALUES(?, ?, ?)";
        await pool.query(sql1, [seller_id, start_datetime, end_datetime]);

    // Return new listing_id from insertion.
        var sql2 = 'SELECT listing_id FROM listings WHERE seller_id =?'
        var rows = await pool.query(sql2, [seller_id]);
        var listing_id = rows[rows.length - 1].listing_id;

    //Update listing_detail to update many-to-many relationship.
        var sql3 = 'INSERT INTO listing_details (listing_id, soul_id, min_bid, description) VALUES(?, ?, ?, ?)';
        await pool.query(sql3, [listing_id, soul_id, min_bid, description]);
        res.redirect("/index");
    } catch {
        console.log(pool.err);
    } 
});

// SHOW LISTING ROUTE (SHOW INFORMATION ABOUT ONE LISTING ???)
router.get("/index/:id", async function(req, res){
    try {
        var listing = req.params.id;
        //get active soul listings
        var sql = 'SELECT * FROM listings INNER JOIN listing_details l_d on l_d.listing_id = listings.listing_id INNER JOIN souls on souls.soul_id = l_d.soul_id WHERE listings.listing_id = ? AND listings.start_datetime < NOW() and listings.end_datetime > NOW() AND NOT listings.archived;'
        console.log("LISTING_ID = " + listing);
        var rows = await pool.query(sql, [listing]);
        console.log(rows);
        if(rows.length > 0){
            res.render('show.ejs', {rows: rows});    
        }
        res.redirect('/index');
    } catch {
        console.log(pool.err);
    }
});

// EDIT LISTING ROUTE (GETS FORM TO EDIT EXISTING LISTING) <--- (:ID here is the listing_id from the listings table)
router.get("/index/:id/edit", sessionChecker, async function(req, res){

    try {
        //pre-populate form with existing listing data from database
        let sql = 'SELECT s.soul_name, u.first_name, u.last_name, \
        DATE_FORMAT(l.start_datetime, "%Y-%m-%d") AS start_date, \
        TIME(l.start_datetime) AS start_time, \
        DATE_FORMAT(l.end_datetime, "%Y-%m-%d") AS end_date, \
        TIME(l.end_datetime) AS end_time, \
        ld.min_bid, ld.description, s.soul_id, s.owner_id, s.avatar, ld.listing_id FROM listings l \
        JOIN listing_details ld ON l.listing_id = ld.listing_id \
        JOIN souls s ON s.soul_id = ld.soul_id \
        JOIN users u ON u.user_id = l.seller_id \
        WHERE ld.soul_id =?;';

        let data = await pool.query(sql, req.params.id);
        //console.log(data);
        res.render("editListing.ejs", {data: data});

    } catch {

        console.log(pool.err);
    }  
});

// UPDATE LISTING ROUTE (POSTS UPDATED LISTING INFORMATINO TO THE DB) (:ID here is the listing_id from listings table)

/* TODO
(node:73817) UnhandledPromiseRejectionWarning: Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client 
(node:73817) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). (rejection id: 1) */

router.put("/index/:id", sessionChecker, async function(req, res){

    var description = req.body.description;
    var min_bid = req.body.min_bid;
    var start_datetime = req.body.start_date + " " + req.body.start_time;
    var end_datetime = req.body.end_date + " " + req.body.end_time;

    try {

        // Update exiting columns in listings table
        var sql1 = 'UPDATE listings SET start_datetime =?, end_datetime =? WHERE listing_id =?'
        await pool.query(sql1, [start_datetime, end_datetime, req.params.id]);
    
        // Update existing columsn in listing_details table
        var sql2 = 'UPDATE listing_details SET min_bid =?, description =? WHERE listing_id =?'
        await pool.query(sql2, [min_bid, description, req.params.id]);
        var id = req.params.id;
        res.redirect("/index/"+id, );
    
        } catch {
    
            console.log(pool.err);
        }


});  //in form action ends with "?_method=PUT" and method="POST"

// DESTROY LISTING ROUTE <--- (:ID here is the listing_id form listings table)
router.delete("/index/:id", sessionChecker, async function(req, res){

    try {

        // Must delete from intersection table LISTING_DETAILS first due to FK constraints.
        var sql1 = 'DELETE FROM listing_details WHERE listing_id =?';
        console.log(req.params.id);
        await pool.query(sql1, [req.params.id]);
    
        // Delete from LISTINGS table once above promise returns 
        var sql2 = 'DELETE FROM listings WHERE listing_id =?';
        await pool.query(sql2, [req.params.id]);
        
        res.redirect("/index");
    
        } catch {
    
            console.log(pool.err);
        }


})  //in form action ends with "?_method=DELETE" and method="POST"


//==============
//  BID ROUTES
//==============
router.put("/index/:id/bid", sessionChecker, async function(req, res){
    try {
        // get the current high bid
        sql1 = 'SELECT curr_bid FROM listing_details WHERE listing_id = ?';
        rows = await pool.query(sql1, [req.params.id]);
        console.log(rows);
        // update curr_bid and high_bidder when a logged in user places a bid.
        var curr_bid = req.body.bid;
        var high_bidder = req.session.user.id;
        var listing_id = req.params.id; 
        console.log(curr_bid, rows[0].curr_bid);
        if(curr_bid > rows[0].curr_bid){
            sql2 = 'UPDATE listing_details SET curr_bid = ?, high_bidder = ? WHERE listing_id = ?';
            //console.log(curr_bid, high_bidder, listing_id);
            await pool.query(sql2, [curr_bid, high_bidder, listing_id]);    
            }
        res.redirect("/index/"+listing_id);
    } catch {
        console.log(pool.err);
    }
});

//=================================================
// REVOKE ROUTE - Cancel a past-due auction listing
//=================================================
router.post("/revoke/:id", sessionChecker, async function(req, res){
    try {
        sql1 = 'UPDATE listing_details SET curr_bid = 0, high_bidder = NULL WHERE listing_id = ?';
        sql2 = 'UPDATE listings SET archived = 1 WHERE listing_id = ?';
        await pool.query(sql1, [req.params.id]);
        await pool.query(sql2, [req.params.id]);
        res.redirect("/manage");
    } catch {
        console.log(pool.err);
    }
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