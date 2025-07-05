const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

app.get('/test', (req, res) => {
    res.json({ message: 'Test successful' });
});

app.get('*', (req, res) => {
    res.json({ message: 'Default route' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running on port ${PORT}`);
});