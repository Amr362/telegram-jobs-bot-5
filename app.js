
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

// إعداد البوت
console.log("🚀 بدء تشغيل Arab Annotators Bot...");

// التحقق من المتغيرات البيئية
const requiredEnvVars = ['BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ متغير البيئة ${envVar} مطلوب`);
        process.exit(1);
    }
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// إعداد خادم Express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Arab Annotators Bot is running',
        timestamp: new Date().toISOString() 
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        bot: 'running',
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 الخادم يعمل على المنفذ ${PORT}`);
});

// تحميل ملف التكوين
let config = {};
try {
    if (fs.existsSync('./config.json')) {
        config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } else {
        config = {
            jobSources: {
                "AI/ML": [
                    { name: "Outlier AI", url: "https://outlier.ai/careers" },
                    { name: "Scale AI", url: "https://scale.com/careers" },
                    { name: "Appen", url: "https://appen.com/careers" }
                ]
            }
        };
    }
} catch (error) {
    console.error("خطأ في قراءة ملف التكوين:", error);
    config = { jobSources: {} };
}

// الكلمات المفتاحية العربية
const arabicKeywords = [
    "arabic", "عربي", "عربية", "middle east", "الشرق الأوسط",
    "annotation", "تعليق", "labeling", "تصنيف",
    "ai training", "تدريب الذكاء الاصطناعي",
    "data collection", "جمع البيانات"
];

// حالة المستخدمين
const userStates = new Map();

// دالة البحث عن الوظائف
async function searchJobs() {
    console.log("🔍 بدء البحث عن الوظائف...");
    const jobs = [];
    
    try {
        // البحث في المواقع المكونة
        for (const [category, sites] of Object.entries(config.jobSources)) {
            for (const site of sites) {
                try {
                    console.log(`🔍 البحث في ${site.name}...`);
                    
                    const response = await axios.get(site.url, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });
                    
                    const $ = cheerio.load(response.data);
                    
                    // البحث عن الوظائف ذات الصلة
                    const siteJobs = [];
                    
                    $('a').each((i, element) => {
                        const text = $(element).text().toLowerCase();
                        const href = $(element).attr('href');
                        
                        if (href && arabicKeywords.some(keyword => text.includes(keyword.toLowerCase()))) {
                            const title = $(element).text().trim();
                            if (title.length > 10 && title.length < 200) {
                                siteJobs.push({
                                    title: title,
                                    url: href.startsWith('http') ? href : new URL(href, site.url).toString(),
                                    source: site.name,
                                    category: category,
                                    dateFound: new Date().toISOString()
                                });
                            }
                        }
                    });
                    
                    jobs.push(...siteJobs.slice(0, 3)); // أخذ أول 3 وظائف من كل موقع
                    console.log(`✅ وجدت ${siteJobs.length} وظائف في ${site.name}`);
                    
                } catch (siteError) {
                    console.error(`❌ خطأ في البحث في ${site.name}:`, siteError.message);
                }
            }
        }
        
        console.log(`🎯 إجمالي الوظائف الموجودة: ${jobs.length}`);
        return jobs.slice(0, 10); // إرجاع أول 10 وظائف
        
    } catch (error) {
        console.error("❌ خطأ في البحث عن الوظائف:", error);
        return [];
    }
}

// دالة إرسال الوظائف
async function sendJobsToUser(chatId, jobs) {
    if (!jobs || jobs.length === 0) {
        await bot.sendMessage(chatId, "❌ لم يتم العثور على وظائف جديدة في الوقت الحالي.");
        return;
    }
    
    await bot.sendMessage(chatId, `🎯 تم العثور على ${jobs.length} وظيفة:`);
    
    for (let i = 0; i < Math.min(jobs.length, 5); i++) {
        const job = jobs[i];
        const message = `
🔹 **${job.title}**
🏢 المصدر: ${job.source}
📂 الفئة: ${job.category}
🔗 [التقديم للوظيفة](${job.url})
📅 تم العثور عليها: ${new Date(job.dateFound).toLocaleDateString('ar')}
        `;
        
        try {
            await bot.sendMessage(chatId, message, { 
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });
        } catch (error) {
            console.error("خطأ في إرسال الوظيفة:", error);
        }
    }
}

// معالج الرسائل الرئيسي
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    
    console.log(`📨 رسالة من ${chatId}: ${text}`);
    
    if (text === '/start') {
        await bot.sendMessage(chatId, `
🤖 مرحباً بك في بوت Arab Annotators!

هذا البوت يساعدك في العثور على وظائف الذكاء الاصطناعي والتعليق التوضيحي للبيانات العربية.

الأوامر المتاحة:
/jobs - البحث عن الوظائف الجديدة
/help - المساعدة
/status - حالة البوت

🔍 سيتم البحث تلقائياً عن الوظائف كل ساعة وإرسال التحديثات.
        `);
    } else if (text === '/jobs') {
        await bot.sendMessage(chatId, "🔍 جاري البحث عن الوظائف...");
        const jobs = await searchJobs();
        await sendJobsToUser(chatId, jobs);
    } else if (text === '/help') {
        await bot.sendMessage(chatId, `
📋 **مساعدة بوت Arab Annotators**

🔍 /jobs - البحث عن أحدث الوظائف
📊 /status - عرض حالة البوت
❓ /help - عرض هذه المساعدة

🤖 يقوم البوت بالبحث التلقائي كل ساعة في:
- مواقع الذكاء الاصطناعي
- منصات التعليق التوضيحي
- شركات التقنية

📝 الكلمات المفتاحية: Arabic, AI, Annotation, Data Labeling
        `, { parse_mode: 'Markdown' });
    } else if (text === '/status') {
        await bot.sendMessage(chatId, `
📊 **حالة البوت**

✅ البوت يعمل بشكل طبيعي
🔍 عدد المواقع المراقبة: ${Object.values(config.jobSources).flat().length}
⏰ آخر بحث: ${new Date().toLocaleString('ar')}
🌐 الخادم: متصل

🔄 البحث التلقائي كل ساعة
        `, { parse_mode: 'Markdown' });
    }
});

// معالج الأخطاء
bot.on('error', (error) => {
    console.error('❌ خطأ في البوت:', error);
});

bot.on('polling_error', (error) => {
    console.error('❌ خطأ في الاقتراع:', error);
});

// البحث التلقائي كل ساعة
const jobSearchCron = new cron.CronJob('0 * * * *', async () => {
    console.log("⏰ بدء البحث التلقائي عن الوظائف...");
    try {
        const jobs = await searchJobs();
        if (jobs.length > 0) {
            console.log(`✅ تم العثور على ${jobs.length} وظائف جديدة`);
            // يمكن إضافة إرسال للمستخدمين المشتركين هنا
        }
    } catch (error) {
        console.error("❌ خطأ في البحث التلقائي:", error);
    }
});

jobSearchCron.start();

console.log("✅ تم تشغيل البوت بنجاح!");
console.log("🔍 البحث التلقائي كل ساعة مفعل");

// معالج إغلاق البرنامج
process.on('SIGINT', () => {
    console.log('🛑 إيقاف البوت...');
    jobSearchCron.stop();
    bot.stopPolling();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 إنهاء البوت...');
    jobSearchCron.stop();
    bot.stopPolling();
    process.exit(0);
});
