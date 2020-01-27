var mysql = require('mysql');
var pool = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  user            : 'root',
  password        : 'plethora of pinatas',
  database        : 'soul_exchange_v2'
});

module.exports.pool = pool;
