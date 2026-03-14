const fs = require('fs');
const path = require('path');
const { processImage } = require('./services/ocrService');

async function testOCR() {
    // Look for any image file in the backend or root to test with
    // Ideally, find the most recently modified image file
    const tryPaths = [
        path.join(__dirname, 'uploads'),
        path.join(__dirname, '..', 'uploads'),
        path.join(__dirname)
    ];
    
    let latestFile = null;
    let latestTime = 0;

    for (const dir of tryPaths) {
        if (!fs.existsSync(dir)) continue;
        
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (!file.match(/\.(jpg|jpeg|png|webp)$/i)) continue;
                if (file.startsWith('processed_')) continue;
                
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.mtimeMs > latestTime) {
                    latestTime = stat.mtimeMs;
                    latestFile = filePath;
                }
            }
        } catch (e) {
            console.error(`Error reading dir ${dir}:`, e.message);
        }
    }

    if (!latestFile) {
        console.error("No image file found to test with!");
        return;
    }

    console.log(`Testing OCR with most recent image: ${latestFile}`);
    try {
        const result = await processImage(latestFile);
        console.log("\n================ RAW TESSERACT TEXT =================\n");
        console.log(result.rawText);
        console.log("\n================ EXTRACTED FIELDS =================\n");
        console.log(JSON.stringify(result.extractedData, null, 2));
    } catch (e) {
        console.error("OCR test failed:", e);
    }
}

testOCR();
