// Used https://github.com/1uphealth/1upwebapp/blob/master/oneup.js as inspiration
// TODO: Make generalized functions for accessing FHIR resource bundles
// TODO: Separate DB logic into separate file

const ROOT_API_URL = 'https://api.1up.health';
const ROOT_QUICK_CONNECT_URL = 'https://quick.1up.health';

const OUH_CLIENT_ID = process.env.OUH_CLIENT_ID;
const OUH_CLIENT_SECRET = process.env.OUH_CLIENT_SECRET;

const request = require('request');
const utils = require('./utils');

let User = require('./models/user.model');

// Get user, or create if does not exist
// Also handle ensuring user token is valid
function getOrCreateUser(email, callback) {
    getUser(email, userObj => {
        if (!userObj) {
            createUser(email, userObj => {
                console.log('Created user: ', userObj);
                callback(userObj);
            });
        } else {

            refreshUserTokenIfExpired(userObj, newUserObj => {
                callback(newUserObj);
            });
        }
    });
}

// Return User obj from database given email
function getUser(email, callback) {
    let url = `${ROOT_API_URL}/user-management/v1/user?client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}&app_user_id=${email}`;

    request.get(url, (error, response, body) => {
        let bodyJson = JSON.parse(body);
        entry = bodyJson.entry;

        if (entry.length === 0) {
            callback();
        } else {
            User.findOne({userEmail: email}, (error, data) => {
                if (error) {
                    console.log('Get user from DB error: ', error)
                    callback();
                } else if ( !data ) {
                    // This will be handled downstream. TODO: Clean up code so call chain makes more sense..
                    console.log('WARNING: OneUp user exists but not in DB.')
                    callback();
                } else {
                    callback(data);
                }
            });
        }
    });
}


// Creates a user given an email, returning user object
function createUser(email, callback) {
    let url = `${ROOT_API_URL}/user-management/v1/user?app_user_id=${email}&client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}`

    request.post(url, (error, response, body) => {

        let bodyJson = JSON.parse(body);

        if (error) {
            console.log('Create user error: ', error)
            callback();
        } else {
            let bodyJson = JSON.parse(body);
            let oneupUserId = bodyJson.oneup_user_id;

            getOAuthTokens(bodyJson.code, email, (accessToken, refreshToken, expirationTimestamp) => {

                // Encrypt refresh token with password to form symmetric key stored on local machine (TODO: Explore better options)
                let encryptedRefreshToken = utils.encrypt(refreshToken);
                let user = new User({
                    userEmail: email,
                    accessToken: accessToken,
                    refreshToken: encryptedRefreshToken,
                    expirationTimestamp: expirationTimestamp
                });
                user.save(error => {

                    if (error) {
                        console.log('Error saving newly created user: ', error);
                        callback();
                    } else {
                        getUser(email, userObj => {
                            callback(userObj);
                        });
                    }
                })
            });
        }
    });
}

// Generate new auth code in case refreshToken expires or user data is lost
function getNewAuthCode(email, callback){

    request.post(
        {
          url: `${ROOT_API_URL}/user-management/v1/user/auth-code?app_user_id=${email}&client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}`,
        },
        (error, response, body) => {
          let bodyJson = JSON.parse(body);
            if (error) {
                console.log('Error getting new auth code: ', error);
                callback();
            }else{
                callback(bodyJson.code);
            }
        }
    );
}

// Use access code to retrieve authorization tokens
// Regenerates access code if invalid (TODO: Better compartmentalize this functionality)
function getOAuthTokens(code, email, callback) {
    let url = `${ROOT_API_URL}/fhir/oauth2/token?client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code`;

    request.post(url, (error, response, body) => {
        // Hacky way to keep track of when the token will expire
        // TODO: Better way to do this?
        now = Date.now();

        let bodyJson = JSON.parse(body);
        // First check if code needs to be regenerated
        if (bodyJson.error_description === "Invalid code"){
            getNewAuthCode(email, newCode => {

                let url = `${ROOT_API_URL}/fhir/oauth2/token?client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}&code=${newCode}&grant_type=authorization_code`;
                request.post(url, (error, response, body) => {
                    now = Date.now();
                    if (error) {
                        console.log('Error getting tokens with re-generated auth code: ', error)
                        callback();
                    }else {
                        try {
                            let bodyJson = JSON.parse(body);
                            let expirationTimestamp = now + (bodyJson.expires_in * 1000)
                            callback(bodyJson.access_token, bodyJson.refresh_token, expirationTimestamp);
                        } catch (error) {
                            // Possible for delay in generation of access token
                            console.log('Error parsing JSON in getOAuthTokens: ', error)
                            callback();
                        }
                    }
                });
            });
        } else {

            if (error) {
                console.log('Get OAuth tokens from access code error: ', error);
                callback();
            }else {
                try {
                    let bodyJson = JSON.parse(body);
                    let expirationTimestamp = now + (bodyJson.expires_in * 1000)
                    callback(bodyJson.access_token, bodyJson.refresh_token, expirationTimestamp);
                } catch (error) {
                    // Possible for delay in generation of access token
                    console.log('Error parsing JSON in getOAuthTokens: ', error)
                    callback();
                }
            }
        }
    });
}

// Return a new user object with refreshed access token if expired, and save to db
// Return the same user object if access token not expired
// TODO: What if refresh token expires or error occurs? Need to implement functionality for getting new access code..
function refreshUserTokenIfExpired(userObj, callback) {
    decryptedRefreshToken = utils.decrypt(userObj.refreshToken);

    let url = `${ROOT_API_URL}/fhir/oauth2/token?client_id=${OUH_CLIENT_ID}&client_secret=${OUH_CLIENT_SECRET}&refresh_token=${decryptedRefreshToken}&grant_type=refresh_token`;

    now = Date.now()

    // First check if token has expired
    if (now >= userObj.expirationTimestamp) {
        console.log('Access toke expired! Refreshing: ', userObj)
        request.post(url, (error, response, body) => {
            now = Date.now()
            if (error) {
                // TODO: Handle creating new access code
                console.log('Refresh token error: ', error)
            } else {
                // Try creating new access code and updating userObj
                try {
                    let bodyJson = JSON.parse(body);

                    userObj.refreshToken = utils.encrypt(bodyJson.refresh_token);
                    userObj.accessToken = bodyJson.access_token;
                    userObj.expirationTimestamp = now + (bodyJson.expires_in * 1000)
                    userObj.save(error => {
                        if (error) {
                            console.log('Error saving refreshed userObj: ', error)
                        }else {
                            console.log('Token refreshed: ', userObj)
                            callback(userObj)
                        }
                    });

                } catch (error) {
                    console.log('Error parsing JSON in refreshUserTokenIfExpired: ', error)
                }
            }
        });
    } else {
        callback(userObj);
    }
}

// Get list of all health systems
// TODO: Implement. Currently hardcoding one test system
function getHealthSystemsList(accessToken, callback) {

    let id = 4706;
    let name = 'EPIC Medical Center (demo)';
    let url = `${ROOT_QUICK_CONNECT_URL}/connect/${id}?access_token=${accessToken}`;

    // For now, just hitting the endpoint to see whether or not the user has access...
    request.get(url, (error, response, body) => {
        try {
            bodyJson = JSON.parse(body)
        } catch (error) {
            // For now, assuming that if it cannot be parsed as JSON it is proper HTML...
            bodyJson = {}
        }

        if (bodyJson.success === false) {
            // Hardcoding error message for now..
            callback({
                error: 'invalid_token'
            })
        } else {
            callback({
                'systems': [{
                    'name': name,
                    'url': url
                }]
            });
        }
    });
}

// Get all patient data
// TODO: Fix. Currently hardcoding sample data
function getPatientData(accessToken, patientId, callback) {

    // TODO: Return all health systems by querying https://api.1up.health/connect/system/clinical
    // For now, hardcoding the Epic test system

    let url = `${ROOT_API_URL}/fhir/dstu2/Patient/${patientId}/$everything`
    let options = {
        url: url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };

    // Commenting out code and returning some dummy JSON for now...

    /* request.get(options, (error, response, body) => {
         if (error) {
             console.log('Error getting patient data in getPatientData: ', error)
         } else {

             try{
                 let bodyJson = JSON.parse(body);
                 callback(bodyJson.entry)
             } catch (error){
                 console.log("Error parsing JSON body in getPatientData: ", error)
             }
         }

     });*/
    callback({
        'entries': {
            'test': 'value',
            'test2': {
                'nested': {
                    'nested2': 'hi'
                }
            }
        }
    })
}

// Get list of accessible patients
function getPatientList(accessToken, callback) {

    // TODO: Don't hardcode API version
    let url = `${ROOT_API_URL}/fhir/dstu2/Patient`
    let options = {
        url: url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };
    request.get(options, (error, response, body) => {
        if (error) {
            console.log('Error getting patient data in getPatientList: ', error)
        } else {
            try {
                let bodyJson = JSON.parse(body);
                callback(['test'])
            } catch (error) {
                console.log("Error parsing JSON body in getPatientList: ", error)
            }
        }
    });
}

exports.getOrCreateUser = getOrCreateUser;
exports.getHealthSystemsList = getHealthSystemsList;
exports.getPatientData = getPatientData;
exports.getPatientList = getPatientList;
