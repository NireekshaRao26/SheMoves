/**
 * aadhaarExtractionService.js
 * 
 * Provides layout-based extraction for Aadhaar cards:
 * - Name: Line immediately above the line containing "DOB"
 * - Aadhaar Number: 12-digit pattern (XXXX XXXX XXXX)
 * - Address: 2-3 lines after the Aadhaar number
 */

const extractAadhaarData = (text) => {
    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    let name = null;
    let dob = null;
    let gender = null;
    let aadhaarNumber = null;
    let address = null;

    // 1. Extract Aadhaar Number (XXXX XXXX XXXX)
    const aadhaarMatch = text.match(/\d{4}\s\d{4}\s\d{4}/);
    if (aadhaarMatch) {
        aadhaarNumber = aadhaarMatch[0];
    }

    // 2. Extract Date of Birth (DD/MM/YYYY)
    const dobMatch = text.match(/\d{2}\/\d{2}\/\d{4}/);
    if (dobMatch) {
        dob = dobMatch[0];
    }

    // 3. Extract Gender
    const upperText = text.toUpperCase();
    if (upperText.includes("FEMALE")) {
        gender = "Female";
    } else if (upperText.includes("MALE")) {
        gender = "Male";
    }

    // 4. Extract Name and Address using layout rules
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Name is the line above "DOB" or "Year of Birth"
        if ((line.includes("DOB") || line.includes("Birth")) && i > 0) {
            // Basic validation: name shouldn't contain digits or common keywords
            const previousLine = lines[i - 1];
            if (!/\d/.test(previousLine) && !previousLine.toUpperCase().includes("GOVERNMENT")) {
                name = previousLine;
            }
        }

        // Address is usually 2-3 lines after the Aadhaar number line
        if (aadhaarNumber && line.includes(aadhaarNumber) && i < lines.length - 1) {
            const addressLines = lines.slice(i + 1, i + 4);
            address = addressLines.join(" ").trim();
        }
    }

    // Heuristic fallback for Name if layout rule failed
    if (!name) {
        // Try to find a capitalized line that doesn't share line with DOB/Aadhaar/Gender
        for (const line of lines) {
            if (/^[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,4}$/.test(line)) {
               const skip = ["GOVERNMENT OF INDIA", "MALE", "FEMALE", "INCOME TAX"];
               if (!skip.some(s => line.toUpperCase().includes(s))) {
                   name = line;
                   break;
               }
            }
        }
    }

    // Normalize name if found
    if (name) {
        name = name.toLowerCase()
            .split(/\s+/)
            .filter(Boolean)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    return {
        name,
        dateOfBirth: dob,
        gender,
        aadhaarNumber,
        address
    };
};

module.exports = { extractAadhaarData };
