//Promisified MySQL query setup, adapted from: https://medium.com/@mhagemann/create-a-mysql-database-middleware-with-node-js-8-and-async-await-6984a09d49f4

var mysql   = require('mysql'),
    util    = require('util');

var pool =  mysql.createPool({
                connectionLimit: 10,
                host: 'localhost',
                user: 'root',
                password: 'plethora of pinatas',
                database: 'soul_exchange_v2'
            })

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }    if (connection) connection.release()    
    return
})

pool.query  =   util.promisify(pool.query);

module.exports = pool