/**
 * panExtractionService.js
 * 
 * Provides layout-based extraction for Indian PAN cards:
 * - PAN Number: regex pattern [A-Z]{5}[0-9]{4}[A-Z]
 * - Date of Birth: regex pattern \d{2}/\d{2}/\d{4}
 * - Name: Line two positions above the DOB line
 * - Father's Name: Line one position above the DOB line
 */

/**
 * Normalizes a name string by converting it to Title Case.
 * Example: "MANISH DAS" -> "Manish Das"
 */
const normalizeName = (name) => {
    if (!name) return null;
    return name
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};

/**
 * Extracts structured data from raw PAN card OCR text.
 * 
 * @param {string} text - Raw OCR text
 * @returns {object} - Structured PAN data
 */
const extractPanData = (text) => {
    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    let name = null;
    let fatherName = null;
    let dob = null;
    let panNumber = null;

    // 1. Extract PAN Number (AAAAA9999A)
    const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]/);
    if (panMatch) {
        panNumber = panMatch[0];
    }

    // 2. Extract Date of Birth (DD/MM/YYYY)
    const dobMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
    if (dobMatch) {
        dob = dobMatch[0];
    }

    // 3. Extract Name and Father's Name using layout rules
    // Rule: find the DOB line, the two lines above it are name and father's name
    if (dob) {
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(dob)) {
                if (i >= 2) {
                    name = normalizeName(lines[i - 2]);
                    fatherName = normalizeName(lines[i - 1]);
                } else if (i === 1) {
                    // Fallback: only father's name (or name if only one line exists)
                    fatherName = normalizeName(lines[i - 1]);
                }
                break;
            }
        }
    }

    // Fallback name extraction if layout rule failed
    if (!name) {
        // Try to find the first line that looks like a name and isn't a known keyword
        const skipKeywords = ["INCOME TAX", "DEPARTMENT", "INDIA", "PERMANENT", "ACCOUNT", "CARD"];
        for (const line of lines) {
            const upperLine = line.toUpperCase();
            if (!/\d/.test(line) && 
                !skipKeywords.some(keyword => upperLine.includes(keyword)) &&
                /^[A-Z\s]+$/i.test(line) &&
                line.split(/\s+/).length >= 2) {
                name = normalizeName(line);
                break;
            }
        }
    }

    return {
        name,
        fatherName,
        dateOfBirth: dob,
        panNumber
    };
};

module.exports = { extractPanData };
