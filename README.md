# 1UpHealth Coding Challenge - kshah96

Description: User interface and backend for fetching FHIR patient data using 1UpHealth APIs, and sample datasets.

## Project Structure
```
1uphealth-coding-challenge/
├── README.md
├── backend
│   ├── controllers.js
│   ├── models
│   │   └── user.model.js
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── utils.js
├── package-lock.json
├── package.json
└── src
    ├── App.css
    ├── App.js
    ├── components
    │   ├── hslist.component.js
    │   ├── login.component.js
    │   └── patientdata.component.js
    ├── index.css
    ├── index.js
    └── logo.svg
```

## Configuration

Currently, no separate environments have been configured. That is, this is an in-progress application that is only meant to be run for development/testing purposes. 

#### Environment Variables

Most configurable parameters are passed to the backend and frontend applications using environment variables. The simplest way to set up the server for development/testing is to create an `.env` file in the top-level directory with the following parameters set:

| Variable Name       | Description                                |
|---------------------|--------------------------------------------|
| REACT_APP_HOST      | Host of frontend app                       |
| REACT_APP_PORT      | Port of frontend app                       |
| REACT_APP_NODE_PORT | Port of backend app                        |
| DB_HOST             | Host of MongoDB instance                   |
| DB_PORT             | Port of MongoDB instance                   |
| DB_NAME             | Name of MongoDB database                   |
| OUH_CLIENT_ID       | 1UpHealth Client ID                        |
| OUH_CLIENT_SECRET   | 1UpHealth Client Secret                    |
| ENCRYPTION_PASSWORD | 32-character password for token encryption |

Notes:
* Including variables in React requires they be prefixed with `REACT_APP`
* `HOST` and `PORT` variables may be shared across frontend and backend (i.e. it is assumed both servers are running on the same machine) for development purposes

#### Database

The backend must be connected to a MongoDB database for storage of User data. DB Schema:

| Field               | Value                                             |
|---------------------|---------------------------------------------------|
| _id                 | Automatically generated unique ID                 |
| userEmail           | User email address                                |
| accessToken         | Last fetched access token                         |
| refreshToken        | Last fetched refresh token (should be encrypted!) |
| expirationTimestamp | Timestamp for accessToken expiration              |
| createdAt           | Timestamp for user creation                       |
| updatedAt           | Timestamp for user update                         |

Note: This is not technically required, as User data is also stored in cookies. This feature can be made optional or removed in a future iterration. 

#### Running 

To run the frontend ReactJs app: 

```
cd ROOT_DIR/1uphealth-coding-challenge
npm install
npm start
```

To run the backend NodeJs server:
```
cd ROOT_DIR/1uphealth-coding-challenge/backend
npm install
npm start
```

## Features

#### Login-with-email

Upon connecting to the web app, a user will:
* Be prompted to enter an email
* Either have tokens and information pulled from DB if it exists, or have it created and entered into DB
* Fetched or created tokens and info stored in cookies with 2 hour TTL
* Redirected to list of health systems

Notes:
* `refreshToken` is encrypted before stored in DB and cookie
* If a user becomes unauthorized while accessing any resource, they will be redirected to the login page
* Expiration time of `refreshToken` is also stored in DB, and token is refreshed upon login if needed

Bugs/Future Improvements:
* This is an inherently flawed approach because password authentication has not yet been added, so anyone can log in as any user
* Eliminate requirement for MongoDB, as credentials are stored in cookies anyways
* Add feature to re-generate access token if refresh token becomes invalid
* Consider other approaches for encrypting sensitive data (e.g. storing encryption password on another machine, or in DB itself)

#### Listing health systems
 
Upon logging in:
* A list of links to health systems will be rendered

Bugs/Future Improvements:
* Currently only the Epic test system has been hardcoded for development purposes
* Sometimes takes a long time to load-- should include loading bar

#### Logging in through health system

Upon clicking a health system link:
* User will be redirected to health system login
* After succesful login, user will be redirected back to patient data interface

Bugs/Future Improvements:
* For some reason, using valid access tokens, data access is not being granted as of 2/12/2020. This is to be debugged and resolved.

#### Accesing patient data

Upon being successfully redirected:
* User will be directed to a page with a dropdown to select from a list of patient IDs they have data access to
* Upon selecting a patient ID, interactive JSON will appear using the `react-json-view` module

Bugs/Future Improvements:
* As of 2/12/2020, there is a bug with connecting to the Epic health system, hence some sample data is shown
* Instead of listing patient IDs, list patient names
* Create a custom solution for displaying data in a more user-friendly format (e.g. interactive tables)

## Coding Considerations and Future Improvements

* Better separate out model-view-controller logic
  * Currently, controller and model logic is combined
  * Controller logic is very messy, and should be better compartmentalized
  * Controller logic should be better generalized for accesing any FHIR resources
* Better handle loading of environment variables, and configuration
  * Possibly use configuration files
  * Remove hardcoding of API versions, network protocols, etc.
* Create separate environments (e.g. `prod` and `dev`) for running frontend and backend applications
* Create more utility functions to help improve code readability
