const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // CHANGE THIS TO YOUR ACTUAL MONGODB ATLAS CONNECTION STRING
        const conn = await mongoose.connect('mongodb+srv://das743383_db_user:LOggRc8nC51SybM0@cluster0.dsxak6t.mongodb.net/profile_search?retryWrites=true&w=majority&appName=Cluster0');
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;