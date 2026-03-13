const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-2.0-flash';

const cleanText = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
};

const normalizeUserData = (userData = {}) => ({
    name: cleanText(userData.name),
    gender: cleanText(userData.gender),
    dateOfBirth: cleanText(userData.dateOfBirth ?? userData.dob),
    aadhaarNumber: cleanText(userData.aadhaarNumber ?? userData.aadhaarNo ?? userData.aadhaar),
    panNumber: cleanText(userData.panNumber ?? userData.pan),
});

const normalizeQuestionnaire = (questionnaire = {}) => ({
    addressChange: Boolean(questionnaire.addressChange ?? questionnaire.updatingAddress),
    nameChange: Boolean(questionnaire.nameChange ?? questionnaire.changingSurname),
    movedCity: Boolean(questionnaire.movedCity ?? questionnaire.changingCity),
    bankUpdate: Boolean(questionnaire.bankUpdate),
});

const buildPrompt = (userData, questionnaire) => `
You are generating a personalized relocation document update roadmap for an Indian resident.

User data:
${JSON.stringify(userData, null, 2)}

Questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Instructions:
- Return ONLY valid JSON.
- Return a JSON array.
- Each array item must contain exactly these fields:
  - "step": number
  - "task": string
  - "description": string
  - "link": string
- Choose only tasks that are relevant to the questionnaire answers.
- Focus on practical relocation-related updates such as Aadhaar, PAN, Passport, Bank KYC, voter ID, driving licence, or other important records when applicable.
- Use official or widely used government/banking portal links when possible.
- Keep descriptions concise and action-oriented.
- Number steps sequentially starting from 1.
- If no updates are needed, return an empty JSON array.
- Do not include markdown, code fences, comments, or extra text.
`;

const extractJson = (text) => {
    const trimmed = text.trim();

    if (!trimmed) {
        throw new Error('Gemini returned an empty response');
    }

    const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeFenceMatch) {
        return codeFenceMatch[1].trim();
    }

    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');

    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
        return trimmed.slice(arrayStart, arrayEnd + 1);
    }

    return trimmed;
};

const validateRoadmap = (roadmap) => {
    if (!Array.isArray(roadmap)) {
        throw new Error('Gemini response is not a JSON array');
    }

    return roadmap.map((item, index) => ({
        step: Number(item.step) || index + 1,
        task: cleanText(item.task) || `Step ${index + 1}`,
        description: cleanText(item.description) || 'Complete the required update for this relocation step.',
        link: cleanText(item.link) || 'https://www.google.com',
    }));
};

// Static fallback used when Gemini is unavailable (rate-limited, quota exceeded, etc.)
const staticFallbackRoadmap = (questionnaire) => {
    const items = [];
    let step = 1;

    if (questionnaire.addressChange || questionnaire.movedCity) {
        items.push({
            step: step++,
            task: 'Update Aadhaar Address',
            description: 'Update your residential address on Aadhaar through the UIDAI self-service portal.',
            link: 'https://myaadhaar.uidai.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update PAN Address',
            description: 'Correct address details on PAN card via the NSDL online portal.',
            link: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
        });
        items.push({
            step: step++,
            task: 'Update Passport Address',
            description: 'Re-issue your passport with updated address through the Passport Seva portal.',
            link: 'https://portal2.passportindia.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update Voter ID Address',
            description: 'Submit Form 8A on the National Voters\' Service Portal to update your address.',
            link: 'https://voters.eci.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update Driving Licence Address',
            description: 'Update your address on Driving Licence through the Parivahan portal.',
            link: 'https://parivahan.gov.in',
        });
    }

    if (questionnaire.bankUpdate || questionnaire.movedCity || questionnaire.addressChange) {
        items.push({
            step: step++,
            task: 'Update Bank KYC',
            description: 'Submit updated address proof and Aadhaar to your bank branch or net banking portal for KYC re-verification.',
            link: 'https://www.rbi.org.in',
        });
    }

    if (questionnaire.nameChange) {
        items.push({
            step: step++,
            task: 'Update Aadhaar Name',
            description: 'Update your name on Aadhaar at the nearest Aadhaar Enrolment Centre with supporting documents.',
            link: 'https://myaadhaar.uidai.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update PAN Name',
            description: 'Submit a PAN correction request via NSDL with your name change document.',
            link: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
        });
    }

    if (items.length === 0) {
        items.push({
            step: 1,
            task: 'Review Documents',
            description: 'No specific updates detected. Review all your identity documents to ensure details are current.',
            link: 'https://myaadhaar.uidai.gov.in',
        });
    }

    return items;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (model, prompt, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            const is429 = err.message && err.message.includes('429');
            if (is429 && attempt < maxRetries) {
                const waitMs = attempt * 8000; // 8s, 16s, 24s
                console.warn(`Gemini rate-limited (429). Retrying in ${waitMs / 1000}s (attempt ${attempt}/${maxRetries})`);
                await sleep(waitMs);
            } else {
                throw err;
            }
        }
    }
};

const generateRoadmap = async (userData = {}, questionnaire = {}) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const normalizedUserData = normalizeUserData(userData);
    const normalizedQuestionnaire = normalizeQuestionnaire(questionnaire);

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
            },
        });

        const rawText = await callGeminiWithRetry(model, buildPrompt(normalizedUserData, normalizedQuestionnaire));
        const parsed = JSON.parse(extractJson(rawText));
        return validateRoadmap(parsed);
    } catch (err) {
        const isRateLimit = err.message && (err.message.includes('429') || err.message.includes('quota'));
        if (isRateLimit) {
            console.warn('Gemini quota exhausted — using static fallback roadmap.');
            return staticFallbackRoadmap(normalizedQuestionnaire);
        }
        throw err;
    }
};

module.exports = {
    GEMINI_MODEL,
    generateRoadmap,
    normalizeQuestionnaire,
    normalizeUserData,
};