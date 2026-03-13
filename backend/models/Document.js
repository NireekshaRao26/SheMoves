const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    documentType: { type: String, required: true },
    fileUrl: { type: String, required: true },
    extractedData: {
        name: String,
        address: String,
        dob: String,
        documentNumber: String,
        gender: String,
        fatherName: String,
        rawText: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
