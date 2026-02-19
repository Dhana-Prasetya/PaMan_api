const { PrismaClient, gender_enum } = require("@prisma/client");
const commonHelper = require("../helper/common.js");
const prisma = new PrismaClient();
const { google } = require("googleapis");
const { USER_CONSTRAINT } = require("../config/inputConstraint.js");
const capitalizeFirstLetter = require("../helper/capitalizeFirstLetter.js");
const { v4: uuidv4 } = require("uuid"); // For generating unique token identifiers
const { generateToken } = require("../helper/auth.js");
const { auth } = require("googleapis/build/src/apis/abusiveexperiencereport/index.js");

const oauth2Client = new google.auth.OAuth2( // Create an OAuth2 client with the given credentials
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
)

const scopes = [ // Define the scopes for the Google API access
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]

const authorizationUrl = oauth2Client.generateAuthUrl({ // Generate the URL for Google's OAuth 2.0 server to initiate the authentication process
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true,
})

module.exports = {authorizationUrl} // Export the authorization URL and OAuth2 client for use in the controller

const googleController = {
    Authentication: async (req, res) => { // Handle the initial authentication request and redirect the user to Google's OAuth 2.0 server
        try {
            res.redirect(authorizationUrl); // Redirect the user to the Google authentication page
        } catch (error) {
            console.error(`\n${error}\n`);
            return commonHelper.response(res, null, 500, "Internal server error");
        }
    },

    Callback: async (req, res, next) => { // Handle the callback from Google after authentication
        try{
            const { code } =  req.query // Get the authorization code from the query parameters
            const {tokens} = await oauth2Client.getToken(code) // Exchange the authorization code for an access token

            oauth2Client.setCredentials(tokens) // Set the credentials for the OAuth2 client

            const oauth2 = google.oauth2({ // Create an instance of the Google OAuth2 API client
                auth: oauth2Client,
                version: 'v2'
            })

            const data = await oauth2.userinfo.get() // Retrieve the user's profile information using the access token

            if(!data){ // Check if the user data exist in google
                return commonHelper.response(res, null, 400, "User email are not found");
            }

            let queryResult = await prisma.users.findUnique({
                where:{
                    email: data.data.email
                },
                select:{
                    id: true,
                    email: true,
                    role: true
                }
            })

            if(!queryResult){ // If the user does not exist in the database, create a new user record

                let username = data.data.given_name.toLowerCase(); // Normalize username to lowercase
                username = capitalizeFirstLetter(username); // Capitalize first letter of username

                let isUnique = false; // Must be outside the loop
                let finalUsername = username; // To avoid mutating the original input

                do {
                    // Loop until a unique username is found
                    const num = Math.floor(Math.random() * 100);
                    const formatted = String(num).padStart(2, "0");

                    // Combine the base username and the random number
                    const currentAttempt = (data.data.given_name + formatted).slice(
                        0,
                        USER_CONSTRAINT.MAX_USERNAME_LENGTH
                    );

                    const usernameExists = await prisma.users.findUnique({
                        where: { username: currentAttempt },
                        relationLoadStrategy: "join",
                    });

                    if (!usernameExists) {
                        finalUsername = currentAttempt;
                        isUnique = true;
                    }
                } while (!isUnique);

                queryResult = await prisma.users.create({
                    data:{
                        email: data.data.email,
                        full_name: data.data.name,
                        role: USER_CONSTRAINT.USER_ROLE,
                        phone_number: "01234567890",
                        gender: data.data.gender,
                        username: finalUsername,
                        avatar_url: USER_CONSTRAINT.DEFAULT_USER_AVATAR_URL, // Default avatar URL
                        gender: 'Rahasia' // Default value
                    }, select:{ // Select only the necessary fields for the response and token payload
                        id: true,
                        email: true,
                        role: true,
                        avatar_url: true,
                        username: true
                    }
                })

                const payload = {
                    // Make payload for JWT; include user id so middleware/controllers can authorize
                    id: queryResult.id,
                    email: queryResult.email,
                    role: queryResult.role,
                    jti: uuidv4(), // Unique identifier for the token
			    };

                queryResult.token = generateToken(payload); // Create token and add to queryResult object


                return commonHelper.response(res, queryResult, 201, "User registered and logged in successfully with google account");

            } else { // If the user already exists, generate a JWT token for authentication
                
                const payload = {
                    // Make payload for JWT; include user id so middleware/controllers can authorize
                    id: queryResult.id,
                    email: queryResult.email,
                    role: queryResult.role,
                    jti: uuidv4(), // Unique identifier for the token
			    };

                queryResult.token = generateToken(payload); // Create token and add to queryResult object

                return commonHelper.response(res, queryResult, 201, "Login success with google account");
            }
        }
        catch (error) {
            console.error(`\n${error}\n`);
            return commonHelper.response(res, null, 500, "Internal server error");
        }
    }
};

module.exports = googleController;
