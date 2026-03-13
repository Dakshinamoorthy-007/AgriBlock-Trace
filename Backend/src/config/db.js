import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🗄️ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('🔁 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
