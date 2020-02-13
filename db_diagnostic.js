const mysql   = require('mysql');

const connection =  mysql.createConnection({
                connectionLimit: 10,
                host: 'localhost',
                user: 'root',
                password: 'password',
                database: 'soul_exchange_v2'
            });

// pool.getConnection((err, connection) => {
//     if (err) {
//         if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//             console.error('Database connection was closed.')
//         }
//         if (err.code === 'ER_CON_COUNT_ERROR') {
//             console.error('Database has too many connections.')
//         }
//         if (err.code === 'ECONNREFUSED') {
//             console.error('Database connection was refused.')
//         }
//     }    if (connection) connection.release()    
//     return
// })

connection.connect(function(err){
    if(err) throw err;
    console.log("Connected!");
});

module.exports = connection;