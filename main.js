const express = require('express');
const app = express();

function main_template() {
    return `
        <!DOCTYPE HTML>
        <html>
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <body>
                <a href="/signup">회원 가입</a>
            </body>
        </html>
    `;
}

app.get('/', function(req, res) {
    res.send(main_template());
})

app.listen(3000);