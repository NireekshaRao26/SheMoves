const roadmapSteps = require('../data/roadmapSteps.json');

const normalizeUserData = (userData = {}) => ({
    name: userData.name || null,
    gender: userData.gender || null,
    dateOfBirth: userData.dateOfBirth ?? (userData.dob || null),
    aadhaarNumber: userData.aadhaarNumber ?? (userData.aadhaarNo ?? (userData.aadhaar || null)),
    panNumber: userData.panNumber ?? (userData.pan || null),
});

const normalizeQuestionnaire = (questionnaire = {}) => ({
    addressChange: Boolean(questionnaire.addressChange ?? questionnaire.updatingAddress),
    nameChange: Boolean(questionnaire.nameChange ?? questionnaire.changingSurname),
    movedCity: Boolean(questionnaire.movedCity ?? questionnaire.changingCity),
    bankUpdate: Boolean(questionnaire.bankUpdate),
    documentsAvailable: Array.isArray(questionnaire.documentsAvailable) ? questionnaire.documentsAvailable : [],
});


const generateRoadmap = async (userData = {}, questionnaire = {}) => {
    const normalizedQuestionnaire = normalizeQuestionnaire(questionnaire);
    const docs = normalizedQuestionnaire.documentsAvailable || [];
    const hasDoc = (docName) => docs.length === 0 || docs.includes(docName);
    
    let items = [];
    let stepCount = 1;

    // Address Change Logic
    if (normalizedQuestionnaire.addressChange || normalizedQuestionnaire.movedCity) {
        // Rent agreement is always first if address changes
        items.push({ ...roadmapSteps.addressChange.rentAgreement, step: stepCount++ });
        
        if (hasDoc('Aadhaar')) items.push({ ...roadmapSteps.addressChange.aadhaar, step: stepCount++ });
        if (hasDoc('PAN')) items.push({ ...roadmapSteps.addressChange.pan, step: stepCount++ });
        if (hasDoc('Passport')) items.push({ ...roadmapSteps.addressChange.passport, step: stepCount++ });
        if (hasDoc('Voter ID')) items.push({ ...roadmapSteps.addressChange.voterId, step: stepCount++ });
        if (hasDoc('Driving Licence')) items.push({ ...roadmapSteps.addressChange.drivingLicence, step: stepCount++ });
    }

    // Name Change Logic
    if (normalizedQuestionnaire.nameChange) {
        // Legal prerequisites
        items.push({ ...roadmapSteps.nameChange.affidavit, step: stepCount++ });
        items.push({ ...roadmapSteps.nameChange.newspaper, step: stepCount++ });
        items.push({ ...roadmapSteps.nameChange.gazette, step: stepCount++ });

        if (hasDoc('Aadhaar')) items.push({ ...roadmapSteps.nameChange.aadhaar, step: stepCount++ });
        if (hasDoc('PAN')) items.push({ ...roadmapSteps.nameChange.pan, step: stepCount++ });
        
        // Only include bank if they specifically asked for it or we're doing a full update
        if (hasDoc('Bank Account') || normalizedQuestionnaire.bankUpdate) {
            items.push({ ...roadmapSteps.nameChange.bank, step: stepCount++ });
        }
    }

    // Default Fallback
    if (items.length === 0) {
        items.push({ ...roadmapSteps.default.review, step: stepCount++ });
    }

    // Format output to match previous structure
    return items.map((item) => ({
        step: item.step,
        task: item.task,
        description: `- ${item.description}`, // Formatting as bullet point for frontend
        link: item.link || 'https://www.google.com',
    }));
};

module.exports = {
    generateRoadmap,
    normalizeQuestionnaire,
    normalizeUserData,
};
