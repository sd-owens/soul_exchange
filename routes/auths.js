var bodyParser  = require("body-parser"),
    express     = require("express"),
    pool        = require('../db'),
    router      = express.Router();

// AUTH ROUTES
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


//==================================================================
//Load registration form  
//==================================================================
router.get('/register', function(req, res){
    res.render('register.ejs');
});

//==================================================================
//Register new users- built with async, await.  
//==================================================================
router.post('/register', async function(req, res){
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
        if(sessionData){                            //destroy any existing session before creating a new one
                    sessionData.destroy();
                }
                var sessionData         = req.session;      //initialize session variable
                sessionData.user = {"id": rows[0].user_id,
                                    "name": rows[0].user_name
                                    };     
                res.redirect('/manage');
    } catch {
        console.log(pool.err);
    };
});

//==================================================================
//Load login form  
//==================================================================
router.get("/login", function(req, res){
    res.render("login.ejs");
})

//==================================================================
//Login User and redirect to <SOMEWHERE>  
//==================================================================
router.post("/login", async function(req, res){
    var user_name = req.body.user_name;
    var password = req.body.password;
    sql = 'SELECT user_name, user_id, password from users WHERE user_name = ?';
    try{
        //get record of user with user_name, create their session, and redirect them
        var rows = await pool.query(sql, user_name);
        // make sure it returns a result
        if(rows.length > 0){
            //make sure the password matches (TODO - figure out how to implement bcrypt and don't store plaintext passwords)
            if(rows[0].password == password){
                if(sessionData){                            //destroy any existing session before creating a new one
                    sessionData.destroy();
                }
                var sessionData         = req.session;      //initialize session variable
                sessionData.user = {"id": rows[0].user_id,
                                    "name": rows[0].user_name
                                    };     
                res.redirect('/manage');
            }
            else {
                res.send({

                    "code":204,"success":"User name and password do not match"});
            }
        } else {

            res.send({"code":204,"success":"User does not exist"});    
        }
    } catch {

        console.log(pool.err);
        res.send({"code":400,"failed":"error ocurred in catch"});
    }
});

//==================================================================
//Logout user, destroy session 
//==================================================================
router.get("/logout", function(req, res){
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
router.get('/dbtest', sessionChecker, async function(req, res){

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

module.exports = router;