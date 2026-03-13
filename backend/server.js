const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const roadmapRoutes = require('./routes/roadmap');
const ocrRoutes = require('./routes/ocrRoutes');
const automationRoutes = require('./routes/automation');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/ocr', ocrRoutes);   // Mounts /api/ocr/extract
app.use('/api/automation', automationRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
