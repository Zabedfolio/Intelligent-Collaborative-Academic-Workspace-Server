const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      throw new Error('MONGODB_URI environment variable is not defined.');
    }

    const conn = await mongoose.connect(connUri, {
      dbName: process.env.MONGODB_DB_NAME || 'icaw-db'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Non-fatal exit in development, allows server to retry
    return null;
  }
};

module.exports = connectDB;

