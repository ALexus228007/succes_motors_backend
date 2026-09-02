const express = require('express');
const router = express.Router();
const { getSalesforceConnection } = require('../services/salesforce');

// 1. GET: Получить список сделок ТОЛЬКО для конкретного пользователя (фильтр по OwnerId)
router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId; // Ожидаем параметр ?userId=005...

        if (!userId) {
            return res.status(400).json({ error: 'Параметр userId обязателен' });
        }

        const conn = await getSalesforceConnection();
        
        // Запрашиваем записи, принадлежащие только текущему пользователю
        const queryResult = await conn.query(
            `SELECT Id, Name, Type, StageName, Amount, CloseDate, OrderNumber__c 
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
                stage: opp.StageName,
                amount: opp.Amount !== null ? opp.Amount : null,
                closeDate: formattedDate,
                type: opp.Type || null,
                orderNumber: opp.OrderNumber__c || null
            };
        });

        res.status(200).json(mappedOpportunities);
    } catch (error) {
        console.error('Ошибка GET /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// 2. POST: Создать новую сделку и назначить ее владельцем текущего пользователя
router.post('/', async (req, res) => {
    try {
        const { name, amount, userId } = req.body; // Ожидаем userId в теле запроса

        if (!name) {
            return res.status(400).json({ error: 'Имя сделки (Name) обязательно' });
        }
        if (!userId) {
            return res.status(400).json({ error: 'ID пользователя (userId) обязателен' });
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
            OwnerId: userId, // Явно связываем созданную запись с пользователем
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
            res.status(400).json({ error: 'Не удалось создать сделку', details: insertResult.errors });
        }
    } catch (error) {
        console.error('Ошибка POST /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// 3. DELETE: Удаление сделки по ID
router.delete('/:id', async (req, res) => {
    try {
        const opportunityId = req.params.id;
        const conn = await getSalesforceConnection();

        const deleteResult = await conn.sobject('Opportunity').destroy(opportunityId);

        if (deleteResult.success) {
            res.status(200).json({ success: true, message: 'Запись успешно удалена' });
        } else {
            res.status(400).json({ error: 'Не удалось удалить запись', details: deleteResult.errors });
        }
    } catch (error) {
        console.error('Ошибка DELETE /api/opportunities:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;