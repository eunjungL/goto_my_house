const express = require(`express`);
const app = express.Router();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false}));

app.get('/', function(req, res) {
    res.send('hello signup');
})

module.exports = app;