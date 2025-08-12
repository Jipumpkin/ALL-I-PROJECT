const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || '192.168.1.96',
    user: process.env.DB_USER || 'alli_admin',
    password: process.env.DB_PASSWORD || '250801',
    database: process.env.DB_NAME || 'all_core',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;