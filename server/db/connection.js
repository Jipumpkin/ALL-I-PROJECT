// server/db/connection.js

const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || '192.168.1.96',
    user: process.env.DB_USER || 'alli_admin',
    password: process.env.DB_PASSWORD || '250801',
    database: process.env.DB_NAME || 'alli_core',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;