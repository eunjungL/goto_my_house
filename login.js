const express = require('express');
const app = express.Router();
const db = require('./db');
const bodyParser = require("body-parser");

const Naver = {
    client_id : `N4qicuxNXkUCLmil_Fs5`,
    client_secret: `OsMQcEcYH0`,
    state: `random`,
    redirectURI: encodeURI(`http://localhost:3000/login/naver/callback`)
}
const naver_api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${Naver.client_id}&redirect_uri=${Naver.redirectURI}&state=${Naver.state}`;

app.use(bodyParser.urlencoded({ extended: false}));

function login_template(naver_api_url) {
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
                    <a href=${naver_api_url}>네이버로 로그인</a>
                </form>
            </body>
        </html>
    `;
}

app.get('/', async (req, res) => {
    res.send(login_template(naver_api_url));
})

module.exports = app;
