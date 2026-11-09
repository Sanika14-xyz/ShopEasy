const mongoose = require('mongoose');
const app = require('./app');

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopeasy';

async function start() {
  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`ShopEasy API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start ShopEasy API:', error);
  process.exitCode = 1;
});
