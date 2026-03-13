const express = require('express');
const router = express.Router();
const autofillController = require('../controllers/autofillController');

// POST /api/autofill/aadhaar
router.post('/aadhaar', autofillController.fillAadhaar);

// POST /api/autofill/pan
router.post('/pan', autofillController.fillPan);

// POST /api/autofill/voter
router.post('/voter', autofillController.fillVoter);

// POST /api/autofill/license
router.post('/license', autofillController.fillLicense);

// POST /api/autofill/passport
router.post('/passport', autofillController.fillPassport);

module.exports = router;
