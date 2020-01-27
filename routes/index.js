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

router.get("/manage", function(req, res){
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

module.exports = router;