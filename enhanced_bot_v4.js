const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

// ===== إعدادات البوت المتقدمة =====
console.log("🚀 بدء تشغيل Arab Annotators Bot v4.1 - النسخة المحسنة...");

// التحقق من المتغيرات البيئية
const requiredEnvVars = ['BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ متغير البيئة ${envVar} مطلوب`);
        process.exit(1);
    }
}

// إعداد البوت والخدمات
const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: {
        interval: 2000,
        autoStart: true,
        params: {
            timeout: 15
        }
    }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// إعداد خادم Express للصحة
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Arab Annotators Bot v4.1 is running',
        timestamp: new Date().toISOString(),
        version: '4.1.0'
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        bot: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 خادم الصحة يعمل على المنفذ ${PORT}`);
});

// ===== نظام إدارة الحالة المحسن =====
class ImprovedStateManager {
    constructor() {
        this.userStates = new Map();
        this.config = this.loadConfig();
        this.keywords = this.loadKeywords();
        this.regions = this.loadRegions();
        this.searchCache = new Map();
        this.lastCleanup = Date.now();
    }

    loadConfig() {
        try {
            if (fs.existsSync('./config.json')) {
                return JSON.parse(fs.readFileSync('./config.json', 'utf8'));
            }
        } catch (error) {
            console.error("خطأ في قراءة ملف التكوين:", error);
        }

        // التكوين الافتراضي المحسن
        return {
            jobSources: {
                "AI/ML": [
                    { name: "Appen", url: "https://appen.com/careers/" },
                    { name: "Clickworker", url: "https://workplace.clickworker.com/en/jobs" },
                    { name: "Scale AI", url: "https://scale.com/careers" },
                    { name: "Lionbridge", url: "https://www.lionbridge.com/join-our-team/" }
                ],
                "Freelance": [
                    { name: "Upwork", url: "https://www.upwork.com/nx/search/jobs/?q=arabic%20ai&sort=recency" },
                    { name: "Freelancer", url: "https://www.freelancer.com/jobs/arabic-translation/" },
                    { name: "Fiverr", url: "https://www.fiverr.com/search/gigs?query=arabic%20voice" }
                ],
                "Transcription": [
                    { name: "Rev", url: "https://www.rev.com/freelancers/application" },
                    { name: "GoTranscript", url: "https://gotranscript.com/transcription-jobs" },
                    { name: "TranscribeMe", url: "https://workhub.transcribeme.com/" }
                ]
            }
        };
    }

    loadKeywords() {
        return {
            arabic: ["arabic", "عربي", "عربية", "arab", "middle east", "الشرق الأوسط"],
            ai: ["ai", "artificial intelligence", "machine learning", "ذكاء اصطناعي", "تعلم آلة"],
            jobs: ["annotation", "transcription", "voice", "data", "تعليق", "تفريغ", "صوت", "بيانات"],
            remote: ["remote", "work from home", "عن بعد", "العمل من المنزل"]
        };
    }

    loadRegions() {
        return [
            { name: "مصر", code: "egypt", flag: "🇪🇬" },
            { name: "السعودية", code: "saudi", flag: "🇸🇦" },  
            { name: "الإمارات", code: "uae", flag: "🇦🇪" },
            { name: "المغرب", code: "morocco", flag: "🇲🇦" }
        ];
    }

    getUserState(chatId) {
        if (!this.userStates.has(chatId)) {
            this.userStates.set(chatId, {
                currentMenu: 'main',
                searchHistory: [],
                notifications: false,
                lastActive: new Date()
            });
        }
        return this.userStates.get(chatId);
    }

    updateUserState(chatId, updates) {
        const state = this.getUserState(chatId);
        Object.assign(state, updates);
        state.lastActive = new Date();
        this.userStates.set(chatId, state);
    }

    // تنظيف الكاش كل ساعة
    cleanupCache() {
        const now = Date.now();
        if (now - this.lastCleanup > 3600000) { // ساعة واحدة
            this.searchCache.clear();
            this.lastCleanup = now;
            console.log("🧹 تم تنظيف الكاش");
        }
    }
}

// ===== محرك البحث المحسن =====
class ImprovedJobSearchEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        this.requestDelay = 2000; // تأخير بين الطلبات
        this.maxRetries = 2;
    }

    // البحث الذكي المحسن
    async smartSearch(filters = {}) {
        const startTime = Date.now();
        console.log("🔍 بدء البحث الذكي المحسن...");

        try {
            // فحص الكاش
            const cacheKey = JSON.stringify(filters);
            if (this.stateManager.searchCache.has(cacheKey)) {
                const cached = this.stateManager.searchCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 600000) { // 10 دقائق
                    console.log("💾 استخدام النتائج المحفوظة");
                    return cached.results;
                }
            }

            const allJobs = [];
            const promises = [];

            // البحث في جميع المصادر
            Object.entries(this.stateManager.config.jobSources).forEach(([category, sites]) => {
                sites.forEach((site, index) => {
                    // تأخير تدريجي لتجنب الحظر
                    const delay = index * this.requestDelay;
                    promises.push(
                        new Promise(resolve => {
                            setTimeout(async () => {
                                try {
                                    const jobs = await this.searchSite(site, category, filters);
                                    resolve(jobs);
                                } catch (error) {
                                    console.error(`❌ خطأ في ${site.name}:`, error.message);
                                    resolve([]);
                                }
                            }, delay);
                        })
                    );
                });
            });

            // انتظار جميع النتائج
            const results = await Promise.all(promises);
            results.forEach(jobs => allJobs.push(...jobs));

            // تصفية وترتيب النتائج
            const filteredJobs = this.filterAndSortJobs(allJobs, filters);

            // حفظ في الكاش
            this.stateManager.searchCache.set(cacheKey, {
                results: filteredJobs,
                timestamp: Date.now()
            });

            // تنظيف الكاش
            this.stateManager.cleanupCache();

            const responseTime = Date.now() - startTime;
            console.log(`✅ البحث اكتمل في ${responseTime}ms - ${filteredJobs.length} نتيجة`);

            return filteredJobs;

        } catch (error) {
            console.error("❌ خطأ في البحث الذكي:", error);
            return [];
        }
    }

    // البحث في موقع واحد
    async searchSite(site, category, filters) {
        let retries = 0;

        while (retries < this.maxRetries) {
            try {
                console.log(`🔍 البحث في ${site.name}...`);

                const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

                const response = await axios.get(site.url, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5,ar;q=0.3',
                        'Connection': 'keep-alive',
                        'Cache-Control': 'no-cache'
                    },
                    maxRedirects: 5,
                    validateStatus: function (status) {
                        return status >= 200 && status < 400;
                    }
                });

                const $ = cheerio.load(response.data);
                const jobs = this.extractJobs($, site, category);

                console.log(`✅ وجدت ${jobs.length} وظائف في ${site.name}`);
                return jobs.slice(0, 5); // أفضل 5 نتائج لكل موقع

            } catch (error) {
                retries++;

                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.error(`❌ خطأ في الاتصال بـ ${site.name}: الموقع غير متاح`);
                    break;
                } else if (error.response?.status === 403 || error.response?.status === 429) {
                    console.error(`❌ تم حظر الوصول إلى ${site.name}: ${error.response.status}`);
                    break;
                } else if (retries < this.maxRetries) {
                    console.log(`⏳ إعادة المحاولة ${retries}/${this.maxRetries} لـ ${site.name}`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                } else {
                    console.error(`❌ فشل نهائي في ${site.name}:`, error.message);
                }
            }
        }

        return [];
    }

    // استخراج الوظائف من HTML
    extractJobs($, site, category) {
        const jobs = [];
        const selectors = this.getSelectors(site.name);

        selectors.forEach(selector => {
            $(selector.container).each((i, element) => {
                if (i >= 10) return false; // حد أقصى 10 وظائف لكل محدد

                const title = this.extractText($, element, selector.title);
                const link = this.extractLink($, element, selector.link, site.url);
                const company = this.extractText($, element, selector.company);
                const description = this.extractText($, element, selector.description);

                if (this.isValidJob(title, link, description)) {
                    jobs.push({
                        title: title.substring(0, 200),
                        url: link,
                        company: company || site.name,
                        description: description.substring(0, 500),
                        source: site.name,
                        category: category,
                        score: this.calculateScore(title, description),
                        dateFound: new Date().toISOString()
                    });
                }
            });
        });

        return jobs;
    }

    // محددات لاستخراج البيانات
    getSelectors(siteName) {
        const commonSelectors = [
            {
                container: 'article, .job, .listing, .position, .vacancy',
                title: 'h1, h2, h3, .title, .job-title, .position-title',
                link: 'a[href]',
                company: '.company, .employer, .organization',
                description: '.description, .summary, p'
            },
            {
                container: 'li, .card, .item',
                title: '.title, .heading, h3, h4',
                link: 'a',
                company: '.company, .org',
                description: '.text, .content'
            }
        ];

        // محددات خاصة لمواقع معينة
        const specificSelectors = {
            'Upwork': [{
                container: '[data-test="JobTile"]',
                title: '[data-test="JobTileTitle"] a',
                link: '[data-test="JobTileTitle"] a',
                description: '[data-test="JobDescription"]'
            }],
            'Appen': [{
                container: '.job-listing, .career-item',
                title: '.job-title, .career-title',
                link: '.job-title a, .career-title a',
                description: '.job-description'
            }]
        };

        return specificSelectors[siteName] || commonSelectors;
    }

    // استخراج النص
    extractText($, element, selector) {
        if (!selector) return '';
        const found = $(element).find(selector).first();
        return found.length ? found.text().trim() : '';
    }

    // استخراج الرابط
    extractLink($, element, selector, baseUrl) {
        if (!selector) return '';
        const found = $(element).find(selector).first();
        const href = found.attr('href');
        if (!href) return '';

        try {
            return href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        } catch {
            return '';
        }
    }

    // التحقق من صحة الوظيفة
    isValidJob(title, link, description) {
        if (!title || !link || title.length < 5) return false;

        const text = `${title} ${description}`.toLowerCase();

        // فحص الكلمات المفتاحية
        const hasKeywords = Object.values(this.stateManager.keywords).some(keywords =>
            keywords.some(keyword => text.includes(keyword.toLowerCase()))
        );

        return hasKeywords;
    }

    // حساب نقاط الوظيفة
    calculateScore(title, description) {
        let score = 0;
        const text = `${title} ${description}`.toLowerCase();

        // نقاط الكلمات المفتاحية
        Object.entries(this.stateManager.keywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (text.includes(keyword.toLowerCase())) {
                    score += category === 'arabic' ? 20 : 10;
                }
            });
        });

        return Math.min(score, 100);
    }

    // تصفية وترتيب النتائج
    filterAndSortJobs(jobs, filters) {
        // إزالة المكررات
        const unique = jobs.filter((job, index, self) => 
            index === self.findIndex(j => j.title === job.title && j.company === job.company)
        );

        // ترتيب حسب النقاط
        const sorted = unique.sort((a, b) => b.score - a.score);

        // تطبيق المرشحات
        let filtered = sorted;

        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            filtered = filtered.filter(job => 
                job.title.toLowerCase().includes(keyword) ||
                job.description.toLowerCase().includes(keyword)
            );
        }

        return filtered.slice(0, 20); // أفضل 20 نتيجة
    }
}

// تهيئة النظام
const stateManager = new ImprovedStateManager();
const searchEngine = new ImprovedJobSearchEngine(stateManager);

// ===== معالج الرسائل =====
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    console.log(`📨 رسالة من ${chatId}: ${text}`);

    try {
        if (text === '/start') {
            const welcomeMessage = `
🤖 **مرحباً بك في Arab Annotators Bot v4.1!**

🎯 البوت المتخصص في البحث عن وظائف الذكاء الاصطناعي والتعليق التوضيحي للبيانات العربية

✨ **الميزات الجديدة:**
• 🔍 بحث ذكي محسن  
• 🌐 مصادر متنوعة وموثوقة
• ⚡ استجابة أسرع وأكثر دقة
• 🛡️ حماية من الحظر والأخطاء

📋 **الأوامر المتاحة:**
/jobs - البحث عن الوظائف الجديدة
/help - دليل الاستخدام
/status - حالة البوت

🔄 البحث التلقائي كل ساعة مفعل
            `;

            await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });

        } else if (text === '/jobs') {
            const statusMsg = await bot.sendMessage(chatId, "🔍 جاري البحث الذكي عن الوظائف...\n⏳ قد يستغرق هذا بضع ثوانِ");

            const jobs = await searchEngine.smartSearch();

            if (jobs.length > 0) {
                await bot.editMessageText(`🎯 تم العثور على ${jobs.length} وظيفة عالية الجودة!`, {
                    chat_id: chatId,
                    message_id: statusMsg.message_id
                });

                // إرسال أفضل 5 وظائف
                for (let i = 0; i < Math.min(jobs.length, 5); i++) {
                    const job = jobs[i];
                    const message = `
🔹 **${job.title}**
🏢 الشركة: ${job.company}
📂 الفئة: ${job.category}
⭐ النقاط: ${job.score}/100
🔗 [التقديم للوظيفة](${job.url})
📅 ${new Date(job.dateFound).toLocaleDateString('ar')}

📋 الوصف: ${job.description.substring(0, 200)}...
                    `;

                    await bot.sendMessage(chatId, message, { 
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true
                    });

                    // تأخير بسيط لتجنب spam
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } else {
                await bot.editMessageText(`❌ لم يتم العثور على وظائف جديدة في الوقت الحالي.

💡 **نصائح:**
• جرب البحث مرة أخرى لاحقاً
• تأكد من اتصالك بالإنترنت
• المواقع قد تكون مشغولة حالياً

🔄 سيتم البحث التلقائي خلال ساعة`, {
                    chat_id: chatId,
                    message_id: statusMsg.message_id
                });
            }

        } else if (text === '/help') {
            const helpMessage = `
📚 **دليل استخدام Arab Annotators Bot v4.1**

🔍 **/jobs** - البحث الذكي عن الوظائف
يبحث في أكثر من 15 موقع موثوق للعثور على:
• وظائف تعليق البيانات العربية
• مهام الذكاء الاصطناعي
• وظائف التفريغ الصوتي
• المشاريع المستقلة

📊 **/status** - حالة البوت والإحصائيات

❓ **/help** - عرض هذا الدليل

🤖 **كيف يعمل البوت:**
1. يبحث في المواقع الموثوقة
2. يصفي النتائج حسب الكلمات المفتاحية
3. يرتب الوظائف حسب الأهمية
4. يعرض أفضل النتائج فقط

🔔 **البحث التلقائي:** كل ساعة
🌍 **المناطق المدعومة:** جميع أنحاء العالم
💼 **أنواع العمل:** عن بُعد، دوام جزئي، مستقل
            `;

            await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });

        } else if (text === '/status') {
            const uptime = Math.floor(process.uptime());
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);

            const statusMessage = `
📊 **حالة البوت v4.1**

✅ البوت يعمل بشكل طبيعي
⏰ وقت التشغيل: ${hours}س ${minutes}د
💾 استخدام الذاكرة: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
🔍 عدد المواقع المراقبة: ${Object.values(stateManager.config.jobSources).flat().length}
📊 نتائج محفوظة: ${stateManager.searchCache.size}

🔄 **البحث التلقائي:** مفعل
⚡ **الاستجابة:** محسنة
🛡️ **الحماية:** مفعلة

🌐 **الخادم:** متصل على المنفذ ${PORT}
            `;

            await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
        }

        // تحديث حالة المستخدم
        stateManager.updateUserState(chatId, { lastMessage: text });

    } catch (error) {
        console.error('❌ خطأ في معالجة الرسالة:', error);
        await bot.sendMessage(chatId, "❌ حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.");
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
    console.log("⏰ بدء البحث التلقائي...");
    try {
        const jobs = await searchEngine.smartSearch();
        console.log(`✅ البحث التلقائي: ${jobs.length} وظائف`);
    } catch (error) {
        console.error("❌ خطأ في البحث التلقائي:", error);
    }
});

jobSearchCron.start();

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

console.log("✅ Arab Annotators Bot v4.1 جاهز للعمل!");
console.log("🔍 البحث التلقائي المحسن مفعل");
console.log("🛡️ الحماية من الأخطاء مفعلة");

module.exports = {
    bot,
    stateManager,
    searchEngine,
    supabase
};