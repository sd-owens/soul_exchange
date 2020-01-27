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
    sql = "SELECT * FROM listings LEFT JOIN souls on listings.soul_id = souls.soul_id WHERE endDatetime > NOW() ORDER BY endDatetime ASC";
    try{

    }
    catch{

    }

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

router.get("/manage", sessionChecker, async function(req, res){
    console.log(res.locals.currentUser);
    sql = "SELECT * FROM souls INNER JOIN users on souls.owner_id = users.user_id WHERE users.user_name =?" ; 
    try {
        var rows = await pool.query(sql, [res.locals.currentUser.name]);
        console.log(rows);
        res.render('manage.ejs', {rows: rows});
    } catch {
        console.log(pool.err);
    }
});

router.get("/manage/new", function(req, res){
    res.render("rank");

});

router.post("/manage", function(req, res){
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

//middleware to check for a session
function sessionChecker(req, res, next){
    if (req.session.user) {
        next();
    } else {
    res.redirect('/login');
    }    
};

module.exports = router;