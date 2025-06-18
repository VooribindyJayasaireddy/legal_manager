const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing MongoDB connection');
    return;
  }

  try {
    mongoose.set('strictQuery', false);
    mongoose.set('debug', false);  // disable mongoose logs
    // mongoose.set('autoIndex', false);  // optional, turn off index creation logs

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline);
    isConnected = true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`.red);
    process.exit(1);
  }
};

module.exports = connectDB;
