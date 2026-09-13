const express = require('express');
const router = express.Router();
const { getSalesforceConnection } = require('../services/salesforce');

//Get all opportunities for a registered user
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'The userId parameter is required' });
        }

        const conn = await getSalesforceConnection();

        const queryResult = await conn.query(
            `SELECT Id, Name, Type, LeadSource, OrderNumber__c, CurrentGenerators__c, TrackingNumber__c, Amount, CloseDate, StageName, MainCompetitors__c, DeliveryInstallationStatus__c 
             FROM Opportunity 
             WHERE OwnerId = '${userId}' 
             ORDER BY CreatedDate DESC LIMIT 50`
        );

        const mappedOpportunities = queryResult.records.map(opp => {
            let displayName = opp.Name;
            if (opp.Type) {
                displayName += ' - ' + opp.Type;
            }
            if (opp.OrderNumber__c) {
                displayName += ' - ' + opp.OrderNumber__c;
            }

            let formattedDate = null;
            if (opp.CloseDate) {
                const dateParts = opp.CloseDate.split('-'); // [YYYY, MM, DD]
                formattedDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;
            }

            return {
                id: opp.Id,
                displayName: displayName,
                type: opp.Type || null,
                leadSource: opp.LeadSource || null,
                orderNumber: opp.OrderNumber__c || null,
                currentGenerators: opp.CurrentGenerators__c || null,
                trackingNumber: opp.TrackingNumber__c || null,
                amount: opp.Amount !== null ? opp.Amount : null,
                closeDate: formattedDate,
                stage: opp.StageName,
                mainCompetitors: opp.MainCompetitors__c || null,
                deliveryInstallationStatus: opp.DeliveryInstallationStatus__c || null
            }
        });

        res.status(200).json(mappedOpportunities);
    } catch (error) {
        console.error('Ошибка GET /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

//Create Opportunity
router.post('/', async (req, res) => {
    try {
        const { name, amount, userId } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Deal name (Name) is required.' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'User ID (userId) is required.' });
        }

        const conn = await getSalesforceConnection();

        const randomOrder = Math.floor(Math.random() * 900000) + 100000;
        const randomTracking = Math.floor(Math.random() * 900000) + 100000;

        const today = new Date();
        today.setMonth(today.getMonth() + 1);
        const closeDate = today.toISOString().split('T')[0];

        const newOpportunityData = {
            Name: name,
            Amount: amount ? parseFloat(amount) : null,
            OwnerId: userId,
            Type: 'New Customer',
            LeadSource: 'Partner Referral',
            StageName: 'Prospecting',
            CloseDate: closeDate,
            OrderNumber__c: String(randomOrder),
            TrackingNumber__c: String(randomTracking),
            DeliveryInstallationStatus__c: 'In progress'
        };

        const insertResult = await conn.sobject('Opportunity').create(newOpportunityData);

        if (insertResult.success) {
            res.status(201).json({ id: insertResult.id, success: true });
        } else {
            res.status(400).json({ error: 'Failed to create the deal.', details: insertResult.errors });
        }
    } catch (error) {
        console.error('Ошибка POST /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

//Delete selected opportunity
router.delete('/:id', async (req, res) => {
    try {
        const opportunityId = req.params.id;
        const conn = await getSalesforceConnection();

        const deleteResult = await conn.sobject('Opportunity').destroy(opportunityId);

        if (deleteResult.success) {
            res.status(200).json({ success: true, message: 'Record successfully deleted.' });
        } else {
            res.status(400).json({ error: 'Failed to delete the record.', details: deleteResult.errors });
        }
    } catch (error) {
        console.error('Error DELETE /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;