const jsforce = require('jsforce');

let cachedConnection = null;

async function getSalesforceConnection() {
    if (cachedConnection) {
        return cachedConnection;
    }

    const conn = new jsforce.Connection({
        loginUrl: process.env.SF_LOGIN_URL
    });

    const username = process.env.SF_USERNAME;
    const passwordAndToken = process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN;

    await conn.login(username, passwordAndToken);
    cachedConnection = conn;
    return conn;
}

module.exports = { getSalesforceConnection };