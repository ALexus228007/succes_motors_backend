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

        // Очищаем ссылку: если она абсолютная, оставляем только относительный путь
        let relativePhotoUrl = usr.MediumPhotoUrl;
        if (relativePhotoUrl && relativePhotoUrl.startsWith('http')) {
            try {
                const urlObj = new URL(relativePhotoUrl);
                relativePhotoUrl = urlObj.pathname + urlObj.search; // Оставит только /profilephoto/... или /services/...
            } catch (e) {
                console.error('Ошибка парсинга URL фото:', e);
            }
        }

        res.status(200).json({
            name: usr.Name || '-',
            email: usr.Email || '-',
            phone: usr.Phone || '-',
            title: usr.Title || '-',
            companyName: usr.CompanyName || '-',
            photoUrl: relativePhotoUrl || null // Отправляем чистый относительный путь
        });
    } catch (error) {
        console.error('Ошибка GET /api/users/:id:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;