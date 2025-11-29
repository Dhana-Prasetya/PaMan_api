const { Pool } = require('pg'); // Import the Pool class from the pg module

const pool = new Pool({ // Properties for connecting to the database
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DB_NAME,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT
});

module.exports = { pool }; // Export the pool instance for use in other modules