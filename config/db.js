import mongoose from 'mongoose';
import dns from 'dns';

// Fix for DNS resolution issues with MongoDB Atlas SRV records
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (error) {
    // Ignore error if it happens in some environments
}
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`\x1b[90m> \x1b[32mDB     \x1b[90m.... \x1b[97mCONNECTED [${conn.connection.host}]\x1b[0m`);
    } catch (error) {
        console.error(`\x1b[31m[ FATAL ERROR ] \x1b[0m MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
