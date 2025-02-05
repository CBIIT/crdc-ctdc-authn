const nodeFetch = require("node-fetch");
const config = require("../config");

const validateResponseOrThrow= (res)=> {
    if (res.status != 200) throw new Error("eRA Commons access token failed to create because of invalid access code or unauthorized access");
}

const client = config.DCF;

async function getDCFToken(code, redirectURi) {
    console.log("getDCFToken")
    console.log("getDCFToken... client" + client)
    const response = await nodeFetch(client.TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            code: code,
            redirect_uri: redirectURi,
            grant_type: "authorization_code",
            client_id: client.CLIENT_ID,
            client_secret: client.CLIENT_SECRET,
            scope: "openid%20user%20data"
        })
    });
    const jsonResponse = await response.json();
    console.log(jsonResponse)
    validateResponseOrThrow(response);
    console.log("HERE TOKEN " + jsonResponse.access_token)
    return jsonResponse.access_token;
}

async function dcfLogout(tokens) {
    console.log("dcfLogout... Token :" + tokens)
    console.log("dcfLogout... client" + client)

    const result = await nodeFetch(client.LOGOUT_URL, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(client.CLIENT_ID + ':' + client.CLIENT_SECRET).toString('base64')
        },
        body: new URLSearchParams({
            id_token: tokens,
            next:client.REDIRECT_URL,
            force_era_global_logout: true
        })
    });
    return result;
}


async function dcfUserInfo(accessToken) {
    console.log("dcfUserInfo... token: " + accessToken)
    console.log("dcfLogout... Client information :" + client)
    const result = await nodeFetch(client.USERINFO_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ` + accessToken
        }
    });
    return result.json();
}


module.exports = {
    getDCFToken,
    dcfLogout,
    dcfUserInfo,
};