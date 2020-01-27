var bodyParser  = require("body-parser"),
    express     = require("express"),
    pool        = require('../db'),
    router      = express.Router();

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

module.exports = router;