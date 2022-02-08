const express = require(`express`);
const app = express.Router();
const db = require(`./db`);
const bcrypt = require('bcrypt');
const Twilio = require('./admin').Twilio;
const twilio = require('twilio')(Twilio.account_sid, Twilio.auth_token);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false}));

function signup_template() {
    return `
        <!DOCTYPE HTML>
        <html lang="ko" xmlns="http://www.w3.org/1999/html">
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <script>
                $(document).ready(function(){
                   $("#id_check").click(function() {
                       $.post('/signup/id_check', {id: $('#id').val()}, function (data) {
                           if (data.id_valid) $("#id_check_txt").text("사용할 수 있는 아이디입니다.").css('color', 'blue');
                           else $("#id_check_txt").text("사용할 수 없는 아이디입니다.").css('color', 'red');
                           if ($("#id_valid").length === 0) {
                               $("#id_check").after(
                                   "<input type='hidden' id='id_valid' name='id_valid' value=" + data.id_valid + ">"
                               );
                           } else {
                               $("#id_valid").val(data.id_valid);
                           }
                       });
                   });
                   
                   let timer;
                   $("#phone_number_check").click(function () {
                       if ($("#phone_number_password").length === 0) {
                           $("#phone_number_check").after(
                               "<br><input type='text' id='phone_number_password' name='phone_number_password'>"
                           );
                           $("#phone_number_password").after(
                               "<button type='button' id='phone_verify_button'>인증번호 확인</button>"
                           );
                           $("#phone_verify_button").after(
                               "<p id='timer'>00:00</p>"
                           );
                           $("#timer").after(
                               "<p id='phone_verify_txt'>인증 번호를 확인해주세요.</p>"
                           );
                           $("#phone_number_check").html('인증번호 재전송');
                       }
                       
                       $.post('/signup/phone_check', {phone_number: $("#phone_number").val()}, function (data) {
                           
                       });
                       
                       let minute = 3 * 60;
                       clearInterval(timer);
                       function start_timer () {
                           timer = setInterval(function () {
                               let last_min = minute / 60;
                               last_min = Math.floor(last_min);
                               let last_sec = minute - 60 * last_min;
                               
                               $("#timer").text(last_min + ":" + last_sec).css('color', 'blue');
                               
                               if (minute === 0) {
                                   clearInterval(timer);
                                   $("#timer").text("0:00").css('color', 'red');
                               }
                              
                               minute -= 1;
                           }, 1000);
                       }
                       start_timer();
                   });
                   
                   $(document).on('click', '#phone_verify_button', function () {
                       $.post('/signup/phone_check/verify', {verify_code: $("#phone_number_password").val(), phone_number: $("#phone_number").val()}, function(data) {
                           if (data.phone_valid) $("#phone_verify_txt").text('인증 되었습니다.').css('color', 'blue');
                           else $("#phone_verify_txt").text('다시 시도해주세요.').css('color', 'red');
                           
                           if ($("#phone_valid").length === 0) {
                               $("#phone_number").after(
                                    "<input type='hidden' id='phone_valid' name='phone_valid' value=" + data.phone_valid + ">"
                               );
                           } else {
                               $("#phone_valid").val(data.phone_valid);
                           }
                       });
                   });
                   
                   $("#password2").on('keyup', function() {
                       if ($("#password2").val() === $("#password1").val()) {
                            $("#password_check_txt").text('비밀번호가 일치합니다.').css('color', 'blue');
                       }
                       else {
                           $("#password_check_txt").text('비밀번호가 일치하지 않습니다.').css('color', 'red');
                       }
                   })
                })
            </script>
            <body>
                <form action="/signup/signup_process" method="post">
                    <label for="id">아이디</label><br>
                    <input type="text" id="id" name="id">
                    <button type="button" id="id_check">아이디 확인</button><br>
                    <p id="id_check_txt">아이디 중복을 확인해주세요.</p>
                    <label for="password1">비밀번호</label><br>
                    <input type="password" id="password1" name="password1"><br>
                    <label for="password2">비밀번호 확인</label><br>
                    <input type="password" id="password2" name="password2"><br>
                    <p id='password_check_txt'>비밀번호를 확인해주세요.</p>
                    <label for="name">이름</label><br>
                    <input type="text" id="name" name="name"><br>
                    <label for="phone_number">전화번호</label><br>
                    <input type="text" id="phone_number" name="phone_number">
                    <button type="button" id="phone_number_check">인증번호 전송</button><br>
                    <input type="submit" id="signup_button" value="가입하기">
                </form>
            </body>
        </html>
    `;
}

app.get('/', function(req, res) {
    res.send(signup_template());
})

app.post('/id_check', async (req, res) => {
    const body = req.body;
    const id = body.id;
    let id_valid = true;

    console.log("id" + id);

    if (id !== '') {
        const [result, fields] = await db.execute(`SELECT * FROM user`);

        for (let i = 0; i < result.length; i++) {
            if (id === result[i].id) id_valid = false;
        }
    } else {
        id_valid = false;
    }

    res.send({id_valid: id_valid});
})

app.post('/phone_check', async (req, res) => {
    const body = req.body;
    const phone_number = body.phone_number;

    console.log(phone_number);

    let code = '';
    for (let i = 0; i < 4; i++) code += Math.floor(Math.random() * 10);
    console.log(code);

    try {
        const [result] = await db.execute(`INSERT INTO sms_validation(phone_number, validation_code, expire)
                                           VALUES (?, ?, NOW() + INTERVAL 3 MINUTE) ON DUPLICATE KEY
                UPDATE validation_code = ?, expire = NOW() + INTERVAL 3 MINUTE`,
            [phone_number, code, code]);
    } catch (e) {
        console.log(e);
        res.send('<script type="text/javascript">alert("오류가 발생했습니다. 다시 시도 해주세요."); location.href="/signup";</script>');
    }

    // await twilio.messages.create({
    //         body: `[우리집으로 가자] 인증번호는 ${code} 입니다.`,
    //         from: '+19033214036',
    //         to: '+82' + phone_number
    //     }, function (err, message) {
    //         if (err) console.log(err);
    //         else console.log(message.sid);
    //     });
})

app.post('/phone_check/verify', async (req, res) => {
    const body = req.body;
    const code = body.verify_code;
    const phone_number = body.phone_number;
    let phone_valid = false;

    console.log(code);
    try {
        const [result, field] = await db.execute(`SELECT *
                                                  FROM sms_validation
                                                  WHERE phone_number = ?`, [phone_number]);
        const expire_time = new Date(result[0].expire);
        const now = Date.now();
        if (code === result[0].validation_code && expire_time > now) {
            phone_valid = true;
        }

        res.send({phone_valid: phone_valid});
    } catch (e) {
        console.log(e);
        res.send('<script type="text/javascript">alert("오류가 발생했습니다. 다시 시도 해주세요."); location.href="/signup";</script>');
    }
})

app.post('/signup_process', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const password1 = body.password1;
    const password2 = body.password2;
    const name = body.name;
    const phone_number = body.phone_number;
    const id_valid = body.id_valid;
    const phone_valid = body.phone_valid;

    if (id_valid === 'false' || id_valid === undefined) {
        res.send('<script type="text/javascript">alert("아이디를 다시 확인해주세요."); location.href="/signup";</script>');
    } else if (password1 !== password2 || password1 === '' || password2 === '') {
        res.send('<script type="text/javascript">alert("비밀번호를 다시 확인해주세요."); location.href="/signup";</script>');
    } else if (phone_valid === 'false' || phone_valid === undefined) {
        res.send('<script type="text/javascript">alert("핸드폰 인증번호를 확인해주세요."); location.href="/signup";</script>');
    } else if (name === '' || phone_number === '') {
        res.send('<script type="text/javascript">alert("모든 정보를 정확히 입력해주세요."); location.href="/signup";</script>');
    } else {
        const password_encode = await bcrypt.hash(password2, 10);
        try {
            const [result] = await db.execute(`INSERT INTO user (id, password, name, phone_number)
                                               VALUES (?, ?, ?, ?)`, [id, password_encode, name, phone_number]);
        } catch (e) {
            console.log(e);
            res.send('<script type="text/javascript">alert("오류가 발생했습니다. 다시 시도 해주세요."); location.href="/signup";</script>');
        }
        res.redirect('/');
    }
})

module.exports = app;