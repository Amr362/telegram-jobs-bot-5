// ===== معالج الأخطاء العام =====
process.on('uncaughtException', (error) => {
    console.error('❌ خطأ غير معالج:', error);
    console.log('🔄 إعادة تشغيل البوت خلال 5 ثوانِ...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ رفض غير معالج:', reason);
    console.log('🔄 إعادة تشغيل البوت خلال 5 ثوانِ...');
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

// Keep-alive للخادم
setInterval(() => {
    console.log(`💓 البوت يعمل - ${new Date().toISOString()}`);
}, 300000); // كل 5 دقائق

// ===== بدء البوت =====
async function startBot() {