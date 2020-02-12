const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const app = express();
const port = process.env.PORT || 5000;

// Storing environment variables in .env file
dotenv.config({
    path: __dirname + '/../.env'
})

let User = require('./models/user.model');
const controllers = require('./controllers.js')

// Setting up Mongoose connection and models for storing user data
// TODO: Can get rid of this as we are currently storing auth data in cookies

const MONGO_DB_URI = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
mongoose.connect(MONGO_DB_URI, {
    useNewUrlParser: true,
    useCreateIndex: true
});
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
})


// Configure cors such that our endpoints can:
// 1. Be accessed from our ReactJs frontend
// 2. Receive cookies in requests sent from ReactJs frontend
const corsOptions = {
    origin: `http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}`,
    methods: "GET,HEAD,POST,PATCH,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: "Content-Type, Authorization, X-Requested-With",
}

app.use(express.json());
app.use(cookieParser());
app.options('*', cors(corsOptions))

// TODO: FATAL FLAW - no password sign in. Because we are currently storing tokens in DB,
// any use can access tokens of another user by entering their email
// Either remove DB and exclusively use cookies, or add password sign in
app.post('/login', cors(corsOptions), (req, res) => {


    controllers.getOrCreateUser(req.body.email, userObj => {

        res.header('Content-Type', 'application/json;charset=UTF-8')
        res.header('Access-Control-Allow-Credentials', true)
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')

        //TODO: Handle undefined userObj

        // Store user details/tokens in cookies
        // NOTE: refreshToken is encrypted with symmetric key
        cookieParams = {
            maxAge: 2 * 60 * 60 * 1000
        }

        res.cookie('email', userObj.userEmail, cookieParams);
        res.cookie('oneupId', userObj.userId, cookieParams);
        res.cookie('accessToken', userObj.accessToken, cookieParams);
        res.cookie('refreshToken', userObj.refreshToken, cookieParams);

        res.sendStatus(200);
        return;

    });
});

// List all health systems available
// TODO: Currently hardcoding the Epic system only
app.get('/listHealthSystems', cors(corsOptions), (req, res) => {

    if (req.cookies.accessToken === undefined || req.cookies.accessToken.length === 0) {
        res.sendStatus(401)
    } else {
        controllers.getHealthSystemsList(req.cookies['accessToken'], data => {
            if (data.error === 'invalid_token') {
                res.sendStatus(401)
            }else {
              res.json(data)
            }
        });
    }
});

// List all patients where data is accessible
app.get('/listPatients', cors(corsOptions), (req, res) => {
    if (req.cookies.accessToken === undefined || req.cookies.accessToken.length === 0) {
        res.sendStatus(401)
    } else {
        // TODO: What if another application wants to access data from this endpoint?
        // Is it good practice to use cookies / should we also check headers for bearer token?
        controllers.getPatientList(req.cookies['accessToken'], data => {
            if (data.error === 'invalid_token') {
                res.sendStatus(401)
            }else if (data.total === 0) {
                res.sendStatus(404)
            } else {

                // Temporarily commenting out code for parsing patients data, as
                // currently cannot retrieve data
                /*let patientIds = []
                for (var i = 0, len = data.total; i < len; i++){
                    patientIds.push(data.entry[i].resource.id);
                }*/

                // For now, this will return some dummy data
                res.json(data)
            }
        });
    }
});

// TODO: Handle pagination
// Get all data for a specified patient
app.get('/getPatientData', cors(corsOptions), (req, res) => {
    if (req.cookies.accessToken === undefined || req.cookies.accessToken.length === 0) {
        res.sendStatus(401)
    } else {
        controllers.getPatientData(req.cookies['accessToken'], req.query.patientId, data => {
            if (data.error === 'invalid_token') {
                res.sendStatus(401)
            }
            if (data.total === 0) {
                res.sendStatus(404)
            } else {
                // For now, this will return some dummy data
                res.json(data)
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});
