require('dotenv').config();

const express = require('express');
const path = require('path');
const menuRoutes = require('./routes/menuRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(menuRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});