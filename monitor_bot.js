
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🔍 بدء مراقب البوت...');

let botProcess = null;
let restartCount = 0;
const maxRestarts = 10;

function startBot() {
    if (restartCount >= maxRestarts) {
        console.error(`❌ تم الوصول للحد الأقصى من إعادة التشغيل (${maxRestarts})`);
        process.exit(1);
    }

    console.log(`🚀 تشغيل البوت (المحاولة ${restartCount + 1})`);
    
    botProcess = spawn('node', ['enhanced_bot_v4.js'], {
        stdio: 'inherit',
        env: process.env
    });

    botProcess.on('exit', (code, signal) => {
        console.log(`⚠️ البوت توقف - كود: ${code}, إشارة: ${signal}`);
        restartCount++;
        
        if (code !== 0) {
            console.log(`🔄 إعادة تشغيل البوت خلال 5 ثوانِ... (${restartCount}/${maxRestarts})`);
            setTimeout(startBot, 5000);
        }
    });

    botProcess.on('error', (error) => {
        console.error('❌ خطأ في عملية البوت:', error);
        restartCount++;
        setTimeout(startBot, 5000);
    });
}

// إعادة تعيين عداد إعادة التشغيل كل ساعة
setInterval(() => {
    restartCount = 0;
    console.log('🔄 إعادة تعيين عداد إعادة التشغيل');
}, 3600000);

// التعامل مع إشارات الإنهاء
process.on('SIGINT', () => {
    console.log('🛑 إيقاف مراقب البوت...');
    if (botProcess) {
        botProcess.kill();
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 إنهاء مراقب البوت...');
    if (botProcess) {
        botProcess.kill();
    }
    process.exit(0);
});

// بدء البوت
startBot();
