require('dotenv').config();
const express = require('express');
const cors = require('cors');
const opportunityRouter = require('./routes/opportunity');
const userRouter = require('./routes/user'); // Подключаем роутер пользователей

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Проверочный эндпоинт
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Node.js сервер работает успешно!' });
});

// Роуты приложения
app.use('/api/opportunities', opportunityRouter);
app.use('/api/users', userRouter); // Монтируем роут пользователей на /api/users

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});