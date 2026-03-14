const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-2.0-flash';
const MAX_DESCRIPTION_BULLETS = 3;
const MAX_BULLET_WORDS = 14;

const cleanText = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim();
    return normalized || null;
};

const clampWords = (text, maxWords = MAX_BULLET_WORDS) => {
    const words = String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 0) {
        return null;
    }

    return words.slice(0, maxWords).join(' ');
};

const toBulletDescription = (value, fallbackText = 'Complete this document update using official portal instructions.') => {
    const baseText = cleanText(value) || fallbackText;

    const normalizedLines = baseText
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*\u2022]\s*/, '').trim())
        .filter(Boolean);

    const sentenceChunks = normalizedLines.length
        ? normalizedLines
        : baseText
              .split(/(?<=[.!?])\s+/)
              .map((line) => line.trim())
              .filter(Boolean);

    const bullets = sentenceChunks
        .map((line) => line.replace(/[.!?]+$/g, '').trim())
        .map((line) => clampWords(line))
        .filter(Boolean)
        .slice(0, MAX_DESCRIPTION_BULLETS);

    if (bullets.length === 0) {
        return `- ${fallbackText}`;
    }

    return bullets.map((line) => `- ${line}`).join('\n');
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
You are a relocation assistant helping an Indian resident update their documents after moving to a new city or making personal changes.

User data:
${JSON.stringify(userData, null, 2)}

Questionnaire answers:
${JSON.stringify(questionnaire, null, 2)}

Your task:
Generate a concise, personalized step-by-step document update roadmap.

Return ONLY a valid JSON array. Each item must have exactly these fields:
- "step": sequential number starting from 1
- "task": short title of the update (e.g. "Update Aadhaar Address")
- "description": 2-3 SHORT bullet points only, each max 8-14 words, using '-' prefix and newline separators
- "link": the exact official government or banking portal URL for this task

Rules:
- Only include steps relevant to the questionnaire answers.
- Cover Aadhaar, PAN, Passport, Voter ID, Driving Licence, Bank KYC, LPG address, and any other Indian documents relevant to the situation.
- Use real official portal links (myaadhaar.uidai.gov.in, onlineservices.nsdl.com, portal2.passportindia.gov.in, voters.eci.gov.in, parivahan.gov.in, mylpg.in, digilocker.gov.in etc.).
- Keep descriptions concise and practical for a non-technical user.
- Do not write paragraph descriptions.
- Number steps sequentially starting from 1.
- If no updates are needed, return an empty JSON array [].
- Do NOT include markdown, code fences, or any text outside the JSON array.
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
        description: toBulletDescription(item.description, 'Complete the required update for this relocation step.'),
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
            description:
                'Your Aadhaar card is the primary identity document in India and must always reflect your current residential address. ' +
                'Log in to the myAadhaar portal using your Aadhaar number and the OTP sent to your registered mobile number, then select "Update Address Online". ' +
                'Upload a valid address proof such as a recent utility bill, rent agreement, or bank passbook showing your new address. ' +
                'The update is processed within 7–10 working days and you can download the revised e-Aadhaar from the portal itself. ' +
                'If your mobile number is not registered, visit the nearest Aadhaar Enrolment Centre with original documents — the fee is ₹50.',
            link: 'https://myaadhaar.uidai.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update PAN Card Address',
            description:
                'Although the PAN card does not print an address, updating your address with the Income Tax Department ensures all official tax notices and correspondence reach your new location. ' +
                'Visit the NSDL PAN correction portal, fill Form 49A online, select "Changes or Correction in existing PAN data", and upload your updated Aadhaar as address proof. ' +
                'You can also link your PAN with your Aadhaar on the Income Tax e-Filing portal (https://www.incometax.gov.in) to keep both records consistent. ' +
                'The processing fee is approximately ₹107 for Indian addresses and the updated PAN card is dispatched within 15–20 working days.',
            link: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
        });
        items.push({
            step: step++,
            task: 'Update Passport Address',
            description:
                'An outdated address on your passport can cause complications at immigration checkpoints and during official identity verification. ' +
                'Register on the Passport Seva portal, click "Apply for Re-issue of Passport", select "Change in Address" as the reason, and book an appointment at the nearest Passport Seva Kendra (PSK) or Post Office PSK. ' +
                'Carry your current original passport, new address proof (Aadhaar or utility bill), and two passport-size photographs to the appointment. ' +
                'The fee is ₹1,500 for normal processing (up to 30 days) or ₹2,000 for Tatkaal processing (1–3 working days). ' +
                'Your updated passport booklet will be delivered to your new address via Speed Post.',
            link: 'https://portal2.passportindia.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update Voter ID (EPIC) Address',
            description:
                'Your Voter ID must show your current address so you are assigned to the correct polling booth and constituency after relocation. ' +
                'If you have moved within the same constituency, submit Form 8 (correction of entries) on the National Voters\' Service Portal. ' +
                'If you have moved to a new constituency, submit Form 6 (registration in new constituency) and request deletion from the old one via Form 7. ' +
                'Upload your updated Aadhaar or any valid current address proof and a recent passport-size photograph. ' +
                'This process is completely free and is handled by the Electoral Registration Officer (ERO) — allow up to 30 days for the update to reflect.',
            link: 'https://voters.eci.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update Driving Licence Address',
            description:
                'An outdated address on your Driving Licence can create issues during traffic inspections and vehicle re-registration in your new city. ' +
                'Log in to the Parivahan Sewa portal, navigate to "Driving Licence Services" → "DL Services" → "Change of Address", enter your new address, and upload your new address proof (Aadhaar, utility bill, or rent agreement). ' +
                'Pay the fee online (₹200–₹450 depending on your state) and submit the application through your respective State RTO. ' +
                'An updated DL card will be dispatched to your new address within 7–30 working days. ' +
                'You can track your application status at any time using the Parivahan portal.',
            link: 'https://parivahan.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update LPG Gas Connection Address',
            description:
                'Your LPG connection is linked to your previous address, and transferring it ensures uninterrupted subsidised cylinder supply at your new home. ' +
                'Contact your existing LPG distributor (Indane, HP Gas, or Bharat Gas) to initiate a transfer request — carry your new address proof, Aadhaar, and latest paid LPG bill. ' +
                'If there is no distributor tie-up nearby, surrender the existing connection and register a fresh one with a distributor in your new area. ' +
                'Visit the mylpg.in portal to update your address online or to locate your nearest distributor. ' +
                'A fresh connection requires a security deposit of ₹1,450–₹1,700 for the cylinder; transfers are generally free of charge.',
            link: 'https://www.mylpg.in',
        });
    }

    if (questionnaire.bankUpdate || questionnaire.movedCity || questionnaire.addressChange) {
        items.push({
            step: step++,
            task: 'Update Bank KYC and Address',
            description:
                'Banks are legally required under RBI guidelines to maintain updated KYC records, and an outdated address can lead to temporary account restrictions or transaction limits. ' +
                'Log in to your bank\'s net banking or mobile app and look for "Update Address" or "KYC Update" under Profile or Service Requests — many banks support Aadhaar OTP-based self-service address updates. ' +
                'If the online option is unavailable, visit your home branch with the original updated Aadhaar, one additional address proof (utility bill or rent agreement), and a self-attested photocopy of each. ' +
                'Repeat this update for every bank account you hold — savings, salary, fixed deposits, and joint accounts all need to be updated separately. ' +
                'Allow 5–10 working days for the change to reflect in bank records and on all linked services like cheque books, statements, and debit card delivery.',
            link: 'https://www.rbi.org.in/Scripts/FAQView.aspx?Id=92',
        });
    }

    if (questionnaire.nameChange) {
        items.push({
            step: step++,
            task: 'Update Name on Aadhaar',
            description:
                'A name change on Aadhaar is required after marriage, divorce, or a legal name change — all downstream documents depend on Aadhaar being correct. ' +
                'This update must be done offline: visit the nearest Aadhaar Enrolment Centre (book an appointment at https://appointments.uidai.gov.in) with your current Aadhaar, a valid name-change document (marriage certificate, gazette notification, or court order), and a passport-size photograph. ' +
                'Fill the Aadhaar Update/Correction form at the centre, pay the ₹50 fee, and collect your acknowledgement slip with an Update Request Number (URN). ' +
                'Track the status of your update at https://myaadhaar.uidai.gov.in using the URN. ' +
                'The name change is processed within 7–30 working days and the updated e-Aadhaar can be downloaded from the portal.',
            link: 'https://myaadhaar.uidai.gov.in',
        });
        items.push({
            step: step++,
            task: 'Update Name on PAN Card',
            description:
                'Your PAN card must reflect your exact legal name as it appears on your court order, marriage certificate, or gazette notification to avoid mismatches during financial and tax operations. ' +
                'Visit the NSDL PAN correction portal, choose "Changes or Correction in existing PAN data", select "Name" as the field to be corrected, and upload a self-attested copy of your name-change document. ' +
                'Alternatively, use the UTIITSL portal at https://www.pan.utiitsl.com if you prefer that route. ' +
                'The fee is ₹107 and your PAN number remains unchanged — only the name printed on the card is updated. ' +
                'The corrected card is dispatched within 15–20 working days.',
            link: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
        });
        items.push({
            step: step++,
            task: 'Update Name in Bank Records',
            description:
                'All your bank accounts must reflect your new legal name to avoid discrepancies during KYC checks, income tax filings, and financial transactions. ' +
                'Visit your bank branch with the original name-change document (marriage certificate or gazette notification), your old and new PAN cards, and your updated Aadhaar. ' +
                'Submit a Name Change Request Form along with self-attested photocopies of all supporting documents — some banks like HDFC, SBI, and ICICI also accept this request via their mobile banking app under "Profile Update" or "Service Requests". ' +
                'Ensure you update all linked accounts — savings, salary, fixed deposits — as each may need a separate request. ' +
                'Allow 5–10 working days for the change to reflect across all records.',
            link: 'https://www.rbi.org.in',
        });
    }

    if (items.length === 0) {
        items.push({
            step: 1,
            task: 'Review All Identity Documents',
            description:
                'No specific document updates were flagged based on your responses, but it is good practice to periodically verify that all your identity documents are consistent and up to date. ' +
                'Check that your Aadhaar, PAN, Passport, Voter ID, Driving Licence, and bank records all carry the same name spelling, date of birth, and current address. ' +
                'Use the DigiLocker app (https://www.digilocker.gov.in) to access all your government-issued documents securely in one place. ' +
                'If you find any discrepancies, initiate corrections through the respective official portals listed above.',
            link: 'https://www.digilocker.gov.in',
        });
    }

    return items.map((item) => ({
        ...item,
        description: toBulletDescription(item.description, 'Complete the required update for this relocation step.'),
    }));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGeminiWithRetry = async (model, prompt, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (err) {
            const is429 = err.message && err.message.includes('429');
            if (is429) {
                console.warn(`Gemini rate-limited (429). Falling back immediately...`);
                throw err;
            } else if (attempt < maxRetries) {
                const waitMs = attempt * 3000;
                console.warn(`Gemini network error. Retrying in ${waitMs / 1000}s (attempt ${attempt}/${maxRetries})`);
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