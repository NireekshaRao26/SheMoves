const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/run', authMiddleware, async (req, res) => {
    const { serviceName, userData, officialPortalLink } = req.body || {};

    if (!serviceName) {
        return res.status(400).json({ message: 'serviceName is required' });
    }

    const automationBaseUrl = process.env.AUTOMATION_BASE_URL || 'http://localhost:5001';

    try {
        const upstreamResponse = await fetch(`${automationBaseUrl}/api/automation/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceName,
                userData,
                officialPortalLink
            })
        });

        const raw = await upstreamResponse.text();
        let payload;

        try {
            payload = raw ? JSON.parse(raw) : {};
        } catch {
            payload = { message: raw || 'Automation service responded with non-JSON payload' };
        }

        if (!upstreamResponse.ok) {
            return res.status(upstreamResponse.status).json({
                message: payload.message || 'Automation service request failed',
                details: payload
            });
        }

        return res.status(200).json(payload);
    } catch (error) {
        return res.status(503).json({
            message: 'Automation service unavailable. Ensure automation server is running on port 5001.',
            error: error.message
        });
    }
});

module.exports = router;