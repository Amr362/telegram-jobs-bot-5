const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.HEALTH_PORT || 8080;

// متغيرات الحالة
let botStatus = {
    isRunning: false,
    lastCheck: null,
    uptime: 0,
    errors: [],
    performance: {
        averageResponseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
    }
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    const healthStatus = {
        status: botStatus.isRunning ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        bot: botStatus,
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        }
    };

    res.status(botStatus.isRunning ? 200 : 503).json(healthStatus);
});

// Status Dashboard
app.get('/dashboard', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arab Annotators Bot - Dashboard</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container { 
                max-width: 1200px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 15px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(45deg, #4CAF50, #45a049); 
                color: white; 
                padding: 30px; 
                text-align: center; 
            }
            .header h1 { font-size: 2.5em; margin-bottom: 10px; }
            .header p { font-size: 1.2em; opacity: 0.9; }
            .stats { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
                gap: 20px; 
                padding: 30px; 
            }
            .stat-card { 
                background: #f8f9fa; 
                padding: 25px; 
                border-radius: 10px; 
                text-align: center;
                border-left: 5px solid #4CAF50;
                transition: transform 0.3s ease;
            }
            .stat-card:hover { transform: translateY(-5px); }
            .stat-card h3 { color: #333; margin-bottom: 15px; font-size: 1.1em; }
            .stat-value { 
                font-size: 2.5em; 
                font-weight: bold; 
                color: #4CAF50; 
                margin-bottom: 10px; 
            }
            .status-indicator { 
                display: inline-block; 
                width: 12px; 
                height: 12px; 
                border-radius: 50%; 
                margin-left: 10px; 
            }
            .status-healthy { background-color: #4CAF50; }
            .status-unhealthy { background-color: #f44336; }
            .refresh-btn { 
                background: #4CAF50; 
                color: white; 
                border: none; 
                padding: 12px 25px; 
                border-radius: 5px; 
                cursor: pointer; 
                font-size: 1em;
                margin: 20px;
                transition: background 0.3s ease;
            }
            .refresh-btn:hover { background: #45a049; }
            .footer { 
                background: #333; 
                color: white; 
                text-align: center; 
                padding: 20px; 
            }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            .pulse { animation: pulse 2s infinite; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Arab Annotators Bot</h1>
                <p>لوحة المراقبة والتحكم</p>
                <span class="status-indicator ${botStatus.isRunning ? 'status-healthy' : 'status-unhealthy'}"></span>
                <span>${botStatus.isRunning ? 'يعمل بشكل طبيعي' : 'متوقف'}</span>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <h3>📊 حالة البوت</h3>
                    <div class="stat-value ${botStatus.isRunning ? '' : 'pulse'}">${botStatus.isRunning ? '✅' : '❌'}</div>
                    <p>${botStatus.isRunning ? 'نشط' : 'متوقف'}</p>
                </div>
                
                <div class="stat-card">
                    <h3>⏱️ وقت التشغيل</h3>
                    <div class="stat-value">${Math.floor(process.uptime() / 3600)}h</div>
                    <p>${Math.floor((process.uptime() % 3600) / 60)}m ${Math.floor(process.uptime() % 60)}s</p>
                </div>
                
                <div class="stat-card">
                    <h3>🔍 إجمالي الطلبات</h3>
                    <div class="stat-value">${botStatus.performance.totalRequests}</div>
                    <p>طلب بحث</p>
                </div>
                
                <div class="stat-card">
                    <h3>✅ الطلبات الناجحة</h3>
                    <div class="stat-value">${botStatus.performance.successfulRequests}</div>
                    <p>${botStatus.performance.totalRequests > 0 ? Math.round((botStatus.performance.successfulRequests / botStatus.performance.totalRequests) * 100) : 0}% نجح</p>
                </div>
                
                <div class="stat-card">
                    <h3>💾 استخدام الذاكرة</h3>
                    <div class="stat-value">${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}</div>
                    <p>MB</p>
                </div>
                
                <div class="stat-card">
                    <h3>⚡ متوسط الاستجابة</h3>
                    <div class="stat-value">${botStatus.performance.averageResponseTime}</div>
                    <p>ms</p>
                </div>
            </div>
            
            <div style="text-align: center; padding: 20px;">
                <button class="refresh-btn" onclick="location.reload()">🔄 تحديث</button>
                <button class="refresh-btn" onclick="window.open('/health', '_blank')">📊 API الصحة</button>
            </div>
            
            <div class="footer">
                <p>© 2024 Arab Annotators Bot v4.0 - تم التحديث: ${new Date().toLocaleString('ar-EG')}</p>
            </div>
        </div>
        
        <script>
            // تحديث تلقائي كل 30 ثانية
            setInterval(() => {
                fetch('/health')
                    .then(response => response.json())
                    .then(data => {
                        console.log('Health check:', data);
                    })
                    .catch(error => {
                        console.error('Health check failed:', error);
                    });
            }, 30000);
        </script>
    </body>
    </html>
    `);
});

// API لتحديث حالة البوت
app.post('/status', (req, res) => {
    const { isRunning, performance, errors } = req.body;
    
    botStatus = {
        ...botStatus,
        isRunning: isRunning !== undefined ? isRunning : botStatus.isRunning,
        lastCheck: new Date().toISOString(),
        performance: performance || botStatus.performance,
        errors: errors || botStatus.errors
    };
    
    res.json({ success: true, status: botStatus });
});

// Webhook للنشر من GitHub
app.post('/deploy', (req, res) => {
    console.log('🚀 Deployment webhook received:', req.body);
    
    // إعادة تشغيل البوت
    setTimeout(() => {
        process.exit(0); // سيتم إعادة التشغيل تلقائياً بواسطة Replit
    }, 1000);
    
    res.json({ 
        success: true, 
        message: 'Deployment initiated',
        timestamp: new Date().toISOString()
    });
});

// معالج الأخطاء
app.use((error, req, res, next) => {
    console.error('Health check error:', error);
    botStatus.errors.push({
        message: error.message,
        timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// بدء الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏥 Health check server running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    
    // فحص دوري لحالة البوت
    setInterval(() => {
        botStatus.lastCheck = new Date().toISOString();
        botStatus.uptime = process.uptime();
    }, 10000); // كل 10 ثوان
});

// معالجة إغلاق البرنامج
process.on('SIGTERM', () => {
    console.log('🛑 Health check server shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Health check server shutting down...');
    process.exit(0);
});

module.exports = app;

