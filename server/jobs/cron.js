require('dotenv').config();
const cron = require('node-cron');
const { syncRecentMonth } = require('../services/animalSync');

cron.schedule('0 12 * * *', async () => {
  try {
    await syncRecentMonth();
  } catch (e) {
    console.error('[cron] sync error:', e.message);
  }
}, { timezone: 'Asia/Seoul' });

console.log('cron registered: 0 12 * * * (Asia/Seoul)');