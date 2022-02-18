const Naver = {
    client_id : `N4qicuxNXkUCLmil_Fs5`,
    client_secret: `OsMQcEcYH0`,
    state: `random`,
    redirectURI: encodeURI(`http://localhost:3000/login/naver/callback`)
}

const Twilio = {
    account_sid: 'AC55664512fd21c89eab8a88fc06d4ad9e',
    auth_token: `b95839be05eedc2067100156d3bb744d`,
    messaging_service_sid: 'MGdbcd196b24bb1790652ecf252eecb476'
}

const JWT_KEY = {
    jwt_key : 'secret'
}

module.exports = {Naver, Twilio, JWT_KEY};