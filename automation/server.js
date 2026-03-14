const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Serve the static demo form
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/automation/run', async (req, res) => {
    const { serviceName, userData, officialPortalLink } = req.body;

    res.json({ message: 'Automation started in the background.' });

    // Run puppeteer in background
    setTimeout(async () => {
        try {
            console.log(`Starting Automation for: ${serviceName}`);
            console.log('Using User Data:', userData);

            // Launch browser (headless: false to demonstrate to user)
            const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
            const page = await browser.newPage();

            const targetUrl = `http://localhost:${PORT}/demo-form.html`;
            await page.goto(targetUrl, { waitUntil: 'networkidle2' });

            // Simulate human typing
            const typeDelay = { delay: 100 };

            await page.waitForSelector('#serviceName');

            // Clear and type service name
            await page.click('#serviceName', { clickCount: 3 });
            await page.keyboard.press('Backspace');
            await page.type('#serviceName', serviceName || 'General Service', typeDelay);

            // Fill user data if provided, otherwise use defaults
            const name = userData?.name || 'Jane Doe (Manual)';
            
            let dob = '01/01/1990';
            if (userData?.dob) {
                // Extract only the date part (e.g. DD/MM/YYYY or DD-MM-YYYY)
                const dateMatch = String(userData.dob).match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/);
                dob = dateMatch ? dateMatch[0] : String(userData.dob).trim();
            }

            const address = userData?.address || '123 Default Street, City';

            await page.type('#fullName', name, typeDelay);
            await page.type('#dob', dob, typeDelay);
            await page.type('#address', address, typeDelay);

            // Check the disclaimer
            await page.click('#disclaimer');

            // Small pause before submit to let user see
            await new Promise(r => setTimeout(r, 1500));

            await page.click('button[type="submit"]');

            // Wait a bit to show success message
            await new Promise(r => setTimeout(r, 3000));

            await browser.close();
            console.log('Automation Complete');
        } catch (error) {
            console.error('Puppeteer error:', error);
        }
    }, 100);
});

app.listen(PORT, () => {
    console.log(`Automation server running on port ${PORT}`);
    console.log(`Demo form available at http://localhost:${PORT}/demo-form.html`);
});
