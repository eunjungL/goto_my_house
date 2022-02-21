const express = require('express');
const app = express.Router();
const db = require('./db');
const bodyParser = require("body-parser");
const request = require('request-promise');
const jwt = require('jsonwebtoken');
const jwt_secret = require('./admin').JWT_KEY;
const bcrypt = require('bcrypt');
const Twilio = require('./admin').Twilio;
const twilio = require('twilio')(Twilio.account_sid, Twilio.auth_token);

const Naver = require('./admin').Naver;
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
                    <a href="login/account_find">아이디/비밀번호 찾기</a>
            </body>
        </html>
    `;
}

function account_find_template() {
    return `
        <!DOCTYPE HTML>
        <html lang="ko" xmlns="http://www.w3.org/1999/html">
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <script>
                $(document).ready(() => {
                    $('#find_id').click(() => {
                        $.post('/login/find_id', {name: $('#name').val(), phone_number: $('#phone_number').val()}, (data) => {
                            if (data.id === undefined) alert('아이디가 존재하지 않습니다. 정보를 다시 확인해주세요.');
                            else {
                                if ($('#find_id_text').length === 0) {
                                    $('#phone_number').after(
                                        "<p id='find_id_text'>아이디는 " + data.id + "입니다.</p>"
                                    );
                                }
                            }
                        })
                    })
                    
                    $('#find_pwd').click(() => {
                        $.post('/login/find_pwd', {name: $('#name').val(), phone_number: $('#phone_number').val()}, (data) => {
                            
                        })
                    })
                })
            </script>
            <body>
                <label for="name">이름</label><br>
                <input type="text" id="name" name="name"><br>
                <label for="phone_number">전화번호</label><br>
                <input type="text" id="phone_number" name="phone_number"><br>
                <button type="button" id="find_id">아이디 찾기</button><br>
                <button type="button" id="find_pwd">비밀번호 찾기</button>
            </body>
        </html>
    `;
}

app.get('/', async (req, res) => {
    res.send(login_template(naver_api_url));
})

app.get('/account_find', async (req, res) => {
    res.send(account_find_template());
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

app.post('/find_id', async (req, res) => {
    const body = req.body;
    const name = body.name;
    const phone_number = body.phone_number;

    try {
        const [result, field] = await db.execute(`SELECT * FROM user WHERE name=? AND phone_number=?`, [name, phone_number]);

        if (result.length === 0) {
            res.send({id: undefined});
        } else {
            res.send({id: result[0].id});
        }
    } catch (e) {
        res.send('<script type="text/javascript">alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요."); location.href="/account_find";</script>')
    }
})

app.post('/find_pwd', async (req, res) => {
    const body = req.body;
    const name = body.name;
    const phone_number = body.phone_number;

    try {
        const [result, field] = await db.execute(`SELECT * FROM user WHERE name=? AND phone_number=?`, [name, phone_number]);

        if (result.length !== 0) {
            const temp_pwd = Math.random().toString(36).substr(2, 11);
            console.log(temp_pwd);

            // const [result] = await db.execute(`UPDATE user SET password=? WHERE name=? AND phone_number=?`, [temp_pwd, name, phone_number]);
            //
            // await twilio.messages.create({
            //         body: `[우리집으로 가자] 변경된 임시 비밀번호는 ${temp_pwd} 입니다. 꼭 마이페이지에서 다시 변경해주세요.`,
            //         from: '+19033214036',
            //         to: '+82' + phone_number
            // }, function (err, message) {
            //         if (err) console.log(err);
            //         else console.log(message.sid);
            // });
        } else {
            res.send({temp_pwd: 'false'});
        }
    } catch (e) {
        res.send('<script type="text/javascript">alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요."); location.href="/account_find";</script>');
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

    // try {
    //     const app_token = await jwt.sign({user_id: info_result_json.id}, jwt_secret.jwt_key, {expiresIn: '7d'});
    //     res.send(`<script type="text/javascript">localStorage.setItem('token', ${app_token}); window.location.href="/"</script>`);
    // } catch (e) {
    //     res.send('<script type="text/javascript">alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요."); location.href="/login";</script>');
    // }
    res.send(`<script src="//code.jquery.com/jquery-3.3.1.min.js"></script><script> $(document).ready(() => {$.post("/login/naver_app_token", {id: "${info_result_json.id}"}, (data) => {localStorage.setItem("token", data.token); window.location.href="/"});}) </script>`);
})

app.post('/naver_app_token', async (req, res) => {
    const id = req.body.id;
    try {
        const app_token = await jwt.sign({user_id: id}, jwt_secret.jwt_key, {expiresIn: '7d'});
        res.send({'token': app_token});
        console.log(app_token);
    } catch (e) {
        res.send('<script type="text/javascript">alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요."); location.href="/login";</script>');
    }
})

module.exports = app;
