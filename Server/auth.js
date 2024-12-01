const {post} = require("axios");
const jwkToPem = require('jwk-to-pem');
const jsonwebtoken = require('jsonwebtoken');
const fetch = require("sync-fetch");

const jsonWebKeys = [
    {
        "alg": "RS256",
        "e": "AQAB",
        "kid": "AxYhEFFHpBy6KI9jRxYdX0GbyZU5jAkoFDpndKHcT5w=",
        "kty": "RSA",
        "n": "wDaD58qlJTP-7Wp3_fTSYAp7L34RlgyBjwlhRpgn6PiF1egarOR5AsqC9uTXwgzXGqo1FrXlyWUThZ9yN1p2Nw4EtNlQKKofMOHSilsUjNx0tpaIA-ukaiqfNTXlUCf6pKtHogOBTgPjXVtBgiiFDMejElTuv_knwF-_BY3LmELjkhhuS_uaAGVUSmlSXmqrKcpyXyz27HjWFIXusu7GAM9truVPbulh2HMfjZMWtPSrgPDqaHqt2GcqHstDWaV9GCyRBsEjfyYqZIZgP_1VQs_pJD5q_Z3oYlPWrGLPhIAQGVlCaP1h2vbVDkK_HwfjoSJiLajLsRmux0iRtJN3Gw",
        "use": "sig"
    },
    {
        "alg": "RS256",
        "e": "AQAB",
        "kid": "2Qi/AyPJb5CCz74KWJA2D/nSQW9VgbgDqKUDBD9j4iQ=",
        "kty": "RSA",
        "n": "7p8OQfOinIo_4rkLn_Hp3CYaJt0ZCsfXMYyfpr4HDcYYavFNyZt6GSq7nZb6cmQ-s29l-SoyYuVws2b2xDXgCJWrHzXlUd-w9MSbpIMoZ19W92kV0-i7YQ7QcUL_eIOKb8MPib6pQ92XjQljUSDYnNv_fwzqEduIDa3rLG5HRy3rcjNdd-tkGhzb-bSwVbN3lp68l9NgNl2ri7E7kWgiccqwd-fpv0FasVeptVAxNMC-JfJ9CVaNcs2llxnpzqVd_rfcdos3d6nlPvt-SAA0lG3v-xmYNbQIoxGHlesrp_FpaURJtmXYGrH69maZ0a4ykQ5EyYDbW9sLRtxht0smSQ",
        "use": "sig"
    }
];

function decodeTokenHeader(token) {
    const [headerEncoded] = token.split('.');
    const buff = new Buffer(headerEncoded, 'base64');
    const text = buff.toString('ascii');
    return JSON.parse(text);
}

function getJsonWebKeyWithKID(kid) {
    for (let jwk of jsonWebKeys) {
        if (jwk.kid === kid) {
            return jwk;
        }
    }
    return null;
}

function verifyJsonWebTokenSignature(token, jsonWebKey) {
    const pem = jwkToPem(jsonWebKey);
    try {
        jsonwebtoken.verify(token, pem, { algorithms: ['RS256'] });
        return true;
    } catch (err) {
        return false;
    }
}

function validateToken(token) {
    token = token.split(' ')[1];
    const header = decodeTokenHeader(token);
    const jsonWebKey = getJsonWebKeyWithKID(header.kid);
    return verifyJsonWebTokenSignature(token, jsonWebKey);
}

async function postData(url, data, headers) {
    try {
        const response = await post(url, data, { headers: headers });
        console.log("OK");
        return response.data;
    } catch (error) {
        console.log("ERROR");
        // Optional: re-throw the error to handle it further up the call stack
    }
}

function getIp(){
    const data = fetch('https://api.ipify.org?format=json').json();
    console.log(data);
    return data.ip;
}

let ip = ""

if(process.env.VITE_DEPLOYMENT_TYPE === "local") {
    ip = "localhost";
}
else if(process.env.VITE_DEPLOYMENT_TYPE === "remote") {
    ip = getIp();
}

async function exchange_code(code) {
    const url = "https://us-east-1kius0fmq0.auth.us-east-1.amazoncognito.com/oauth2/token";
    const client_id = process.env.VITE_CLIENT_ID;
    const port = process.env.VITE_CLIENT_PORT;
    let redirect_uri= "";

    if(port === "80") {
        redirect_uri = "http://"+ip+"/login";
    }

    else if (port === "443") {
        redirect_uri = "https://"+ip+"/login";
    }

    else {
        redirect_uri = "http://"+ip+":"+port+"/login";
    }

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(client_id),
    };

    const data = {
        grant_type: "authorization_code",
        client_id: client_id,
        code: code,
        redirect_uri: redirect_uri,
    };
    console.log("url", url);
    console.log("data", data);
    console.log("headers", headers);
    try {
        return await postData(url, data, headers);
    } catch (error) {
        console.log("url", url);
        console.log("data", data);
        console.log("headers", headers);
    }
}

module.exports = { exchange_code, validateToken };
