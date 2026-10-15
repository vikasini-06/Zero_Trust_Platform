const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zerotrust';
  const sanitizedURI = mongoURI.replace(/:([^:@]+)@/, ':****@');

  try {
    // Attempt standard connection with 10s timeout for cloud databases like MongoDB Atlas
    console.log(`[ZeroTrust DB] Attempting connection to MongoDB at: ${sanitizedURI}`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[ZeroTrust DB] Connected successfully to primary MongoDB at ${sanitizedURI}`);
  } catch (err) {
    if (process.env.NODE_ENV === 'production' && (process.env.MONGODB_URI || process.env.MONGO_URI)) {
      console.error(`[ZeroTrust DB] Critical: Production MongoDB Atlas connection failed (${err.message}).`);
      throw err;
    }

    console.warn(`[ZeroTrust DB] Primary MongoDB connection failed (${err.message}). Starting MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'zerotrust',
        },
      });
      const uri = mongodInstance.getUri();
      console.log(`[ZeroTrust DB] MongoMemoryServer spun up at: ${uri}`);
      await mongoose.connect(uri);
      console.log(`[ZeroTrust DB] In-Memory MongoDB connected successfully!`);
    } catch (memErr) {
      console.error('[ZeroTrust DB] Critical: Failed to start both primary and fallback MongoDB instances:', memErr);
      process.exit(1);
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`[ZeroTrust DB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[ZeroTrust DB] MongoDB disconnected');
  });
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, disconnectDB };
