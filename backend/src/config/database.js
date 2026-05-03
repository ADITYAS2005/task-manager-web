const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info(`MongoDB connected: ${conn.connection.host}`);

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting reconnect...');
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB error: ${err.message}`);
      });

      return conn;
    } catch (error) {
      retries++;
      logger.error(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      if (retries === maxRetries) {
        logger.error('Max retries reached. Exiting process.');
        process.exit(1);
      }
      await new Promise((res) => setTimeout(res, 3000 * retries));
    }
  }
};

module.exports = connectDB;
