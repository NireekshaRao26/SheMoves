const puppeteer = require('puppeteer');

/**
 * Automates form filling on government portals using Puppeteer.
 * Runs in headful mode (browser visible).
 * 
 * @param {string} portalName - The name of the portal ('aadhaar', 'pan', 'voter', 'license', 'passport')
 * @param {object} userData - Extracted user data { name, gender, dob, address, aadhaarNumber, panNumber }
 */
const autofillPortal = async (portalName, userData) => {
    // Determine target URL based on portalName
    const portalUrls = {
        aadhaar: 'https://myaadhaar.uidai.gov.in/en_IN',
        pan: 'https://onlineservices.proteantech.in/paam/endUserRegisterContact.html',
        voter: 'https://voters.eci.gov.in',
        license: 'https://parivahan.gov.in',
        passport: 'https://www.passportindia.gov.in/psp'
    };

    const targetUrl = portalUrls[portalName];
    if (!targetUrl) {
        throw new Error(`Unsupported portal: \${portalName}`);
    }

    let browser;
    try {
        console.log(`Launching Puppeteer for \${portalName} at \${targetUrl}`);
        // Launch browser in headful mode so user can interact with the page
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null, // Use full available viewport
            args: ['--start-maximized']
        });

        const page = await browser.newPage();
        
        // Navigate to the portal URL and wait for the page to load
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log(`Successfully navigated to \${portalName}. Attempting to prefill data...`);

        // Helper to safely type into an element if it exists
        const safeType = async (selector, value) => {
            if (!value) return;
            try {
                // Wait briefly for selector to be ready
                await page.waitForSelector(selector, { timeout: 2000, visible: true });
                await page.type(selector, value);
                console.log(`Filled \${selector} with \${value}`);
            } catch (err) {
                // Ignore if selector doesn't exist on standard load
            }
        };

        // Attempting to match generalized common selectors per field
        if (userData.name) {
            await safeType('input[name="name"]', userData.name);
            await safeType('#name', userData.name);
            await safeType('input[name*="fullName"]', userData.name);
        }

        if (userData.dob) {
            await safeType('input[name="dob"]', userData.dob);
            await safeType('#dob', userData.dob);
            // Some portals use date inputs differently
        }

        if (userData.aadhaarNumber) {
            await safeType('input[name="uid"]', userData.aadhaarNumber);
            await safeType('#uid', userData.aadhaarNumber);
            await safeType('input[name*="aadhaar"]', userData.aadhaarNumber);
        }

        if (userData.panNumber) {
            await safeType('input[name="pan"]', userData.panNumber);
            await safeType('#pan', userData.panNumber);
        }
        
        if (userData.address) {
            await safeType('textarea[name="address"]', userData.address);
            await safeType('#address', userData.address);
        }

        console.log(`Autofill completed for \${portalName}. Browser remains open.`);
        
        // We do NOT close the browser here, because the user must continue manually.
        
        return {
            success: true,
            message: `Autofill automation started for \${portalName}. Browser opened for manual completion.`
        };

    } catch (error) {
        console.error(`Error in autofill automation for \${portalName}:`, error);
        
        // DO NOT close browser on error so user can still see and proceed manually
        
        throw new Error(`Automation failed: \${error.message}`);
    }
};

module.exports = {
    autofillPortal
};
