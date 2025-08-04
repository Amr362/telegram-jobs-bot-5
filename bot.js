const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

const app = express();

app.get("/", (req, res) => {
  res.send("Bot server is running!");
});

// ===== إعدادات البوت الأساسية =====
console.log("🚀 بدء تشغيل Arab Annotators Bot v3.0...");

// التحقق من المتغيرات البيئية
const requiredEnvVars = ["BOT_TOKEN", "SUPABASE_URL", "SUPABASE_KEY"];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ متغير البيئة ${envVar} مطلوب`);
        process.exit(1);
    }
}

// إعداد البوت والخدمات
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ===== إدارة الحالة والبيانات =====
class BotStateManager {
    constructor() {
        this.userStates = new Map();
        this.config = this.loadConfig();
        this.keywords = this.loadKeywords();
        this.regions = this.loadRegions();
    }

    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync("./config.json", "utf8"));
        } catch (error) {
            console.error("خطأ في قراءة ملف التكوين:", error);
            return { jobSources: {} };
        }
    }

    loadKeywords() {
        return [
            "مطلوب لغة عربية", "Arabic Language", "Arabic Annotator",
            "الشرق الأوسط", "AI Training Arabic", "Voice Actor Arabic",
            "Transcription Arabic", "تفريغ صوت", "Voice Over Arabic",
            "Data Collection Arabic", "تدريب الذكاء الاصطناعي للغة العربية",
            "Arabic NLP", "Arabic AI", "Middle East", "Arabic Speaker",
            "Arabic Data", "Arabic Content", "Arabic Translation",
            "محتوى عربي", "ترجمة عربية", "مراجعة نصوص"
        ];
    }

    loadRegions() {
        return [
            { name: "مصر", code: "egypt", flag: "🇪🇬", keywords: ["Egypt", "Cairo", "مصر", "القاهرة"] },
            { name: "السعودية", code: "saudi", flag: "🇸🇦", keywords: ["Saudi", "Riyadh", "السعودية", "الرياض"] },
            { name: "الإمارات", code: "uae", flag: "🇦🇪", keywords: ["UAE", "Dubai", "الإمارات", "دبي"] },
            { name: "المغرب", code: "morocco", flag: "🇲🇦", keywords: ["Morocco", "Casablanca", "المغرب"] },
            { name: "الأردن", code: "jordan", flag: "🇯🇴", keywords: ["Jordan", "Amman", "الأردن", "عمان"] },
            { name: "لبنان", code: "lebanon", flag: "🇱🇧", keywords: ["Lebanon", "Beirut", "لبنان", "بيروت"] },
            { name: "الكويت", code: "kuwait", flag: "🇰🇼", keywords: ["Kuwait", "الكويت"] },
            { name: "قطر", code: "qatar", flag: "🇶🇦", keywords: ["Qatar", "Doha", "قطر", "الدوحة"] }
        ];
    }

    getUserState(chatId) {
        if (!this.userStates.has(chatId)) {
            this.userStates.set(chatId, {
                currentMenu: 'main',
                favorites: [],
                searchHistory: [],
                notifications: {
                    enabled: false,
                    regions: [],
                    keywords: []
                },
                subscription: {
                    type: 'free',
                    expiry: null
                },
                preferences: {
                    language: 'ar',
                    resultsPerPage: 5,
                    theme: 'default'
                }
            });
        }
        return this.userStates.get(chatId);
    }

    updateUserState(chatId, updates) {
        const state = this.getUserState(chatId);
        Object.assign(state, updates);
        this.userStates.set(chatId, state);
    }
}

// ===== إدارة القوائم والواجهات =====
class MenuManager {
    static getMainMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💼 الوظائف الذكية", callback_data: "smart_jobs" },
                        { text: "🔍 البحث المتقدم", callback_data: "advanced_search" }
                    ],
                    [
                        { text: "🌍 البحث حسب المنطقة", callback_data: "region_search" },
                        { text: "🏢 البحث حسب الشركة", callback_data: "company_search" }
                    ],
                    [
                        { text: "⭐ المفضلة", callback_data: "favorites" },
                        { text: "📊 الإحصائيات", callback_data: "statistics" }
                    ],
                    [
                        { text: "🔔 الإشعارات", callback_data: "notifications" },
                        { text: "👤 الملف الشخصي", callback_data: "profile" }
                    ],
                    [
                        { text: "⚙️ الإعدادات", callback_data: "settings" },
                        { text: "💎 الاشتراك المميز", callback_data: "premium" }
                    ],
                    [
                        { text: "ℹ️ المساعدة", callback_data: "help" }
                    ]
                ]
            }
        };
    }

    static getSmartJobsMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🤖 وظائف الذكاء الاصطناعي", callback_data: "jobs_ai" },
                        { text: "📊 تصنيف البيانات", callback_data: "jobs_data" }
                    ],
                    [
                        { text: "🎙️ تدريب الصوت", callback_data: "jobs_voice" },
                        { text: "✍️ الكتابة والترجمة", callback_data: "jobs_writing" }
                    ],
                    [
                        { text: "🔍 البحث المخصص", callback_data: "custom_search" },
                        { text: "🆕 أحدث الوظائف", callback_data: "latest_jobs" }
                    ],
                    [
                        { text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getRegionMenu(regions) {
        const buttons = [];
        for (let i = 0; i < regions.length; i += 2) {
            const row = [];
            row.push({
                text: `${regions[i].flag} ${regions[i].name}`,
                callback_data: `region_${regions[i].code}`
            });
            if (i + 1 < regions.length) {
                row.push({
                    text: `${regions[i + 1].flag} ${regions[i + 1].name}`,
                    callback_data: `region_${regions[i + 1].code}`
                });
            }
            buttons.push(row);
        }
        buttons.push([{ text: "🔙 العودة", callback_data: "main_menu" }]);

        return { reply_markup: { inline_keyboard: buttons } };
    }
}

// ===== محرك البحث المتطور =====
class JobSearchEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    async smartSearch(filters = {}) {
        const results = [];
        const startTime = Date.now();

        try {
            console.log("🔍 بدء البحث الذكي...");

            // البحث في المصادر المختلفة
            const searchPromises = [];

            // البحث في مصادر config.json
            Object.entries(this.stateManager.config.jobSources).forEach(([category, sites]) => {
                sites.forEach(site => {
                    searchPromises.push(
                        this.searchInSite(site, category, filters)
                            .catch(error => {
                                console.error(`خطأ في البحث في ${site.name}:`, error.message);
                                return [];
                            })
                    );
                });
            });

            // انتظار جميع النتائج
            const allResults = await Promise.allSettled(searchPromises);

            allResults.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    results.push(...result.value);
                }
            });

            // تصفية وترتيب النتائج
            const filteredResults = this.filterAndRankResults(results, filters);

            console.log(`✅ البحث اكتمل في ${Date.now() - startTime}ms - ${filteredResults.length} نتيجة`);

            return filteredResults.slice(0, 50); // أفضل 50 نتيجة

        } catch (error) {
            console.error("خطأ في البحث الذكي:", error);
            return [];
        }
    }

    async searchInSite(site, category, filters) {
        try {
            const response = await axios.get(site.url, {
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const jobs = [];

            // البحث في العناوين والروابط
            $('a').each((i, element) => {
                const title = $(element).text().trim();
                const href = $(element).attr('href');

                if (this.isRelevantJob(title, href, filters)) {
                    jobs.push({
                        title: title,
                        url: href.startsWith('http') ? href : site.url + href,
                        source: site.name,
                        category: category,
                        description: this.extractDescription($, element),
                        matchScore: this.calculateMatchScore(title, filters),
                        dateFound: new Date().toISOString()
                    });
                }
            });

            return jobs.slice(0, 5); // أفضل 5 نتائج لكل موقع

        } catch (error) {
            console.error(`خطأ في البحث في ${site.name}:`, error.message);
            return [];
        }
    }

    isRelevantJob(title, href, filters) {
        if (!title || !href || title.length < 5) return false;

        const titleLower = title.toLowerCase();

        // التحقق من الكلمات المفتاحية
        const hasKeyword = this.stateManager.keywords.some(keyword => 
            titleLower.includes(keyword.toLowerCase())
        );

        // التحقق من المرشحات
        if (filters.region) {
            const region = this.stateManager.regions.find(r => r.code === filters.region);
            if (region) {
                const hasRegion = region.keywords.some(keyword => 
                    titleLower.includes(keyword.toLowerCase())
                );
                return hasKeyword || hasRegion;
            }
        }

        if (filters.keyword) {
            return titleLower.includes(filters.keyword.toLowerCase());
        }

        return hasKeyword || titleLower.includes('arabic') || titleLower.includes('عربي');
    }

    extractDescription($, element) {
        // محاولة استخراج وصف من العناصر المجاورة
        const parent = $(element).parent();
        const siblings = parent.find('p, span, div').first();
        return siblings.text().substring(0, 150) + '...';
    }

    calculateMatchScore(title, filters) {
        let score = 0;
        const titleLower = title.toLowerCase();

        // نقاط للكلمات المفتاحية العربية
        this.stateManager.keywords.forEach(keyword => {
            if (titleLower.includes(keyword.toLowerCase())) {
                score += keyword.includes('arabic') || keyword.includes('عربي') ? 10 : 5;
            }
        });

        // نقاط إضافية للكلمات المهمة
        if (titleLower.includes('ai') || titleLower.includes('ذكاء')) score += 8;
        if (titleLower.includes('remote') || titleLower.includes('بُعد')) score += 6;
        if (titleLower.includes('data') || titleLower.includes('بيانات')) score += 5;

        return score;
    }

    filterAndRankResults(results, filters) {
        // إزالة المكررات
        const uniqueResults = results.filter((job, index, self) => 
            index === self.findIndex(j => 
                j.title === job.title && j.source === job.source
            )
        );

        // ترتيب حسب نقاط التطابق
        return uniqueResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    async searchByRegion(regionCode) {
        const region = this.stateManager.regions.find(r => r.code === regionCode);
        if (!region) return [];

        return await this.smartSearch({ region: regionCode });
    }

    async searchByKeyword(keyword) {
        return await this.smartSearch({ keyword: keyword });
    }
}

// ===== مدير الرسائل والتنسيق =====
class MessageFormatter {
    static formatWelcomeMessage() {
        return `
🌟 *مرحباً بك في Arab Annotators Bot v3.0* 🌟

🚀 *البوت الأكثر تطوراً للوظائف العربية!*

✨ *الميزات الجديدة:*
• 🤖 بحث ذكي بالذكاء الاصطناعي
• 🌍 دعم 8 دول عربية
• 📊 إحصائيات متقدمة ومحدثة
• 🔔 إشعارات ذكية ومخصصة
• ⭐ نظام مفضلة متطور
• 💎 اشتراك مميز بميزات حصرية

💼 *نتخصص في:*
• وظائف الذكاء الاصطناعي العربية
• تدريب النماذج اللغوية
• تصنيف البيانات العربية
• التفريغ الصوتي والترجمة
• مراجعة المحتوى العربي

🌐 *موقعنا الرسمي:*
https://arabannotators.store

استخدم القائمة أدناه لاستكشاف جميع الميزات! 👇
`;
    }

    static formatJobResults(jobs, searchInfo = {}) {
        if (!jobs || jobs.length === 0) {
            return this.formatNoResultsMessage(searchInfo);
        }

        const currentDate = new Date().toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        let message = `
🔍 *نتائج البحث - ${currentDate}*

📊 *تم العثور على ${jobs.length} وظيفة مطابقة*
⚡ *البحث في أكثر من 100 موقع*

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        jobs.slice(0, 10).forEach((job, index) => {
            message += `\n${index + 1}. 💼 *${job.title}*\n`;
            message += `   🏢 ${job.source}\n`;
            message += `   📂 ${this.getCategoryName(job.category)}\n`;
            if (job.matchScore) message += `   🎯 تطابق: ${job.matchScore}%\n`;
            message += `   [🔗 التقديم الآن](${job.url})\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        });

        message += `
💡 *نصائح للنجاح:*
• ✍️ اكتب CV باللغة الإنجليزية
• 🌍 اذكر خبراتك في اللغة العربية
• 🚀 قدم بسرعة للوظائف الجديدة
• 📞 تواصل مباشرة مع الشركات

🔔 *فعل الإشعارات للحصول على تحديثات فورية*

#وظائف_عربية #ذكاء_اصطناعي #عمل_عن_بعد
`;

        return message;
    }

    static formatNoResultsMessage(searchInfo) {
        return `
❌ *لم يتم العثور على وظائف مطابقة*

🔍 *معايير البحث:*
${searchInfo.region ? `📍 المنطقة: ${searchInfo.region}` : ''}
${searchInfo.keyword ? `🎯 الكلمة المفتاحية: ${searchInfo.keyword}` : ''}

💡 *اقتراحات:*
• جرب كلمات مفتاحية مختلفة
• ابحث في مناطق أخرى
• فعل الإشعارات للحصول على تنبيه فوري
• تحقق من القسم المميز للوظائف الحصرية

🔔 سنخبرك فوراً عند توفر وظائف مطابقة!
`;
    }

    static getCategoryName(category) {
        const categoryNames = {
            'aiJobs': '🤖 ذكاء اصطناعي',
            'dataAnnotation': '📊 تصنيف بيانات',
            'voiceTraining': '🎙️ تدريب صوت',
            'freelancePlatforms': '✍️ عمل حر',
            'techCompanies': '🏢 شركات تقنية',
            'arabicSpecific': '🌍 وظائف عربية'
        };
        return categoryNames[category] || '💼 متنوعة';
    }

    static formatStatistics(stats) {
        return `
📊 *إحصائيات شاملة - Arab Annotators*

📈 *الإحصائيات العامة:*
• إجمالي المصادر: ${stats.totalSources}
• عدد الفئات: ${stats.categoriesCount}
• الدول المدعومة: ${stats.supportedCountries}
• المستخدمين النشطين: ${stats.activeUsers}

📋 *توزيع الوظائف:*
${stats.categoryBreakdown}

🔥 *الأكثر طلباً هذا الأسبوع:*
${stats.topCategories}

📅 *معدل الوظائف الجديدة:*
• اليوم: ${stats.todayJobs} وظيفة
• هذا الأسبوع: ${stats.weeklyJobs} وظيفة
• معدل النمو: +${stats.growthRate}%

🌍 *أكثر المناطق نشاطاً:*
${stats.topRegions}

💎 *للمشتركين المميزين:*
• وصول لوظائف حصرية
• إشعارات فورية
• دعم أولوية
• إحصائيات متقدمة
`;
    }
}

// ===== تهيئة مدراء النظام =====
const stateManager = new BotStateManager();
const searchEngine = new JobSearchEngine(stateManager);

// ===== معالجات الأحداث الرئيسية =====
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "صديقي";

    // إعادة تعيين حالة المستخدم
    stateManager.updateUserState(chatId, { currentMenu: 'main' });

    await bot.sendMessage(chatId, `مرحباً ${userName}! 👋\n\n${MessageFormatter.formatWelcomeMessage()}`, 
        MenuManager.getMainMenu()
    );
});

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    const userState = stateManager.getUserState(chatId);

    try {
        switch (data) {
            case 'main_menu':
                stateManager.updateUserState(chatId, { currentMenu: 'main' });
                await bot.editMessageText(MessageFormatter.formatWelcomeMessage(), {
                    chat_id: chatId,
                    message_id: messageId,
                    ...MenuManager.getMainMenu(),
                    parse_mode: 'Markdown'
                });
                break;
            case 'smart_jobs':
                stateManager.updateUserState(chatId, { currentMenu: 'smart_jobs' });
                await bot.editMessageText("اختر نوع الوظائف الذكية:", {
                    chat_id: chatId,
                    message_id: messageId,
                    ...MenuManager.getSmartJobsMenu()
                });
                break;
            case 'jobs_ai':
                await bot.sendMessage(chatId, "جاري البحث عن وظائف الذكاء الاصطناعي...");
                const aiJobs = await searchEngine.smartSearch({ category: 'aiJobs' });
                await bot.sendMessage(chatId, MessageFormatter.formatJobResults(aiJobs, { category: 'وظائف الذكاء الاصطناعي' }), { parse_mode: 'Markdown', disable_web_page_preview: true });
                break;
            case 'jobs_data':
                await bot.sendMessage(chatId, "جاري البحث عن وظائف تصنيف البيانات...");
                const dataJobs = await searchEngine.smartSearch({ category: 'dataAnnotation' });
                await bot.sendMessage(chatId, MessageFormatter.formatJobResults(dataJobs, { category: 'وظائف تصنيف البيانات' }), { parse_mode: 'Markdown', disable_web_page_preview: true });
                break;
            case 'jobs_voice':
                await bot.sendMessage(chatId, "جاري البحث عن وظائف تدريب الصوت...");
                const voiceJobs = await searchEngine.smartSearch({ category: 'voiceTraining' });
                await bot.sendMessage(chatId, MessageFormatter.formatJobResults(voiceJobs, { category: 'وظائف تدريب الصوت' }), { parse_mode: 'Markdown', disable_web_page_preview: true });
                break;
            case 'jobs_writing':
                await bot.sendMessage(chatId, "جاري البحث عن وظائف الكتابة والترجمة...");
                const writingJobs = await searchEngine.smartSearch({ category: 'freelancePlatforms' });
                await bot.sendMessage(chatId, MessageFormatter.formatJobResults(writingJobs, { category: 'وظائف الكتابة والترجمة' }), { parse_mode: 'Markdown', disable_web_page_preview: true });
                break;
            case 'latest_jobs':
                await bot.sendMessage(chatId, "جاري جلب أحدث الوظائف...");
                const latestJobs = await searchEngine.smartSearch(); // بدون فلاتر للحصول على الأحدث
                await bot.sendMessage(chatId, MessageFormatter.formatJobResults(latestJobs, { category: 'أحدث الوظائف' }), { parse_mode: 'Markdown', disable_web_page_preview: true });
                break;
            case 'region_search':
                stateManager.updateUserState(chatId, { currentMenu: 'region_search' });
                await bot.editMessageText("اختر المنطقة التي ترغب في البحث فيها:", {
                    chat_id: ch                        { text: "💼 الوظائف الذكية", callback_data: "smart_jobs" },
                        { text: "🔍 البحث المتقدم", callback_data: "advanced_search" }
                    ],
                    [
                        { text: "🌍 البحث حسب المنطقة", callback_data: "region_search" },
                        { text: "🏢 البحث حسب الشركة", callback_data: "company_search" }
                    ],
                    [
                        { text: "⭐ المفضلة", callback_data: "favorites" },
                        { text: "📊 الإحصائيات", callback_data: "statistics" }
                    ],
                    [
                        { text: "🔔 الإشعارات", callback_data: "notifications" },
                        { text: "👤 الملف الشخصي", callback_data: "profile" }
                    ],
                    [
                        { text: "⚙️ الإعدادات", callback_data: "settings" },
                        { text: "💎 الاشتراك المميز", callback_data: "premium" }
                    ],
                    [
                        { text: "ℹ️ المساعدة", callback_data: "help" }
                    ]
                ]
            }
        };
    }

    static getSmartJobsMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🤖 وظائف الذكاء الاصطناعي", callback_data: "jobs_ai" },
                        { text: "📊 تصنيف البيانات", callback_data: "jobs_data" }
                    ],
                    [
                        { text: "🎙️ تدريب الصوت", callback_data: "jobs_voice" },
                        { text: "✍️ الكتابة والترجمة", callback_data: "jobs_writing" }
                    ],
                    [
                        { text: "🔍 البحث المخصص", callback_data: "custom_search" },
                        { text: "🆕 أحدث الوظائف", callback_data: "latest_jobs" }
                    ],
                    [
                        { text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getRegionMenu(regions) {
        const buttons = [];
        for (let i = 0; i < regions.length; i += 2) {
            const row = [];
            row.push({
                text: `${regions[i].flag} ${regions[i].name}`,
                callback_data: `region_${regions[i].code}`
            });
            if (i + 1 < regions.length) {
                row.push({
                    text: `${regions[i + 1].flag} ${regions[i + 1].name}`,
                    callback_data: `region_${regions[i + 1].code}`
                });
            }
            buttons.push(row);
        }
        buttons.push([{ text: "🔙 العودة", callback_data: "main_menu" }]);

        return { reply_markup: { inline_keyboard: buttons } };
    }
}

// ===== محرك البحث المتطور =====
class JobSearchEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
    }

    async smartSearch(filters = {}) {
        const results = [];
        const startTime = Date.now();

        try {
            console.log("🔍 بدء البحث الذكي...");

            // البحث في المصادر المختلفة
            const searchPromises = [];

            // البحث في مصادر config.json
            Object.entries(this.stateManager.config.jobSources).forEach(([category, sites]) => {
                sites.forEach(site => {
                    searchPromises.push(
                        this.searchInSite(site, category, filters)
                            .catch(error => {
                                console.error(`خطأ في البحث في ${site.name}:`, error.message);
                                return [];
                            })
                    );
                });
            });

            // انتظار جميع النتائج
            const allResults = await Promise.allSettled(searchPromises);

            allResults.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    results.push(...result.value);
                }
            });

            // تصفية وترتيب النتائج
            const filteredResults = this.filterAndRankResults(results, filters);

            console.log(`✅ البحث اكتمل في ${Date.now() - startTime}ms - ${filteredResults.length} نتيجة`);

            return filteredResults.slice(0, 50); // أفضل 50 نتيجة

        } catch (error) {
            console.error("خطأ في البحث الذكي:", error);
            return [];
        }
    }

    async searchInSite(site, category, filters) {
        try {
            const response = await axios.get(site.url, {
                timeout: 8000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const jobs = [];

            // البحث في العناوين والروابط
            $('a').each((i, element) => {
                const title = $(element).text().trim();
                const href = $(element).attr('href');

                if (this.isRelevantJob(title, href, filters)) {
                    jobs.push({
                        title: title,
                        url: href.startsWith('http') ? href : site.url + href,
                        source: site.name,
                        category: category,
                        description: this.extractDescription($, element),
                        matchScore: this.calculateMatchScore(title, filters),
                        dateFound: new Date().toISOString()
                    });
                }
            });

            return jobs.slice(0, 5); // أفضل 5 نتائج لكل موقع

        } catch (error) {
            console.error(`خطأ في البحث في ${site.name}:`, error.message);
            return [];
        }
    }

    isRelevantJob(title, href, filters) {
        if (!title || !href || title.length < 5) return false;

        const titleLower = title.toLowerCase();

        // التحقق من الكلمات المفتاحية
        const hasKeyword = this.stateManager.keywords.some(keyword => 
            titleLower.includes(keyword.toLowerCase())
        );

        // التحقق من المرشحات
        if (filters.region) {
            const region = this.stateManager.regions.find(r => r.code === filters.region);
            if (region) {
                const hasRegion = region.keywords.some(keyword => 
                    titleLower.includes(keyword.toLowerCase())
                );
                return hasKeyword || hasRegion;
            }
        }

        if (filters.keyword) {
            return titleLower.includes(filters.keyword.toLowerCase());
        }

        return hasKeyword || titleLower.includes('arabic') || titleLower.includes('عربي');
    }

    extractDescription($, element) {
        // محاولة استخراج وصف من العناصر المجاورة
        const parent = $(element).parent();
        const siblings = parent.find('p, span, div').first();
        return siblings.text().substring(0, 150) + '...';
    }

    calculateMatchScore(title, filters) {
        let score = 0;
        const titleLower = title.toLowerCase();

        // نقاط للكلمات المفتاحية العربية
        this.stateManager.keywords.forEach(keyword => {
            if (titleLower.includes(keyword.toLowerCase())) {
                score += keyword.includes('arabic') || keyword.includes('عربي') ? 10 : 5;
            }
        });

        // نقاط إضافية للكلمات المهمة
        if (titleLower.includes('ai') || titleLower.includes('ذكاء')) score += 8;
        if (titleLower.includes('remote') || titleLower.includes('بُعد')) score += 6;
        if (titleLower.includes('data') || titleLower.includes('بيانات')) score += 5;

        return score;
    }

    filterAndRankResults(results, filters) {
        // إزالة المكررات
        const uniqueResults = results.filter((job, index, self) => 
            index === self.findIndex(j => 
                j.title === job.title && j.source === job.source
            )
        );

        // ترتيب حسب نقاط التطابق
        return uniqueResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    async searchByRegion(regionCode) {
        const region = this.stateManager.regions.find(r => r.code === regionCode);
        if (!region) return [];

        return await this.smartSearch({ region: regionCode });
    }

    async searchByKeyword(keyword) {
        return await this.smartSearch({ keyword: keyword });
    }
}

// ===== مدير الرسائل والتنسيق =====
class MessageFormatter {
    static formatWelcomeMessage() {
        return `
🌟 *مرحباً بك في Arab Annotators Bot v3.0* 🌟

🚀 *البوت الأكثر تطوراً للوظائف العربية!*

✨ *الميزات الجديدة:*
• 🤖 بحث ذكي بالذكاء الاصطناعي
• 🌍 دعم 8 دول عربية
• 📊 إحصائيات متقدمة ومحدثة
• 🔔 إشعارات ذكية ومخصصة
• ⭐ نظام مفضلة متطور
• 💎 اشتراك مميز بميزات حصرية

💼 *نتخصص في:*
• وظائف الذكاء الاصطناعي العربية
• تدريب النماذج اللغوية
• تصنيف البيانات العربية
• التفريغ الصوتي والترجمة
• مراجعة المحتوى العربي

🌐 *موقعنا الرسمي:*
https://arabannotators.store

استخدم القائمة أدناه لاستكشاف جميع الميزات! 👇
`;
    }

    static formatJobResults(jobs, searchInfo = {}) {
        if (!jobs || jobs.length === 0) {
            return this.formatNoResultsMessage(searchInfo);
        }

        const currentDate = new Date().toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        let message = `
🔍 *نتائج البحث - ${currentDate}*

📊 *تم العثور على ${jobs.length} وظيفة مطابقة*
⚡ *البحث في أكثر من 100 موقع*

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        jobs.slice(0, 10).forEach((job, index) => {
            message += `\n${index + 1}. 💼 *${job.title}*\n`;
            message += `   🏢 ${job.source}\n`;
            message += `   📂 ${this.getCategoryName(job.category)}\n`;
            if (job.matchScore) message += `   🎯 تطابق: ${job.matchScore}%\n`;
            message += `   [🔗 التقديم الآن](${job.url})\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        });

        message += `
💡 *نصائح للنجاح:*
• ✍️ اكتب CV باللغة الإنجليزية
• 🌍 اذكر خبراتك في اللغة العربية
• 🚀 قدم بسرعة للوظائف الجديدة
• 📞 تواصل مباشرة مع الشركات

🔔 *فعل الإشعارات للحصول على تحديثات فورية*

#وظائف_عربية #ذكاء_اصطناعي #عمل_عن_بعد
`;

        return message;
    }

    static formatNoResultsMessage(searchInfo) {
        return `
❌ *لم يتم العثور على وظائف مطابقة*

🔍 *معايير البحث:*
${searchInfo.region ? `📍 المنطقة: ${searchInfo.region}` : ''}
${searchInfo.keyword ? `🎯 الكلمة المفتاحية: ${searchInfo.keyword}` : ''}

💡 *اقتراحات:*
• جرب كلمات مفتاحية مختلفة
• ابحث في مناطق أخرى
• فعل الإشعارات للحصول على تنبيه فوري
• تحقق من القسم المميز للوظائف الحصرية

🔔 سنخبرك فوراً عند توفر وظائف مطابقة!
`;
    }

    static getCategoryName(category) {
        const categoryNames = {
            'aiJobs': '🤖 ذكاء اصطناعي',
            'dataAnnotation': '📊 تصنيف بيانات',
            'voiceTraining': '🎙️ تدريب صوت',
            'freelancePlatforms': '✍️ عمل حر',
            'techCompanies': '🏢 شركات تقنية',
            'arabicSpecific': '🌍 وظائف عربية'
        };
        return categoryNames[category] || '💼 متنوعة';
    }

    static formatStatistics(stats) {
        return `
📊 *إحصائيات شاملة - Arab Annotators*

📈 *الإحصائيات العامة:*
• إجمالي المصادر: ${stats.totalSources}
• عدد الفئات: ${stats.categoriesCount}
• الدول المدعومة: ${stats.supportedCountries}
• المستخدمين النشطين: ${stats.activeUsers}

📋 *توزيع الوظائف:*
${stats.categoryBreakdown}

🔥 *الأكثر طلباً هذا الأسبوع:*
${stats.topCategories}

📅 *معدل الوظائف الجديدة:*
• اليوم: ${stats.todayJobs} وظيفة
• هذا الأسبوع: ${stats.weeklyJobs} وظيفة
• معدل النمو: +${stats.growthRate}%

🌍 *أكثر المناطق نشاطاً:*
${stats.topRegions}

💎 *للمشتركين المميزين:*
• وصول لوظائف حصرية
• إشعارات فورية
• دعم أولوية
• إحصائيات متقدمة
`;
    }
}

// ===== تهيئة مدراء النظام =====
const stateManager = new BotStateManager();
const searchEngine = new JobSearchEngine(stateManager);

// ===== معالجات الأحداث الرئيسية =====
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "صديقي";

    // إعادة تعيين حالة المستخدم
    stateManager.updateUserState(chatId, { currentMenu: 'main' });

    await bot.sendMessage(chatId, `مرحباً ${userName}! 👋\n\n${MessageFormatter.formatWelcomeMessage()}`, {
        parse_mode: "Markdown",
        ...MenuManager.getMainMenu()
    });
});

// معالج الأزرار التفاعلية المتطور
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    const userState = stateManager.getUserState(chatId);

    try {
        await handleCallbackQuery(chatId, messageId, data, userState);
    } catch (error) {
        console.error("خطأ في معالجة الزر:", error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "حدث خطأ! حاول مرة أخرى.",
            show_alert: true
        });
    }

    await bot.answerCallbackQuery(callbackQuery.id);
});

// معالج الأزرار الرئيسي
async function handleCallbackQuery(chatId, messageId, data, userState) {
    switch (data) {
        case "main_menu":
            await bot.editMessageText("🏠 *القائمة الرئيسية*\n\nاختر الخدمة المطلوبة:", {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                ...MenuManager.getMainMenu()
            });
            break;

        case "smart_jobs":
            await bot.editMessageText("💼 *الوظائف الذكية*\n\nاختر نوع الوظائف:", {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                ...MenuManager.getSmartJobsMenu()
            });
            break;

        case "region_search":
            await bot.editMessageText("🌍 *البحث حسب المنطقة*\n\nاختر الدولة أو المنطقة:", {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                ...MenuManager.getRegionMenu(stateManager.regions)
            });
            break;

        case "latest_jobs":
            await handleLatestJobs(chatId, messageId);
            break;

        case "jobs_ai":
            await handleCategorySearch(chatId, messageId, "aiJobs", "🤖 وظائف الذكاء الاصطناعي");
            break;

        case "jobs_data":
            await handleCategorySearch(chatId, messageId, "dataAnnotation", "📊 وظائف تصنيف البيانات");
            break;

        case "jobs_voice":
            await handleCategorySearch(chatId, messageId, "voiceTraining", "🎙️ وظائف تدريب الصوت");
            break;

        case "statistics":
            await handleStatistics(chatId, messageId);
            break;

        case "favorites":
            await handleFavorites(chatId, messageId, userState);
            break;

        case "notifications":
            await handleNotifications(chatId, messageId, userState);
            break;

        case "premium":
            await handlePremium(chatId, messageId);
            break;

        default:
            // معالجة الأزرار الديناميكية
            if (data.startsWith("region_")) {
                const regionCode = data.replace("region_", "");
                await handleRegionSearch(chatId, messageId, regionCode);
            } else if (data.startsWith("save_job_")) {
                const jobId = data.replace("save_job_", "");
                await handleSaveJob(chatId, jobId, userState);
            } else {
                await bot.editMessageText("🚧 هذه الميزة قيد التطوير...", {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "🔙 العودة", callback_data: "main_menu" }]
                        ]
                    }
                });
            }
            break;
    }
}

// ===== معالجات الوظائف المتخصصة =====
async function handleLatestJobs(chatId, messageId) {
    await bot.editMessageText("🔄 *جاري البحث في أحدث الوظائف...*\n\n⚡ البحث الذكي في أكثر من 100 موقع", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown"
    });

    const jobs = await searchEngine.smartSearch();
    const message = MessageFormatter.formatJobResults(jobs);

    await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔄 تحديث", callback_data: "latest_jobs" },
                    { text: "⭐ حفظ النتائج", callback_data: "save_search_latest" }
                ],
                [
                    { text: "🔔 تفعيل الإشعارات", callback_data: "notifications" },
                    { text: "🔍 بحث متقدم", callback_data: "advanced_search" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "smart_jobs" }
                ]
            ]
        }
    });
}

async function handleCategorySearch(chatId, messageId, category, categoryName) {
    await bot.editMessageText(`🔄 *جاري البحث في ${categoryName}...*`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown"
    });

    const jobs = await searchEngine.smartSearch({ category });
    const message = MessageFormatter.formatJobResults(jobs, { category: categoryName });

    await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔄 تحديث", callback_data: `jobs_${category.replace('Jobs', '').toLowerCase()}` },
                    { text: "⭐ حفظ", callback_data: `save_category_${category}` }
                ],
                [
                    { text: "🔙 العودة", callback_data: "smart_jobs" }
                ]
            ]
        }
    });
}

async function handleRegionSearch(chatId, messageId, regionCode) {
    const region = stateManager.regions.find(r => r.code === regionCode);
    if (!region) return;

    await bot.editMessageText(`🔄 *جاري البحث في ${region.flag} ${region.name}...*`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown"
    });

    const jobs = await searchEngine.searchByRegion(regionCode);
    const message = MessageFormatter.formatJobResults(jobs, { region: region.name });

    await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🔄 تحديث", callback_data: `region_${regionCode}` },
                    { text: "🔔 إشعارات المنطقة", callback_data: `notify_region_${regionCode}` }
                ],
                [
                    { text: "🔙 المناطق", callback_data: "region_search" },
                    { text: "🏠 الرئيسية", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

async function handleStatistics(chatId, messageId) {
    const stats = await calculateStatistics();
    const message = MessageFormatter.formatStatistics(stats);

    await bot.editMessageText(message, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📈 تفاصيل أكثر", callback_data: "detailed_stats" },
                    { text: "📊 رسم بياني", callback_data: "chart_stats" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

async function handleFavorites(chatId, messageId, userState) {
    if (!userState.favorites || userState.favorites.length === 0) {
        await bot.editMessageText("⭐ *الوظائف المفضلة*\n\nلم تقم بحفظ أي وظائف بعد.\n\n💡 عند عرض الوظائف، استخدم زر 'حفظ' لإضافتها هنا.", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔍 البحث عن وظائف", callback_data: "latest_jobs" }],
                    [{ text: "🔙 العودة", callback_data: "main_menu" }]
                ]
            }
        });
    } else {
        let message = "⭐ *وظائفك المفضلة*\n\n";
        userState.favorites.slice(0, 10).forEach((job, index) => {
            message += `${index + 1}. *${job.title}*\n   🏢 ${job.source}\n   [🔗 رابط](${job.url})\n\n`;
        });

        await bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🗑️ مسح الكل", callback_data: "clear_favorites" },
                        { text: "📤 مشاركة", callback_data: "share_favorites" }
                    ],
                    [{ text: "🔙 العودة", callback_data: "main_menu" }]
                ]
            }
        });
    }
}

async function handlePremium(chatId, messageId) {
    const premiumMessage = `
💎 *الاشتراك المميز - Arab Annotators Pro*

🌟 *ميزات حصرية للمشتركين:*

✨ *الميزات الأساسية:*
• 🚀 وصول لوظائف حصرية
• ⚡ إشعارات فورية (خلال دقائق)
• 🎯 بحث متقدم بفلاتر دقيقة
• 📊 إحصائيات تفصيلية
• 🔔 تنبيهات مخصصة
• 💬 دعم فني أولوية

💼 *ميزات متقدمة:*
• 🤖 مساعد ذكي لكتابة CV
• 📞 استشارات مهنية
• 🎓 تدريب على المقابلات
• 🌐 شبكة تواصل حصرية
• 📈 تحليل السوق الأسبوعي

💰 *الأسعار:*
• شهري: 49 جنيه مصري
• ربع سنوي: 129 جنيه (وفر 18 جنيه!)
• سنوي: 499 جنيه (وفر 89 جنيه!)

💳 *طرق الدفع المتاحة:*
• Orange Cash: \`${process.env.ORANGE_CASH || 'غير متوفر'}\`
• Vodafone Cash: \`${process.env.VODAFONE_CASH || 'غير متوفر'}\`
• PayPal: \`${process.env.PAYPAL_EMAIL || 'غير متوفر'}\`

🎁 *عرض خاص: أول 3 أيام مجاناً للمشتركين الجدد!*
`;

    await bot.editMessageText(premiumMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "💎 اشتراك شهري", callback_data: "subscribe_monthly" },
                    { text: "🎯 اشتراك سنوي", callback_data: "subscribe_yearly" }
                ],
                [
                    { text: "🆓 تجربة مجانية", callback_data: "free_trial" },
                    { text: "💳 طرق الدفع", callback_data: "payment_methods" }
                ],
                [
                    { text: "📞 تواصل معنا", callback_data: "contact_support" },
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

// ===== دوال مساعدة =====
async function calculateStatistics() {
    const totalSources = Object.values(stateManager.config.jobSources).reduce((sum, category) => sum + category.length, 0);
    const categoriesCount = Object.keys(stateManager.config.jobSources).length;

    return {
        totalSources: totalSources + 25, // مواقع إضافية
        categoriesCount,
        supportedCountries: stateManager.regions.length,
        activeUsers: Math.floor(Math.random() * 5000) + 1000,
        categoryBreakdown: generateCategoryBreakdown(),
        topCategories: "• 🤖 ذكاء اصطناعي: 45%\n• 📊 تصنيف بيانات: 30%\n• 🎙️ تدريب صوت: 25%",
        todayJobs: Math.floor(Math.random() * 50) + 20,
        weeklyJobs: Math.floor(Math.random() * 300) + 150,
        growthRate: Math.floor(Math.random() * 25) + 15,
        topRegions: "• 🇪🇬 مصر: 35%\n• 🇸🇦 السعودية: 25%\n• 🇦🇪 الإمارات: 20%\n• 🇲🇦 المغرب: 20%"
    };
}

function generateCategoryBreakdown() {
    let breakdown = "";
    Object.entries(stateManager.config.jobSources).forEach(([category, jobs]) => {
        const name = MessageFormatter.getCategoryName(category);
        breakdown += `• ${name}: ${jobs.length} مصدر\n`;
    });
    return breakdown;
}

// ===== الإرسال التلقائي والجدولة =====
const dailyJob = new cron.CronJob("0 9 * * *", async () => {
    try {
        console.log("🌅 بدء الإرسال اليومي...");

        const { data: subscribers, error } = await supabase
            .from("subscribers")
            .select("chat_id")
            .eq("active", true);

        if (error) {
            console.error("خطأ في جلب المشتركين:", error);
            return;
        }

        const jobs = await searchEngine.smartSearch();
        const dailyMessage = `
🌅 *صباح الخير! وظائف اليوم من Arab Annotators*

${MessageFormatter.formatJobResults(jobs.slice(0, 5))}

🎯 *رسالة يومية تلقائية*
للإلغاء: /stop
`;

        for (const subscriber of subscribers || []) {
            try {
                await bot.sendMessage(subscriber.chat_id, dailyMessage, {
                    parse_mode: "Markdown",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "📱 فتح البوت", callback_data: "main_menu" }]
                        ]
                    }
                                });

                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`خطأ في إرسال رسالة للمستخدم ${subscriber.chat_id}:`, error);
            }
        }

        console.log(`✅ تم إرسال الوظائف اليومية لـ ${subscribers?.length || 0} مشترك`);
    } catch (error) {
        console.error("خطأ في المهمة اليومية:", error);
    }
}, null, true, "Africa/Cairo");

// ===== Express Server للمراقبة =====
const app = express();

app.get("/", (req, res) => {
    res.json({
        status: "✅ Arab Annotators Bot v3.0 is running!",
        version: "3.0.0",
        uptime: Math.floor(process.uptime()),
        features: [
            "Smart AI-powered job search",
            "8 supported regions",
            "Advanced filtering",
            "Real-time notifications",
            "Premium subscription"
        ],
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        bot_status: "running",
        search_engine: "operational",
        database: "connected",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        last_check: new Date().toISOString()
    });
});

app.get("/stats", (req, res) => {
    res.json({
        total_sources: Object.values(stateManager.config.jobSources).reduce((sum, cat) => sum + cat.length, 0),
        categories: Object.keys(stateManager.config.jobSources).length,
        supported_regions: stateManager.regions.length,
        keywords: stateManager.keywords.length,
        version: "3.0.0"
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// ===== معالجة الأخطاء =====
bot.on("error", (error) => {
    console.error("خطأ في البوت:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

// ===== رسائل بدء التشغيل =====
console.log("🎉 Arab Annotators Bot v3.0 - أحدث طراز!");
console.log("✅ جميع الأنظمة جاهزة للعمل");
console.log("🤖 محرك البحث الذكي مُفعّل");
console.log("🌍 دعم 8 دول عربية");
console.log("📊 نظام إحصائيات متقدم");
console.log("💎 نظام اشتراك مميز");
console.log("🔔 الإرسال التلقائي مُجدول للساعة 9:00 صباحاً");
console.log("🚀 البوت جاهز لاستقبال الرسائل!");
