import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/index.js';

// configuring dotenv
dotenv.config({
    path: './.env',
});

// initializing express application
const PORT = process.env.PORT || 3000;

connectDB()
    .then(() => {
        console.log(`Mongodb is perfectly connected`);
    })
    .catch((err) => {
        console.error('Failed to connect to the database:', err);
        process.exit(1);
    });

//app listener
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});