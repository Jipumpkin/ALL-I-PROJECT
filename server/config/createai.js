const createai = require('createai');
require('dotenv').config();


const createai = new createai({
    apiKey: process.env.CREATEAI_AI_KEY,
});

module.exports = createai ; 