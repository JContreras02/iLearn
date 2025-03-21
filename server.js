require('dotenv').config();
const express = require('express');
const path = require('path');
const app = require('./src/app'); // Import Express App

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
