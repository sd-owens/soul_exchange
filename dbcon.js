var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'YOUR HOST',
  user            : 'YOUR USER',
  password        : 'YOUR PASSWORD',
  database        : 'YOUR DATABASE'
});

module.exports.pool = pool;
