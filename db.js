const mysql = require(`mysql2/promise`);

const db = await mysql.createConnection({
    host: 'localhost',
    user: 'dldms',
    password: 'password',
    database: `gotomyhouse`
});
db.connect();
module.exports = db;
