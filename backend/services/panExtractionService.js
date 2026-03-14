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
    // Filter out common header lines and empty lines
    const skipKeywords = ["INCOME", "TAX", "DEPARTMENT", "INDIA", "PERMANENT", "ACCOUNT", "CARD", "GOVI", "GOVT", "SIGNATURE"];
    
    // First try template-specific extraction based on labels
    for (let i = 0; i < lines.length; i++) {
        const lineStr = lines[i].replace(/\s+/g, '').toUpperCase();
        
        // 1. Template extraction for Name
        if (lineStr.includes("नाम/NAME") || lineStr.includes("NAME")) {
            // The actual name is usually the very next line
            if (i + 1 < lines.length && !name) {
                const candidate = lines[i+1];
                if (!/\d/.test(candidate) && candidate.length > 2) {
                     name = normalizeName(candidate);
                }
            }
        }
        
        // 2. Template extraction for Father's Name
        if (lineStr.includes("पिताकानाम/FATHER'SNAME") || lineStr.includes("FATHER")) {
             // The actual father name is usually the very next line
            if (i + 1 < lines.length && !fatherName) {
                const candidate = lines[i+1];
                if (!/\d/.test(candidate) && candidate.length > 2) {
                     fatherName = normalizeName(candidate);
                }
            }
        }
    }
    
    // Next, use positional fallback if template matching failed
    // We only consider lines that are purely alphabetical (names) for name extraction
    const nameCandidates = lines.filter((line, idx) => {
        const upperLine = line.toUpperCase();
        if (upperLine.length < 3) return false;
        if (/\d/.test(line)) return false; // names don't have digits
        
        // Check if it's purely letters, spaces, dots, or hyphens
        if (!/^[a-zA-Z\s\.\-]+$/i.test(line)) return false; 
        
        return !skipKeywords.some(keyword => upperLine.includes(keyword)) &&
               !upperLine.includes("NAME") && !upperLine.includes("FATHER") &&
               // We don't want to re-process lines we already identified as Name/Father via template
               upperLine !== (name && name.toUpperCase()) && 
               upperLine !== (fatherName && fatherName.toUpperCase());
    });

    if (!name && nameCandidates.length > 0) {
        name = normalizeName(nameCandidates[0]);
        // Remove the chosen name from candidates so it doesn't get picked as father's name
        nameCandidates.shift();
    }
    
    if (!fatherName && nameCandidates.length > 0) {
        fatherName = normalizeName(nameCandidates[0]);
    }

    return {
        name,
        fatherName,
        dob: dob,
        panNumber
    };
};

module.exports = { extractPanData };
