const jwt = require('jsonwebtoken');
const jwt_secret = require('./admin').JWT_KEY;

const auth_middleware = (req, res, next) => {
    let token = req.headers.authorization

    if (token === undefined) {
        req.decode = {login: false};
        return next();
    }
    else {
        token = token.split('Bearer ')[1];

        try {
            req.decode = jwt.verify(token, jwt_secret.jwt_key);
            return next();
        } catch (e) {
            res.send('<script type="text/javascript">alert("로그인을 확인해주세요."); location.href="/login";</script>')
        }
    }
}

module.exports = auth_middleware;