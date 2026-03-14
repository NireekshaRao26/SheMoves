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

        // Address extraction handles it afterwards
    }

    // 5. Extract Address (stop at 6 digit pincode to avoid QR code garbage)
    // We want to capture from a known address marker down to the pincode.
    // However, we MUST use a non-greedy match and avoid capturing across too many lines
    // to prevent it from grabbing the entire card (like Name, DOB, Gender) if the layout is weird.
    
    // Attempt 1: Explicit markers
    const addressMatch = text.match(/(?:Address[:\-]?|S\/O[:\-]?|D\/O[:\-]?|C\/O[:\-]?|W\/O[:\-]?)[\s\S]{10,150}?\b\d{6}\b/i);
    
    if (addressMatch) {
        // Clean up the match by removing the marker itself if it's "Address"
        let addr = addressMatch[0].replace(/Address[:\-]?\s*/i, '');
        // Also strip out any accidentally captured Gender or Aadhaar number noise
        addr = addr.replace(/Gender[\s\S]*?(?:Male|Female|Transgender).*?(?=\n|$)/i, '')
                   .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '')
                   .replace(/[\=\;\|\[\]]/g, ''); // Remove common OCR garbage characters
                   
        address = addr.replace(/\n/g, ', ').replace(/,\s*,/g, ', ').trim();
        // Finally, strip stray starting artifacts (like "ddress", "iat", leading commas)
        address = address.replace(/^(?:ddress|address|addr|iat|op)[,\s\:\.\-]*/i, '').replace(/^[,:\s\-]+/, '');
    } else {
        // Fallback: If no explicit marker, look for a 6-digit pincode and grab the 2-3 lines immediately preceding it.
        // We use a more constrained regex here so it doesn't accidentally grab the top of the card.
        const pinMatch = text.match(/([^\n]+\n){1,3}([^\n]*\b\d{6}\b)/);
        if (pinMatch) {
            let addr = pinMatch[0];
            addr = addr.replace(/Gender[\s\S]*?(?:Male|Female|Transgender).*?(?=\n|$)/i, '')
                       .replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '')
                       .replace(/[\=\;\|\[\]]/g, '');
                       
            address = addr.replace(/\n/g, ', ').replace(/,\s*,/g, ', ').trim();
            // Finally, strip stray starting artifacts. 
            // Since Tesseract OCR can introduce completely random combinations of chars ("iat 3", "t 3", "wis;"),
            // the safest way to start an Indian address cleanly is to drop everything before the first comma,
            // or drop everything before the first digit (like a house number).
            
            // First pass: strip explicitly known garbage
            address = address.replace(/^(?:ddress|address|addr|iat|op|wis|wwis|ww|t\s?\d?)[,\s\:\.\-\d]*/i, '');
            // Second pass: aggressively trim all text at the very beginning that doesn't look like part of an address.
            // Addresses almost always start with a number (house/flat/plot) or a capitalized block name.
            // This regex strips any lowercase letters, loose punctuation, and spaces at the start.
            address = address.replace(/^[^A-Z0-9]+/, '');
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
        dob: dob,
        gender,
        aadhaarNumber,
        address
    };
};

module.exports = { extractAadhaarData };
