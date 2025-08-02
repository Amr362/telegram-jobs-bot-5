
const express = require('express');
const app = express();

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.send('✅ Arab Annotators Server is running!');
});

// endpoint للصحة
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
    });
});

// endpoint إضافي للبينغ
app.get('/ping', (req, res) => {
    res.send('pong');
});

// بدء تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`✅ Health endpoint available at /health`);
});
