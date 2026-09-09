require('dotenv').config();
const express = require('express');
const cors = require('cors');
const opportunityRouter = require('./routes/opportunity');
const userRouter = require('./routes/user'); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'The Node.js server is running successfully!' });
});

app.use('/api/opportunities', opportunityRouter);
app.use('/api/users', userRouter); 

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});