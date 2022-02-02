const express = require(`express`);
const app = express.Router();
const db = require(`db`);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false}));

function signup_template() {
    return `
        <!DOCTYPE HTML>
        <html lang="ko">
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <script>
                $(document).ready(function(){
                   $("#id_check").click(function() {
                           $.post('/signup', {id: $('#id').val()}, function (data) {
                           $("#id_check_txt").text("사용할 수 있는 아이디입니다.");
                       })
                   })
                });
            </script>
            <body>
                <label for="id">아이디</label><br>
                <input type="text" id="id" name="id">
                <input type="submit" id="id_check" value="아이디 확인"><br>
                <p id="id_check_txt">아이디 중복을 확인해주세요.</p>
                <label for="password1">비밀번호</label><br>
                <input type="password" id="password1" name="password1"><br>
                <label for="password2">비밀번호 확인</label><br>
                <input type="password" id="password2" name="password2"><br>
                <label for="name">이름</label><br>
                <input type="text" id="name" name="name"><br>
                <label for="phone_number">전화번호</label><br>
                <input type="text" id="phone_number" name="phone_number">
                <input type="submit" value="전화번호 인증">
            </body>
        </html>
    `;
}

app.get('/', function(req, res) {
    res.send(signup_template());
})

app.post('/', function(req, res) {
    const body = req.body;
    const id = req.id;

    db.query()
})

module.exports = app;