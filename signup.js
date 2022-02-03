const express = require(`express`);
const app = express.Router();
const db = require(`./db`);
const bcrypt = require('bcrypt');

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
                       $.post('/signup', {id: $('#id').val()}, function (data) {
                           if (data.id_valid) $("#id_check_txt").text("사용할 수 있는 아이디입니다.").css('color', 'blue');
                           else $("#id_check_txt").text("사용할 수 없는 아이디입니다.").css('color', 'red');
                           $("#id_check").after(
                               "<input type='hidden' name='id_valid' value=" + data.id_valid + ">"
                           );
                       });
                   });
                   
                   $("#phone_number_check").click(function () {
                       $("#phone_number_check").after(
                           "<br><input type='text' name='phone_number_password'>"
                       );
                   });
                   
                   let password_valid = false;
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
                    <button type="button" id="phone_number_check">전화번호 인증</button><br>
                    <input type="submit" id="signup_button" value="가입하기">
                </form>
            </body>
        </html>
    `;
}

app.get('/', function(req, res) {
    res.send(signup_template());
})

app.post('/', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const phone_number = body.phone_number;
    let id_valid = true;
    let number_valid;

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

app.post('/signup_process', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const password1 = body.password1;
    const password2 = body.password2;
    const name = body.name;
    const phone_number = body.phone_number;
    const id_valid = body.id_valid;
    const number_valid = body.number_valid;

    if (!id_valid) {
        res.send('<script type="text/javascript">alert("아이디를 다시 확인해주세요."); location.href="/signup";</script>');
    } else if (password1 !== password2) {
        res.send('<script type="text/javascript">alert("비밀번호를 다시 확인해주세요."); location.href="/signup";</script>');
    } else if (name === '' || phone_number === '') {
        res.send('<script type="text/javascript">alert("모든 정보를 정확히 입력해주세요."); location.href="/signup";</script>');
    }
    else {
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