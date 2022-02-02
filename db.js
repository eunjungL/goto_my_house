const mysql = require(`mysql2/promise`);

const db = mysql.createPool({
    host: 'localhost',
    user: 'dldms',
    password: 'password',
    database: 'gotomyhouse',
    connectionLimit: 10
});
module.exports = db;