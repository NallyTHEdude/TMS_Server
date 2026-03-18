import app from './app.js';
import { config } from './config/index.js';
import connectDB from './db/index.js';

// initializing express application
const PORT = config.PORT;
const BASE_URL = config.BASE_URL;

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
    console.log(`Server is running at ${BASE_URL}:${PORT}`);
});