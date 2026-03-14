/**
 * fieldExtractionService.js
 *
 * Parses raw Tesseract OCR text to:
 *  1. Detect the document type (Aadhaar, PAN, Passport, DL, unknown)
 *  2. Extract structured identity fields
 */

// ─── Document Type Detection ──────────────────────────────────────────────────

/**
 * Detects the type of identity document from raw OCR text.
 * @param {string} text
 * @returns {'aadhaar'|'pan'|'passport'|'driving_license'|'unknown'}
 */
const detectDocumentType = (text) => {
    const upper = text.toUpperCase();

    const hasAadhaarNumber = /\d{4}\s\d{4}\s\d{4}/.test(text);
    const hasGovernmentOfIndia = upper.includes('GOVERNMENT OF INDIA');
    const hasIncomeTax = upper.includes('INCOME TAX DEPARTMENT') || upper.includes('INCOME TAX') || upper.includes('PERMANENT ACCOUNT NUMBER CARD');
    const hasPanPattern = /[A-Z]{5}[0-9]{4}[A-Z]/.test(text);
    const hasPassport =
        upper.includes('PASSPORT') ||
        upper.includes('REPUBLIC OF INDIA') ||
        /[A-Z]\d{7}/.test(text); // Passport number pattern
    const hasDrivingLicense =
        upper.includes('DRIVING LICENCE') ||
        upper.includes('DRIVING LICENSE') ||
        upper.includes('TRANSPORT DEPARTMENT') ||
        /DL[-\s]?\d{2,}/.test(text);

    if (hasIncomeTax || (hasPanPattern && !hasAadhaarNumber)) return 'pan';
    if (hasPassport) return 'passport';
    if (hasDrivingLicense) return 'driving_license';
    if (hasGovernmentOfIndia || hasAadhaarNumber) return 'aadhaar';

    return 'unknown';
};

// ─── Field Extraction Helpers ─────────────────────────────────────────────────

/** Extract Aadhaar number (XXXX XXXX XXXX) */
const extractAadhaar = (text) => {
    const match = text.match(/\d{4}\s\d{4}\s\d{4}/);
    return match ? match[0] : null;
};

/** Extract PAN number (AAAAA9999A) */
const extractPan = (text) => {
    const match = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    return match ? match[0] : null;
};

/** Extract Passport number (e.g. A1234567) */
const extractPassport = (text) => {
    const match = text.match(/[A-Z][0-9]{7}/);
    return match ? match[0] : null;
};

/** Extract Date of Birth (DD/MM/YYYY or DD-MM-YYYY) */
const extractDOB = (text) => {
    // Accept both / and - separators
    const match = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
    if (!match) return null;
    // Normalize to DD/MM/YYYY
    return `${match[1]}/${match[2]}/${match[3]}`;
};

/** Extract gender (Male / Female / Transgender) */
const extractGender = (text) => {
    const upper = text.toUpperCase();
    if (upper.includes('FEMALE') || upper.includes('महिला')) return 'Female';
    if (upper.includes('MALE') || upper.includes('पुरुष')) return 'Male';
    if (upper.includes('TRANSGENDER')) return 'Transgender';
    return null;
};

/**
 * Normalizes a name string by converting it to Title Case.
 * Example: "NIREEKSHA RAO" -> "Nireeksha Rao"
 */
const normalizeName = (name) => {
    return name
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

/**
 * Extract name based on line-by-line heuristics:
 * 1. Split into lines and trim.
 * 2. Skip lines with numbers or dates.
 * 3. Skip lines containing document-level keywords.
 * 4. A valid name candidate must have 2 or more words, be purely alphabetic, 
 *    and not be excessively long.
 * 5. Returns the first valid candidate normalized to Title Case.
 */
const extractName = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // Document keywords to ignore (case-insensitive)
    const skipKeywords = [
        "government", "india", "income tax", "department", "dob",
        "male", "female", "year of birth", "unique", "identification",
        "authority", "address", "enrollment", "mobile", "pincode"
    ];

    for (const line of lines) {
        // Rule: Skip lines with any digits (usually numbers, dates, or ID numbers)
        if (/\d/.test(line)) continue;

        // Rule: Skip lines containing document-level keywords
        const lowerLine = line.toLowerCase();
        if (skipKeywords.some(keyword => lowerLine.includes(keyword))) continue;

        // Rule: Must contain only alphabetic characters and spaces
        if (!/^[a-zA-Z\s]+$/.test(line)) continue;

        // Rule: Must contain at least two words
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length < 2) continue;

        // Rule: Not too long (e.g., max 50 chars)
        if (line.length > 50) continue;

        // Logic: The first line that passes all filters is likely the person's name
        return normalizeName(line);
    }

    return null;
};


/** Extract address — lines after "Address:" or "S/O", "W/O", "C/O" etc. */
const extractAddress = (text) => {
    // Match "Address:" and grab up to 3 following lines
    const addrLabel = text.match(/(?:Address|ADDRESS|Addr)\s*[:\-]?\s*([\s\S]{10,200}?)(?:\n\n|\d{6}|$)/);
    if (addrLabel) {
        const addr = addrLabel[1].replace(/\n/g, ', ').replace(/,\s*,/g, ',').trim();
        if (addr.length > 5) return addr;
    }

    // Look for a pincode — grab 2-3 preceding lines as address
    const pinMatch = text.match(/((?:[^\n]+\n){1,3})[^\n]*\b\d{6}\b/);
    if (pinMatch) {
        const addr = pinMatch[1].replace(/\n/g, ', ').trim();
        if (addr.length > 5) return addr;
    }

    return null;
};

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Convert ALL CAPS string to Title Case */
const title = (str) =>
    str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ─── Main Export ──────────────────────────────────────────────────────────────

const { extractAadhaarData } = require('./aadhaarExtractionService');
const { extractPanData } = require('./panExtractionService');

/**
 * Given raw OCR text, returns document type + all structured fields.
 *
 * @param {string} rawText
 * @returns {{
 *   documentType: string,
 *   extractedData: {
 *     name: string|null,
 *     dob: string|null,
 *     gender: string|null,
 *     aadhaarNumber: string|null,
 *     panNumber: string|null,
 *     passportNumber: string|null,
 *     address: string|null
 *   }
 * }}
 */
const extractFields = (rawText) => {
    const documentType = detectDocumentType(rawText);

    let extractedData = {
        name: extractName(rawText),
        dob: extractDOB(rawText),
        gender: extractGender(rawText),
        aadhaarNumber: extractAadhaar(rawText),
        panNumber: extractPan(rawText),
        passportNumber: extractPassport(rawText),
        address: extractAddress(rawText),
    };

    // Use specialised service for Aadhaar if detected
    if (documentType === 'aadhaar') {
        const aadhaarData = extractAadhaarData(rawText);
        extractedData = {
            ...extractedData,
            ...aadhaarData,
            panNumber: null,
            passportNumber: null
        };
    } else if (documentType === 'pan') {
        const panData = extractPanData(rawText);
        extractedData = {
            ...extractedData,
            ...panData,
            aadhaarNumber: null,
            passportNumber: null
        };
    } else if (documentType === 'passport') {
        extractedData.aadhaarNumber = null;
        extractedData.panNumber = null;
    }

    return { documentType, extractedData };
};

module.exports = { extractFields };

