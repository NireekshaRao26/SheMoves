const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userData: {
        name: String,
        gender: String,
        dateOfBirth: String,
        aadhaarNumber: String,
        panNumber: String,
    },
    answers: {
        addressChange: Boolean,
        nameChange: Boolean,
        movedCity: Boolean,
        bankUpdate: Boolean,
        changingCity: Boolean,
        changingSurname: Boolean,
        updatingAddress: Boolean,
        documentsAvailable: [String],
    },
    checklist: [{
        step: Number,
        serviceName: String,
        description: String,
        requiredDocuments: [String],
        officialPortalLink: String,
        completed: { type: Boolean, default: false }
    }],
    generatedBy: { type: String, default: 'local-rule-engine' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
