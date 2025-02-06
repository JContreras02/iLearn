const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load env variables with debug info
const envPath = path.resolve(__dirname, '.env');
console.log('Looking for .env file at:', envPath);

const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('.env file loaded successfully');
}

// Print actual environment content
console.log('Process env keys:', Object.keys(process.env));

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/config', (req, res) => {
    const config = {
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.FIREBASE_APP_ID
    };

    console.log('Config requested, values:', config);

    if (!config.apiKey || !config.authDomain) {
        return res.status(500).json({ 
            error: 'Firebase configuration is missing',
            configStatus: {
                apiKey: !!config.apiKey,
                authDomain: !!config.authDomain,
                projectId: !!config.projectId,
                storageBucket: !!config.storageBucket,
                messagingSenderId: !!config.messagingSenderId,
                appId: !!config.appId
            }
        });
    }

    res.json(config);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});