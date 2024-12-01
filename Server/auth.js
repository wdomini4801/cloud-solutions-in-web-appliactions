const {response} = require("express");
const {post} = require("axios");

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
async function  exchange_code(code) {
    const url =
        "https://us-east-1kius0fmq0.auth.us-east-1.amazoncognito.com/oauth2/token";
    const client_id = process.env.CLIENT_ID;
    const client_secret = process.env.CLIENT_SECRET;
    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(client_id + ":" + client_secret),
    };
    const data = {
        grant_type: "authorization_code",
        client_id: client_id,
        code: code,
        redirect_uri: "http://localhost:5173/login",
    };
    try {
        return await postData(url, data, headers);
    } catch (error) {

    }
}

module.exports = { exchange_code };
