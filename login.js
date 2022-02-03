const express = require('express');
const app = express.Router();
const db = require('./db');
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false}));

module.exports = app;
