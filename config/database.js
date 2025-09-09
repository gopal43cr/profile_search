const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });

const connectDB = async () => {
    try {
        // CHANGE THIS TO YOUR ACTUAL MONGODB ATLAS CONNECTION STRING
        const conn = await mongoose.connect(process.env.DATABSE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;