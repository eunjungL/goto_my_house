const express = require('express');
const app = express.Router();
const db = require('./db');
const bodyParser = require("body-parser");
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const jwt_secret = require('./admin').JWT_KEY;
const bcrypt = require('bcrypt');

const Naver = require('./admin');
const naver_api_url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${Naver.Naver.client_id}&redirect_uri=${Naver.Naver.redirectURI}&state=${Naver.Naver.state}`;

app.use(bodyParser.urlencoded({ extended: false}));

function login_template(naver_api_url) {
    return `
        <!DOCTYPE HTML>
        <html lang="ko" xmlns="http://www.w3.org/1999/html">
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <script>
                $(document).ready(function() {
                    $("#login_button").click(function() {
                        $.post('/login', {id: $('#id').val(), password: $('#password').val()}, function(data) {
                              localStorage.setItem('token', data.token);
                              window.location.replace('/');
                        })
                    })
                })
            </script>
            <body>
                    <label for="id">아이디</label><br>
                    <input type="text" id="id" name="id"><br>
                    <label for="password">비밀번호</label><br>
                    <input type="password" id="password" name="password"><br>
                    <button type="button" id="login_button">로그인</button><br>
                    <a href=${naver_api_url}>네이버로 로그인</a>
            </body>
        </html>
    `;
}

app.get('/', async (req, res) => {
    res.send(login_template(naver_api_url));
})

app.post('/', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const pwd = body.password;
    const secret = jwt_secret.jwt_key;

    const [result, field] = await db.execute(`SELECT * FROM user WHERE id=?`, [id]);
    const encode_pwd = await bcrypt.compare(pwd, result[0].password);

    if (result.length === 0) {
        res.send('<script type="text/javascript">alert("아이디를 확인해주세요."); location.href="/login";</script>')
    } else if (!encode_pwd) {
        res.send('<script type="text/javascript">alert("비밀번호를 확인해주세요."); location.href="/login";</script>')
    } else {
        const token = await jwt.sign(
            {user_id: id}, secret, {expiresIn: '7d'}
        );
        res.send({token: token});
    }
})

app.get('/naver/callback', async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;

    const naver_api_url = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&response_type=code&client_id=${Naver.client_id}&client_secret=${Naver.client_secret}&redirect_uri=${Naver.redirectURI}&code=${code}&state=${state}`;

    const options = {
        url: naver_api_url,
        headers: {'X-Naver-Client-Id': Naver.client_id, 'X-Naver-Client-Secret': Naver.client_secret}
    }
    const result = await request.get(options);
    console.log(typeof result);

    const token = JSON.parse(result).access_token;
    console.log(token);
    const info_options = {
        url: 'https://openapi.naver.com/v1/nid/me',
        headers: {'Authorization': 'Bearer ' + token}
    };

    const info_result = await request.get(info_options);
    console.log(info_result);
    const info_result_json = JSON.parse(info_result).response;

    const [user_id, fields] = await db.execute(`SELECT id FROM user`);
    console.log(user_id);

    let is_duplicate = false;
    for (let i = 0; i < user_id.length; i++) {
        if (user_id[i].id === info_result_json.id) is_duplicate = true;
    }

    if (!is_duplicate) {
        try {
            const [result] = await db.execute(`INSERT INTO user (id, password, name, phone_number, sns_type)
                                               VALUES (?, ?, ?,
                                                       ?, ?)`, [info_result_json.id, null, info_result_json.name, info_result_json.mobile, 'naver']);
        } catch (e) {
            console.log(e);
        }
    }

    res.redirect('/');
})

module.exports = app;
