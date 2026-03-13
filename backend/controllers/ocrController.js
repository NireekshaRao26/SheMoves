const { processImage } = require('../services/ocrService');
const fs = require('fs');

/**
 * POST /api/ocr/extract
 * Accepts a multipart file upload (field: document),
 * runs Tesseract OCR + preprocessing, and returns:
 *   documentType, rawText, extractedData
 */
const extractText = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded. Use field name: document' });
    }

    const filePath = req.file.path;

    try {
        const { documentType, rawText, extractedData } = await processImage(filePath);

        return res.status(200).json({
            documentType,
            rawText,
            extractedData
        });
    } catch (err) {
        console.error('OCR extraction error:', err);
        return res.status(500).json({ message: 'OCR processing failed', error: err.message });
    } finally {
        // Clean up the original uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

module.exports = { extractText };

