const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        dob: { type: String, default: '' },
        gender: { type: String, default: '' },
        address: { type: String, default: '' },
        fatherName: { type: String, default: '' },
        aadhaarNumber: { type: String, default: '' },
        panNumber: { type: String, default: '' }
    },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
