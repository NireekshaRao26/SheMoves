const { autofillPortal } = require('../services/autofillService');

const handleAutofillRequest = async (portalName, req, res) => {
    try {
        const userData = req.body;
        
        if (!userData || Object.keys(userData).length === 0) {
            return res.status(400).json({ success: false, message: 'User data is required for autofill' });
        }

        console.log(`Received request to autofill \${portalName} with data:`, userData);

        // Run the puppeteer automation
        const result = await autofillPortal(portalName, userData);

        return res.status(200).json(result);
    } catch (error) {
        console.error(`Error handling \${portalName} autofill request:`, error);
        return res.status(500).json({ 
            success: false, 
            message: `Failed to automate \${portalName} portal`,
            error: error.message
        });
    }
};

exports.fillAadhaar = async (req, res) => {
    await handleAutofillRequest('aadhaar', req, res);
};

exports.fillPan = async (req, res) => {
    await handleAutofillRequest('pan', req, res);
};

exports.fillVoter = async (req, res) => {
    await handleAutofillRequest('voter', req, res);
};

exports.fillLicense = async (req, res) => {
    await handleAutofillRequest('license', req, res);
};

exports.fillPassport = async (req, res) => {
    await handleAutofillRequest('passport', req, res);
};
