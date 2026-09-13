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
            `SELECT FirstName, LastName, Email, MobilePhone, Phone, Street, City, State, PostalCode, Country, MediumPhotoUrl 
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

        const address = [usr.Street, usr.City, usr.State, usr.PostalCode, usr.Country].filter(Boolean).join(' ');
       
        res.status(200).json({
            firstName: usr.FirstName || '-',
            lastName: usr.LastName || '-',
            email: usr.Email || '-',
            mobilePhone: usr.MobilePhone || '-',
            phone: usr.Phone || '-',
            address: address || '-',
            photoUrl: relativePhotoUrl || null
        });
    } catch (error) {
        console.error('Error GET /api/users/:id:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;