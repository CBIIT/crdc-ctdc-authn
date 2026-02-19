const nodeFetch = require("node-fetch");
const config = require("../config");

const client = config.DCF;

async function getDCFToken(code, redirectURi) {
  console.log(
    "getDCFToken initiated with code:",
    code?.substring(0, 10) + "...",
  );
  console.log(
    "redirectURi:",
    redirectURi,
    "client_id:",
    client.CLIENT_ID,
    "client_secret:",
    client.CLIENT_SECRET?.substring(0, 4) + "...",
  );

  try {
    const response = await nodeFetch(client.TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        redirect_uri: redirectURi,
        grant_type: "authorization_code",
        client_id: client.CLIENT_ID,
        client_secret: client.CLIENT_SECRET,
        scope: "openid%20user%20data",
      }),
    });

    const jsonResponse = await response.json();

    if (!response.ok) {
      console.error("DCF token request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorResponse: jsonResponse,
        tokenUrl: client.TOKEN_URL,
        redirectURi: redirectURi,
      });
      throw new Error(
        `eRA Commons access token failed to create: ${response.status} ${response.statusText}. ` +
          `Error details: ${JSON.stringify(jsonResponse)}`,
      );
    }

    if (!jsonResponse.access_token) {
      console.error("DCF token response missing access_token:", jsonResponse);
      throw new Error("DCF token response did not contain access_token");
    }

    console.log("Successfully retrieved DCF token");
    return jsonResponse.access_token;
  } catch (error) {
    console.error("Error in getDCFToken:", {
      message: error.message,
      name: error.name,
      code: code?.substring(0, 10) + "...",
      redirectURi: redirectURi,
      clientId: client.CLIENT_ID,
      tokenUrl: client.TOKEN_URL,
    });
    throw error;
  }
}

async function dcfLogout(tokens) {
  console.log("dcfLogout initiated");

  try {
    if (!tokens) {
      console.error("dcfLogout: No tokens provided");
      throw new Error("Tokens are required for logout");
    }

    const result = await nodeFetch(client.LOGOUT_URL, {
      method: "GET",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(client.CLIENT_ID + ":" + client.CLIENT_SECRET).toString(
            "base64",
          ),
      },
      body: new URLSearchParams({
        id_token: tokens,
        next: client.REDIRECT_URL,
        force_era_global_logout: true,
      }),
    });

    if (!result.ok) {
      console.error("DCF logout request failed:", {
        status: result.status,
        statusText: result.statusText,
        logoutUrl: client.LOGOUT_URL,
      });
      throw new Error(
        `DCF logout failed: ${result.status} ${result.statusText}`,
      );
    }

    console.log("DCF logout successful");
    return result;
  } catch (error) {
    console.error("Error in dcfLogout:", {
      message: error.message,
      name: error.name,
      logoutUrl: client.LOGOUT_URL,
    });
    throw error;
  }
}

async function dcfUserInfo(accessToken) {
  console.log("dcfUserInfo initiated");

  try {
    if (!accessToken) {
      console.error("dcfUserInfo: No access token provided");
      throw new Error("Access token is required to fetch user info");
    }

    const result = await nodeFetch(client.USERINFO_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ` + accessToken,
      },
    });

    if (!result.ok) {
      console.error("DCF userInfo request failed:", {
        status: result.status,
        statusText: result.statusText,
        userInfoUrl: client.USERINFO_URL,
      });
      throw new Error(
        `DCF user info request failed: ${result.status} ${result.statusText}`,
      );
    }

    const userInfo = await result.json();
    console.log(
      "Successfully retrieved DCF user info for:",
      userInfo?.email || userInfo?.sub || "unknown",
    );
    return userInfo;
  } catch (error) {
    console.error("Error in dcfUserInfo:", {
      message: error.message,
      name: error.name,
      userInfoUrl: client.USERINFO_URL,
    });
    throw error;
  }
}

module.exports = {
  getDCFToken,
  dcfLogout,
  dcfUserInfo,
};
