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

//=============================================================================================
// INDEX ROUTES
//=============================================================================================
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
 
//=============================================================================================
//  MANAGE - lists all the souls of the owner and allows them to interact with them.
//=============================================================================================
router.get("/manage", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
    let sql = 'SELECT *, s.avatar s_avatar FROM souls s \
                JOIN users u ON s.owner_id = u.user_id \
                LEFT JOIN listings l ON l.seller_id = u.user_id \
                WHERE u.user_id =?'; 
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
        let rows = await pool.query(sql, [res.locals.currentUser.id]);
        let txns = await pool.query(sqlTxn, [res.locals.currentUser.id]);
        let lst = await pool.query(sqlListings, [res.locals.currentUser.id]);
        console.log(rows);
        res.render('manage.ejs', {rows: rows, txns: txns, lst: lst});
    } catch {
        console.log(pool.err);
    }
});

//=============================================================================================
//  EDIT ROUTE - Render form to edit user profile (only accessible by originator)
//=============================================================================================
router.get("/manage/:id/edit", sessionChecker, async function(req, res){
    // console.log(res.locals.currentUser);
    
    try {

        let sql = 'SELECT * FROM users WHERE user_id =?';

        let rows = await pool.query(sql, [res.locals.currentUser.id]);
        console.log(JSON.stringify(rows));
        res.render('editProfile', {rows: rows});

    } catch {

        console.log(pool.err);
    }
});

//=============================================================================================
//  UPDATE ROUTE - Updates user profile and redirects to the manage page.
//=============================================================================================

router.put("/manage/:id", sessionChecker, async function(req, res){
    // console.log(res.locals.currentUser);

    var user_name = req.body.user_name;
    var first_name = req.body.first_name;
    var last_name = req.body.last_name;
    var password = req.body.password;
    var avatar = req.body.avatar;
    
    try {

        let sql = 'UPDATE users \
                   SET user_name =?, first_name =?,  last_name =?, password =?, avatar =? \
                   WHERE user_id =?';

        await pool.query(sql, [user_name, first_name, last_name, password, avatar, res.locals.currentUser.id]);
        
        res.redirect('/manage');

    } catch {

        console.log(pool.err);
    }
});

//=============================================================================================
//  EDIT ROUTE - Render form to edit soul (only accessible by soul owner)
//=============================================================================================
router.get("/soul/:id/edit", sessionChecker, async function(req, res){

    var soul_id = req.params.id;
    console.log(soul_id);

    try {

        var sql = 'SELECT s.soul_id, s.soul_name, s.avatar, u.user_name FROM souls s JOIN users u ON u.user_id = s.originator_id WHERE soul_id =?'
        var rows = await pool.query(sql, [soul_id]);

    } catch {

        console.log(pool.error);
    }

    console.log(rows);
    res.render('editSoul.ejs', {rows: rows})
});

//=============================================================================================
//  UPDATE ROUTE SOUL RANK - Updates soul data (only accesible by soul owner)
//=============================================================================================
router.put("/soul/:id", sessionChecker, async function (req, res) {

    var soul_id = req.params.id;
    //console.log(soul_id);
    var soul_name = req.body.soul_name;
    var avatar = req.body.avatar;

    try {

        var sql = 'UPDATE souls \
                   SET soul_name =?, avatar =? \
                   WHERE soul_id =?';

        await pool.query(sql, [soul_name, avatar, soul_id]);

        res.redirect('/manage');

    } catch {

        console.log(pool.err);
    }
    


});

//=============================================================================================
//  EDIT ROUTE - Render form to rank soul (only accessible by originator)
//=============================================================================================
router.get("/rank/:id", sessionChecker, function(req, res){
    var soul_id = req.params.id
    console.log(soul_id);
    res.render("rank.ejs", {soul_id: soul_id});
});

//=============================================================================================
//  UPDATE ROUTE SOUL RANK - Updates soul ranking of a user and redirects to the manage page.
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
//  UPDATE ROUTE - Added funds to a User's wallet and redirects to the Manage page.
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
//  NEW ROUTE - Get form to add funds to wallet
//=============================================================================================
router.get("/wallet", sessionChecker, function(req, res){
    res.render("addFunds.ejs");
});

//=============================================================================================
//  LISTINGS ROUTES (AUCTIONS)
//=============================================================================================

//=============================================================================================
//  INDEX ROUTE - Returns a list of current listings.
//=============================================================================================
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

//=============================================================================================
// NEW LISTING ROUTE - Displays form to create a new listing.
//=============================================================================================
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

//=============================================================================================
//  CREATE LISTING ROUTE - Adds a new listing (auction)
//=============================================================================================
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

//=============================================================================================
//  SHOW LISTING ROUTE - Shows information about all currently active listings.
//=============================================================================================
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

//=============================================================================================
//  EDIT LISTING ROUTE - Renders a form to edit a current listing.
//=============================================================================================
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

//=============================================================================================
//  UPDATE LISTING ROUTE - Updates a specific listing and then redirects to index page.
//=============================================================================================

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

//=============================================================================================
//  DESTROY LISTING ROUTE - deletes a currently active listing.
//=============================================================================================
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


//=============================================================================================
//  BID ROUTES
//=============================================================================================
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

//=============================================================================================
//  PAY ROUTES - Renders a new for payment
//=============================================================================================

router.get("/pay/:id", sessionChecker, async function(req, res){
    try{
        sql = 'SELECT * FROM listings l INNER JOIN listing_details ld on ld.listing_id = l.listing_id INNER JOIN souls s on s.soul_id = ld.soul_id WHERE high_bidder = ? AND l.listing_id = ?';    
        var high_bidder = req.session.user.id;
        var listing_id = req.params.id;
        rows = await pool.query(sql, [high_bidder, listing_id]);
        if(rows.length > 0){
            res.render("pay.ejs", {rows: rows});
        } else {
            res.redirect("/manage");
        }

    } catch {
        console.log(pool.err);
    }
});
//=============================================================================================
//  CREATE ROUTE - for payment
//=============================================================================================
router.post("/pay/:id", sessionChecker, async function(req, res){
    try{
        sql1 = 'SELECT balance FROM users WHERE user_id = ?'; //how much money does the current user have?
        var user_id = req.session.user.id;
        rows = await pool.query(sql1, [user_id]);
        console.log(rows);
        var availableFunds = rows[0].balance;
        sql2 = 'SELECT curr_bid, soul_id FROM listing_details ld WHERE ld.listing_id = ?'; //How much was the winning bid?
        var listing_id = req.params.id;
        rows = await pool.query(sql2, [listing_id]);
        var curr_bid = rows[0].curr_bid;
        var soul_id = rows[0].soul_id;
        if(availableFunds >= curr_bid){     //Has funds to pay for bid
            sql3 = 'SELECT seller_id FROM listings l WHERE l.listing_id = ?'; //get user_id of seller
            rows = await pool.query(sql3, [listing_id]);
            var seller_id = rows[0].seller_id;
            sql4 = 'UPDATE users SET balance = balance + ? WHERE user_id = ?'; //update user record for seller (add funds)
            await pool.query(sql4, [curr_bid, seller_id])
            sql5 = 'UPDATE users SET balance = balance - ? WHERE user_id = ?'; //Remove funds from current user
            await pool.query(sql5, [curr_bid, user_id]);
            sql6 = 'UPDATE souls SET owner_id = ? WHERE soul_id = ?'; //Add soul to current user
            await pool.query(sql6, [user_id, soul_id]);
            sql7 = 'UPDATE listings l SET archived = 1 WHERE l.listing_id = ?'//archive listing
            await pool.query(sql7, [listing_id]);
            res.redirect("/manage");
        } else {
            res.redirect("/manage"); //TODO: add alert for insufficient funds
        }
    } catch {
        console.log(pool.err);
    }
});

//=============================================================================================
// REVOKE ROUTE - Gets a form to cancel a past-due auction listing due to non-payment.
//=============================================================================================
router.get("/revoke/:id", sessionChecker, async function(req, res){
    try{
        sql = 'SELECT * FROM listings l INNER JOIN listing_details ld on ld.listing_id = l.listing_id INNER JOIN souls s on s.soul_id = ld.soul_id WHERE owner_id = ? AND l.listing_id = ?';    
        var owner_id = req.session.user.id;
        var listing_id = req.params.id;
        rows = await pool.query(sql, [owner_id, listing_id]);
        console.log("query finished:");
        console.log(rows);
        res.render("revoke.ejs", {rows});
    } catch {
        console.log(pool.err);
    }

});

//=============================================================================================
// REVOKE ROUTE - Cancel a past-due auction listing due to non-payment.
//=============================================================================================
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

//=============================================================================================
// MIDDLEWARE - To check for an active user session
//=============================================================================================
function sessionChecker(req, res, next){
    if (req.session.user) {
        next();
    } else {
    res.redirect('/login');
    }    
};

module.exports = router;