// 최상단에 공통으로 추가
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });


require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_,res)=>res.json({ok:true}));

app.use('/', require('./routes/animals'));
require('./jobs/cron');

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`API on http://localhost:${PORT}`));