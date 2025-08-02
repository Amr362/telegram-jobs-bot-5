
const express = require('express');
const app = express();

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send('✅ Arab Annotators Server is running!');
});

// endpoint للصحة
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        service: 'Arab Annotators Bot'
    });
});

// endpoint إضافي للبينغ
app.get('/ping', (req, res) => {
    res.send('pong');
});

// بدء تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`✅ Health endpoint: http://localhost:${PORT}/health`);
});
