import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Configure environment variables
dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
    const divider = '\x1b[92m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m';
    console.log('\n\x1b[92m    ██████╗  █████╗ ██╗   ██╗██████╗  █████╗ ███╗   ██╗██████╗ \x1b[0m');
    console.log('\x1b[92m   ██╔════╝ ██╔══██╗██║   ██║██╔══██╗██╔══██╗████╗  ██║██╔════╝ \x1b[0m');
    console.log('\x1b[92m   ██║  ███╗███████║██║   ██║██████╔╝███████║██╔██╗ ██║██║  ███╗\x1b[0m');
    console.log('\x1b[92m   ██║   ██║██╔══██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║██║   ██║\x1b[0m');
    console.log('\x1b[92m   ╚██████╔╝██║  ██║╚██████╔╝██║  ██║██║  ██║██║ ╚████║╚██████╔╝\x1b[0m');
    console.log('\x1b[92m    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ \x1b[0m');
    console.log('\x1b[90m                 [ P A T E L   N E T W O R K S ]\x1b[0m\n');
    
    console.log(divider);
    console.log(`\x1b[1m\x1b[92m[ SYSTEM ONLINE ]\x1b[0m`);
    console.log(`\x1b[90m> \x1b[32mADMIN  \x1b[90m.... \x1b[97mGAURANG PATEL (ROOT)\x1b[0m`);
    console.log(`\x1b[90m> \x1b[32mTARGET \x1b[90m.... \x1b[97mCORE SERVER\x1b[0m`);
    console.log(`\x1b[90m> \x1b[32mPORT   \x1b[90m.... \x1b[97m${PORT}\x1b[0m`);
    console.log(`\x1b[90m> \x1b[32mMODE   \x1b[90m.... \x1b[97m${(process.env.NODE_ENV || 'DEVELOPMENT').toUpperCase()}\x1b[0m`);
    console.log(divider);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});
