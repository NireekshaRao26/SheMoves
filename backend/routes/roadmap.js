const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Roadmap = require('../models/Roadmap');
const { generateRoadmap, normalizeQuestionnaire, normalizeUserData } = require('../services/roadmapService');

const router = express.Router();

const getRequiredDocuments = (task, questionnaire) => {
    const normalizedTask = String(task || '').toLowerCase();
    const documents = new Set();

    if (normalizedTask.includes('aadhaar')) {
        documents.add('Aadhaar');
        if (questionnaire.addressChange || questionnaire.movedCity) {
            documents.add('Address Proof');
        }
        if (questionnaire.nameChange) {
            documents.add('Name Change Proof');
        }
    }

    if (normalizedTask.includes('pan')) {
        documents.add('PAN');
        if (questionnaire.addressChange || questionnaire.movedCity) {
            documents.add('Aadhaar');
            documents.add('Address Proof');
        }
        if (questionnaire.nameChange) {
            documents.add('Name Change Proof');
        }
    }

    if (normalizedTask.includes('passport')) {
        documents.add('Passport');
        if (questionnaire.addressChange || questionnaire.movedCity) {
            documents.add('Address Proof');
        }
        if (questionnaire.nameChange) {
            documents.add('Name Change Proof');
        }
    }

    if (normalizedTask.includes('bank')) {
        documents.add('Aadhaar');
        documents.add('PAN');
        if (questionnaire.addressChange || questionnaire.movedCity) {
            documents.add('Address Proof');
        }
    }

    if (documents.size === 0) {
        documents.add('Supporting ID Proof');
    }

    return Array.from(documents);
};

const buildChecklist = (roadmapItems, questionnaire) => roadmapItems.map((item, index) => ({
    step: Number(item.step) || index + 1,
    serviceName: item.task,
    description: item.description,
    requiredDocuments: getRequiredDocuments(item.task, questionnaire),
    officialPortalLink: item.link,
    completed: false,
}));

// Generate Roadmap based on answers
router.post('/generate', authMiddleware, async (req, res) => {
    try {
        const rawUserData = req.body.userData || {};
        const rawQuestionnaire = req.body.questionnaire || req.body;

        const userData = normalizeUserData(rawUserData);
        const questionnaire = normalizeQuestionnaire(rawQuestionnaire);
        const roadmapItems = await generateRoadmap(userData, questionnaire);
        const checklist = buildChecklist(roadmapItems, questionnaire);

        const roadmap = new Roadmap({
            user: req.user.userId,
            userData,
            answers: {
                addressChange: questionnaire.addressChange,
                nameChange: questionnaire.nameChange,
                movedCity: questionnaire.movedCity,
                bankUpdate: questionnaire.bankUpdate,
                changingCity: questionnaire.movedCity,
                changingSurname: questionnaire.nameChange,
                updatingAddress: questionnaire.addressChange,
                documentsAvailable: req.body.documentsAvailable || [],
            },
            checklist,
        });

        await roadmap.save();

        res.status(201).json({
            message: 'Roadmap generated successfully',
            roadmap,
            generatedRoadmap: roadmapItems,
        });
    } catch (err) {
        console.error('Roadmap generation error:', err);
        res.status(500).json({
            message: 'Failed to generate roadmap',
            error: err.message,
        });
    }
});

// Get user's active roadmap
router.get('/', authMiddleware, async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ user: req.user.userId }).sort({ createdAt: -1 });
        if (!roadmap) {
            return res.status(404).json({ message: 'No roadmap found' });
        }
        res.json(roadmap);
    } catch (err) {
        res.status(500).json({ message: 'Server error retrieving roadmap' });
    }
});

// Update item completion status
router.put('/:roadmapId/item/:itemId', authMiddleware, async (req, res) => {
    try {
        const { completed } = req.body;
        const roadmap = await Roadmap.findOneAndUpdate(
            { _id: req.params.roadmapId, user: req.user.userId, 'checklist._id': req.params.itemId },
            { $set: { 'checklist.$.completed': completed } },
            { new: true }
        );

        if (!roadmap) {
            return res.status(404).json({ message: 'Item or roadmap not found' });
        }
        res.json(roadmap);
    } catch (err) {
        res.status(500).json({ message: 'Server error updating roadmap item' });
    }
});

module.exports = router;
