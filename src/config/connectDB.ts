import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    console.log('Attempting to connect to DB...');
    try {
        await mongoose.connect(process.env.MONGODB_URL as string, {
            maxPoolSize: 100
        })
    }
    catch (error) {
        console.log("error form connectDB", error)
        process.exit(1); 
    }
}

export default connectDB
