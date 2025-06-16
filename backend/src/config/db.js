const mongoose = require('mongoose');
const colors = require('colors');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Remove the following options as they are no longer needed in Mongoose 6+
      // useCreateIndex: true,
      // useFindAndModify: false,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold);
  } catch (error) {
    console.error(`Error: ${error.message}`.red.bold);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB'.green.bold);
});

mongoose.connection.on('error', (err) => {
  console.error(`Mongoose connection error: ${err}`.red.bold);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected'.yellow.bold);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination'.yellow.bold);
  process.exit(0);
});

module.exports = connectDB;
