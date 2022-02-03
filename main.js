const express = require('express');
const app = express();

const signup_register = require('./signup');
const login_register = require('./login');

function main_template() {
    return `
        <!DOCTYPE HTML>
        <html>
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <body>
                <a href="/signup">회원 가입</a>
                <a href="/login">로그인</a>
            </body>
        </html>
    `;
}

app.use('/signup', signup_register);
app.use('/login', login_register);

app.get('/', function(req, res) {
    res.send(main_template());
})

app.listen(3000);