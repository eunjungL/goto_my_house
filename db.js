const mysql = require(`mysql`);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'dldms',
    password: 'password',
    database: `gotomyhouse`
});
db.connect();
module.exports = db;
