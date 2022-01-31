const express = require('express');
const app = express();

app.get('/', function(req, res) {
    res.send('first init');
})

app.listen(3000);