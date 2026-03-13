const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { extractFields } = require('./fieldExtractionService');

/**
 * Preprocesses an image using sharp for better OCR accuracy:
 * - Convert to grayscale
 * - Normalize contrast
 * - Resize to at least 1500px wide (preserving aspect ratio)
 *
 * @param {string} inputPath - Path to the original uploaded image
 * @returns {string} - Path to the processed image
 */
const preprocessImage = async (inputPath) => {
    const outputPath = path.join(
        path.dirname(inputPath),
        `processed_${Date.now()}.png`
    );

    const metadata = await sharp(inputPath).metadata();
    const shouldResize = metadata.width && metadata.width < 1500;

    let pipeline = sharp(inputPath).grayscale().normalize();

    if (shouldResize) {
        pipeline = pipeline.resize({ width: 1500, withoutEnlargement: false });
    }

    await pipeline.toFile(outputPath);
    return outputPath;
};

/**
 * Full OCR pipeline: preprocess → Tesseract → fieldExtractionService.
 *
 * @param {string} imagePath - Path to the uploaded image file
 * @returns {{ documentType: string, rawText: string, extractedData: object }}
 */
const processImage = async (imagePath) => {
    let processedPath = null;

    try {
        // Step 1: Preprocess with sharp
        processedPath = await preprocessImage(imagePath);
        console.log('Preprocessed image saved to:', processedPath);

        // Step 2: OCR with Tesseract.js
        const { data: { text } } = await Tesseract.recognize(processedPath, 'eng', {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    process.stdout.write(`\rOCR progress: ${Math.round(m.progress * 100)}%`);
                }
            }
        });
        console.log('\nTesseract OCR complete.');

        const rawText = text.trim();

        // Step 3: Delegate structured extraction to fieldExtractionService
        const { documentType, extractedData } = extractFields(rawText);

        return { documentType, rawText, extractedData };
    } finally {
        // Clean up processed image
        if (processedPath && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
        }
    }
};

module.exports = { processImage };
