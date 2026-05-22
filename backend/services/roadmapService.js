const roadmapSteps = require('../data/roadmapSteps.json');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
    
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

        const prompt = `
Act as a professional Indian government documentation and relocation assistant. 
Based on the following user data and questionnaire answers, generate a personalized, step-by-step roadmap for updating their official documents.

User Data:
${JSON.stringify(userData, null, 2)}

Questionnaire Answers:
${JSON.stringify(normalizedQuestionnaire, null, 2)}

Return the roadmap STRICTLY as a JSON array of objects.
Do not include markdown formatting like \`\`\`json or \`\`\` in the output, just the raw JSON array.
Each object in the array MUST have the following exact keys:
- "step": (Number) The sequential step number starting from 1.
- "task": (String) A short, clear title for the task (e.g., "Aadhaar Address Update").
- "description": (String) A detailed description of what needs to be done. IMPORTANT: It MUST start with "- " (a hyphen and a space).
- "link": (String) A relevant official Indian government portal URL for this task, or a Google search link if unknown.

Ensure logical ordering. For example, if address changes, Rent Agreement is usually first, followed by Aadhaar, PAN, Bank, etc.
If nothing changes based on inputs, provide a general "Review Documents" task.
`;
        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();
        
        // Remove markdown formatting if Gemini included it despite instructions
        if (responseText.startsWith('```json')) {
            responseText = responseText.replace(/^```json|```$/g, '').trim();
        } else if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```|```$/g, '').trim();
        }

        const items = JSON.parse(responseText);
        
        // Validate and ensure formatting
        return items.map((item, index) => ({
            step: item.step || index + 1,
            task: item.task || 'Document Update',
            description: item.description?.startsWith('- ') ? item.description : `- ${item.description || 'Update required document'}`,
            link: item.link || 'https://www.google.com',
        }));

    } catch (error) {
        console.error('Gemini API Error, falling back to local rule engine:', error.message);
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
    }
};

module.exports = {
    generateRoadmap,
    normalizeQuestionnaire,
    normalizeUserData,
};
