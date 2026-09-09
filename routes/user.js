const express = require('express');
const router = express.Router();
const { getSalesforceConnection } = require('../services/salesforce');

router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        const conn = await getSalesforceConnection();

        const queryResult = await conn.query(
            `SELECT Name, Email, Phone, Title, CompanyName, MediumPhotoUrl 
             FROM User 
             WHERE Id = '${userId}' 
             LIMIT 1`
        );

        if (queryResult.records.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const usr = queryResult.records[0];

        let relativePhotoUrl = usr.MediumPhotoUrl;
        if (relativePhotoUrl && relativePhotoUrl.startsWith('http')) {
            try {
                const urlObj = new URL(relativePhotoUrl);
                relativePhotoUrl = urlObj.pathname + urlObj.search;
            } catch (e) {
                console.error('Error parsing photo URL:', e);
            }
        }

        res.status(200).json({
            name: usr.Name || '-',
            email: usr.Email || '-',
            phone: usr.Phone || '-',
            title: usr.Title || '-',
            companyName: usr.CompanyName || '-',
            photoUrl: relativePhotoUrl || null
        });
    } catch (error) {
        console.error('Error GET /api/users/:id:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;