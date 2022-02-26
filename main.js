const express = require('express');
const db = require('./db');
const app = express();

const signup_register = require('./signup');
const login_register = require('./login');

const auth_middleware = require('./auth_middleware');

function main_template() {
    return `
        <!DOCTYPE HTML>
        <html>
            <head>
                <title>우리 집으로 가자</title>
            </head>
            <script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
            <script>
                $(document).ready(function() {
                    let token = localStorage.getItem('token');
                    if (token) {
                       token = 'Bearer ' + token;
                        
                       $.ajaxSetup({
                        headers: {'Authorization': token}
                       }); 
                       
                       $.get('/', (data) => {
                           $('#signup').attr('href', '/mypage');
                           $('#signup').html(data.user_name);
                           $('#signup').attr('id', 'mypage');
                           $('#login').attr('href', '/logout');
                           $('#login').html('로그아웃');
                           $('#login').attr('id', 'logout');
                       });
                    }
                })
            </script>
            <body>
                <a href="/signup" id="signup">회원 가입</a>
                <a href="/login" id="login">로그인</a>
            </body>
        </html>
    `;
}

app.use(auth_middleware);
app.use('/signup', signup_register);
app.use('/login', login_register);

app.get('/', async (req, res) => {
    if (req.decode.user_id === undefined) {
        res.send(main_template());
    } else {
        const [result, field] = await db.execute(`SELECT * FROM user WHERE id=?`, [req.decode.user_id]);
        res.send({user_name: result[0].name});
    }
})

app.listen(3000);