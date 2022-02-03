const express = require('express');
const app = express.Router();
const db = require('./db');
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false}));

function login_template() {
    return `
        <!DOCTYPE HTML>
        <html lang="ko" xmlns="http://www.w3.org/1999/html">
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <body>
                <form action="/signup/signup_process" method="post">
                    <label for="id">아이디</label><br>
                    <input type="text" id="id" name="id"><br>
                    <label for="password">비밀번호</label><br>
                    <input type="password" id="password" name="password"><br>
                    <input type="submit" id="login_button" value="로그인">
                </form>
            </body>
        </html>
    `;
}

app.get('/', async (req, res) => {
    res.send(login_template());
})

module.exports = app;
