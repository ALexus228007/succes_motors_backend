const express = require('express');
const router = express.Router();
const { getSalesforceConnection } = require('../services/salesforce');

// GET: Получить данные пользователя по его ID (вместо ScUserInfoController)
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id; // Извлекаем ID из URL: /api/users/005...

        if (!userId) {
            return res.status(400).json({ error: 'ID пользователя обязателен' });
        }

        const conn = await getSalesforceConnection();

        // Запрашиваем информацию о пользователе из Salesforce
        const queryResult = await conn.query(
            `SELECT Name, Email, Phone, Title, CompanyName, MediumPhotoUrl 
             FROM User 
             WHERE Id = '${userId}' 
             LIMIT 1`
        );

        if (queryResult.records.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const usr = queryResult.records[0];

        // Возвращаем JSON-структуру, идентичную врапперу UserInfoWrapper из Apex
        res.status(200).json({
            name: usr.Name || '-',
            email: usr.Email || '-',
            phone: usr.Phone || '-',
            title: usr.Title || '-',
            companyName: usr.CompanyName || '-',
            photoUrl: usr.MediumPhotoUrl || null
        });
    } catch (error) {
        console.error('Ошибка GET /api/users/:id:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;