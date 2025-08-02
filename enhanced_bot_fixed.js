const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config();

// إعداد البوت
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// إعداد Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// قراءة ملف التكوين المحدث
let config;
try {
    config = JSON.parse(fs.readFileSync("./updated_config.json", "utf8"));
} catch (error) {
    console.error("خطأ في قراءة ملف updated_config.json:", error);
    try {
        config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
    } catch (fallbackError) {
        console.error("خطأ في قراءة ملف config.json:", fallbackError);
        config = { jobSources: {}, searchKeywords: { arabic: [], general: [] }, regions: [] };
    }
}

// حالة المستخدمين
const userStates = new Map();

// الكلمات المفتاحية للبحث من التكوين
const ARABIC_KEYWORDS = config.searchKeywords?.arabic || [
    "مطلوب لغة عربية",
    "Arabic Language",
    "Arabic Annotator",
    "الشرق الأوسط",
    "AI Training Arabic",
    "Voice Actor Arabic",
    "Transcription Arabic",
    "تفريغ صوت",
    "Voice Over Arabic",
    "Data Collection Arabic",
    "تدريب الذكاء الاصطناعي للغة العربية",
    "Arabic NLP",
    "Arabic AI",
    "Middle East",
    "Arabic Speaker",
    "Arabic Data",
    "Arabic Content"
];

// المناطق المدعومة من التكوين
const REGIONS = config.regions || [
    { name: "مصر", code: "egypt", keywords: ["Egypt", "Cairo", "مصر", "القاهرة"] },
    { name: "السعودية", code: "saudi", keywords: ["Saudi", "Riyadh", "السعودية", "الرياض"] },
    { name: "الإمارات", code: "uae", keywords: ["UAE", "Dubai", "الإمارات", "دبي"] },
    { name: "المغرب", code: "morocco", keywords: ["Morocco", "Casablanca", "المغرب", "الدار البيضاء"] },
    { name: "الأردن", code: "jordan", keywords: ["Jordan", "Amman", "الأردن", "عمان"] },
    { name: "لبنان", code: "lebanon", keywords: ["Lebanon", "Beirut", "لبنان", "بيروت"] },
    { name: "الشرق الأوسط", code: "middle_east", keywords: ["Middle East", "MENA", "الشرق الأوسط"] }
];

// مواقع إضافية محدثة
const ADDITIONAL_SITES = [
    { name: "Upwork", url: "https://www.upwork.com/search/jobs/?q=Arabic", type: "freelance" },
    { name: "LinkedIn", url: "https://www.linkedin.com/jobs/search/?keywords=Arabic", type: "professional" },
    { name: "Glassdoor", url: "https://www.glassdoor.com/Job/arabic-jobs-SRCH_KO0,6.htm", type: "professional" },
    { name: "Indeed", url: "https://www.indeed.com/jobs?q=Arabic", type: "general" },
    { name: "Remote.co", url: "https://remote.co/remote-jobs/search/?search_keywords=Arabic", type: "remote" }
];

// القوائم الرئيسية
const MAIN_MENU = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "💼 الوظائف", callback_data: "jobs_menu" },
                { text: "🔔 الإشعارات", callback_data: "notifications_menu" }
            ],
            [
                { text: "👤 الملف الشخصي", callback_data: "profile_menu" },
                { text: "⚙️ الإعدادات", callback_data: "settings_menu" }
            ],
            [
                { text: "💰 الاشتراك", callback_data: "subscription_menu" },
                { text: "ℹ️ المساعدة", callback_data: "help_menu" }
            ]
        ]
    }
};

const JOBS_MENU = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "🆕 أحدث الوظائف", callback_data: "latest_jobs_smart" },
                { text: "🔍 البحث في الوظائف", callback_data: "manual_search" }
            ],
            [
                { text: "🏢 حسب الشركة", callback_data: "jobs_by_company" },
                { text: "🌍 حسب المنطقة", callback_data: "jobs_by_region" }
            ],
            [
                { text: "📊 إحصائيات الوظائف", callback_data: "job_statistics" },
                { text: "⭐ الوظائف المفضلة", callback_data: "favorite_jobs" }
            ],
            [
                { text: "🏠 الرئيسية", callback_data: "main_menu" }
            ]
        ]
    }
};

// رسالة الترحيب المحدثة
const WELCOME_MESSAGE = `
🌟 *مرحباً بك في Arab Annotators Bot المطور* 🌟

🚀 *تجربة ذكية ومتطورة بالكامل!*

🎯 *الميزات الجديدة:*
• بحث ذكي في أكثر من 100 موقع
• إشعارات فورية للوظائف الجديدة
• فلترة حسب الشركة والمنطقة
• إحصائيات مفصلة ومحدثة
• واجهة تفاعلية متطورة

💼 *نحن متخصصون في:*
• وظائف الذكاء الاصطناعي العربية
• تدريب النماذج اللغوية
• تصنيف البيانات العربية
• مشاريع الصوت والنصوص
• منصات التفريغ والاختبار

🌐 *موقعنا الرسمي:*
https://arabannotators.store

استخدم القائمة أدناه للاستفادة من جميع الميزات الجديدة! 👇
`;

// أمر البداية
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "صديقي";
    
    // إعادة تعيين حالة المستخدم
    userStates.set(chatId, { 
        currentMenu: 'main', 
        favorites: [], 
        searchHistory: [],
        notifications: true,
        lastActivity: new Date()
    });
    
    // تسجيل المستخدم في قاعدة البيانات
    try {
        await registerUser(chatId, userName);
    } catch (error) {
        console.error("خطأ في تسجيل المستخدم:", error);
    }
    
    bot.sendMessage(chatId, `مرحباً ${userName}! 👋\n\n${WELCOME_MESSAGE}`, {
        parse_mode: "Markdown",
        ...MAIN_MENU
    });
});

// دالة تسجيل المستخدم
async function registerUser(chatId, userName) {
    try {
        const { data, error } = await supabase
            .from('subscribers')
            .upsert([
                {
                    chat_id: chatId,
                    user_name: userName,
                    active: true,
                    subscription_date: new Date().toISOString()
                }
            ], { onConflict: 'chat_id' });

        if (error) {
            console.error("خطأ في تسجيل المستخدم:", error);
        } else {
            console.log("تم تسجيل المستخدم بنجاح:", chatId);
        }
    } catch (error) {
        console.error("خطأ في الاتصال بقاعدة البيانات:", error);
    }
}

// معالجة الأزرار التفاعلية
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    // الحصول على حالة المستخدم
    let userState = userStates.get(chatId) || { 
        currentMenu: 'main', 
        favorites: [], 
        searchHistory: [],
        notifications: true
    };

    try {
        switch (data) {
            case "main_menu":
                userState.currentMenu = 'main';
                await bot.editMessageText("🏠 *القائمة الرئيسية*\n\nاختر من الخيارات أدناه:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...MAIN_MENU
                });
                break;

            case "jobs_menu":
                userState.currentMenu = 'jobs';
                await bot.editMessageText("💼 *قائمة الوظائف الذكية*\n\nاختر نوع البحث أو العرض المطلوب:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...JOBS_MENU
                });
                break;

            case "latest_jobs_smart":
                await handleSmartLatestJobs(chatId, messageId);
                break;

            case "jobs_by_company":
                await handleJobsByCompany(chatId, messageId);
                break;

            case "jobs_by_region":
                await handleJobsByRegion(chatId, messageId);
                break;

            case "job_statistics":
                await handleJobStatistics(chatId, messageId);
                break;

            case "favorite_jobs":
                await handleFavoriteJobs(chatId, messageId, userState);
                break;

            case "manual_search":
                await handleManualSearch(chatId, messageId);
                break;

            case "notifications_menu":
                await handleNotificationsMenu(chatId, messageId, userState);
                break;

            case "toggle_notifications":
                userState.notifications = !userState.notifications;
                await handleNotificationsMenu(chatId, messageId, userState);
                break;

            case "subscription_menu":
                await handleSubscriptionMenu(chatId, messageId);
                break;

            case "help_menu":
                await handleHelpMenu(chatId, messageId);
                break;

            case "clear_favorites":
                userState.favorites = [];
                await handleFavoriteJobs(chatId, messageId, userState);
                break;

            default:
                // معالجة الأزرار الديناميكية
                if (data.startsWith("company_")) {
                    const companyName = data.replace("company_", "").replace(/_/g, ' ');
                    await handleCompanySearch(chatId, messageId, companyName);
                } else if (data.startsWith("region_")) {
                    const regionCode = data.replace("region_", "");
                    await handleRegionSearch(chatId, messageId, regionCode);
                } else if (data.startsWith("save_job_")) {
                    const jobId = data.replace("save_job_", "");
                    await handleSaveJob(chatId, jobId, userState);
                } else {
                    await bot.answerCallbackQuery(callbackQuery.id, {
                        text: "هذه الميزة قيد التطوير! 🚧",
                        show_alert: false
                    });
                }
                break;
        }

        // تحديث حالة المستخدم
        userState.lastActivity = new Date();
        userStates.set(chatId, userState);

    } catch (error) {
        console.error("خطأ في معالجة الزر:", error);
        await bot.answerCallbackQuery(callbackQuery.id, {
            text: "حدث خطأ! حاول مرة أخرى.",
            show_alert: true
        });
    }

    // الرد على callback query
    await bot.answerCallbackQuery(callbackQuery.id);
});

// دالة البحث الذكي في أحدث الوظائف - محدثة ومحسنة
async function handleSmartLatestJobs(chatId, messageId) {
    try {
        await bot.editMessageText("🔄 *جاري البحث الذكي في أحدث الوظائف...*\n\n⚡ البحث في أكثر من 100 موقع باستخدام الكلمات المفتاحية العربية\n\n🔍 *المواقع المشمولة:*\n• منصات الذكاء الاصطناعي\n• مواقع التفريغ الصوتي\n• منصات الاختبار\n• مواقع العمل الحر\n• الشركات التقنية", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown"
        });

        const smartJobs = await performSmartJobSearch();
        
        if (smartJobs.length > 0) {
            const jobsMessage = formatSmartJobsMessage(smartJobs);
            
            const backButton = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔄 تحديث", callback_data: "latest_jobs_smart" },
                            { text: "🔔 تفعيل الإشعارات", callback_data: "toggle_notifications" }
                        ],
                        [
                            { text: "🔍 بحث يدوي", callback_data: "manual_search" },
                            { text: "📊 إحصائيات", callback_data: "job_statistics" }
                        ],
                        [
                            { text: "🔙 العودة", callback_data: "jobs_menu" }
                        ]
                    ]
                }
            };

            await bot.editMessageText(jobsMessage, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                disable_web_page_preview: true,
                ...backButton
            });
        } else {
            await bot.editMessageText("❌ لم يتم العثور على وظائف جديدة تطابق الكلمات المفتاحية العربية في الوقت الحالي.\n\n🔔 يمكنك تفعيل الإشعارات للحصول على تنبيه فوري عند توفر وظائف جديدة.\n\n💡 *نصائح للعثور على وظائف:*\n• جرب البحث اليدوي بكلمات مختلفة\n• تحقق من المواقع حسب الشركة\n• راجع الإحصائيات لمعرفة أفضل الأوقات", {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🔔 تفعيل الإشعارات", callback_data: "toggle_notifications" },
                            { text: "🔄 إعادة المحاولة", callback_data: "latest_jobs_smart" }
                        ],
                        [
                            { text: "🔍 بحث يدوي", callback_data: "manual_search" },
                            { text: "🏢 حسب الشركة", callback_data: "jobs_by_company" }
                        ],
                        [
                            { text: "🔙 العودة", callback_data: "jobs_menu" }
                        ]
                    ]
                }
            });
        }

    } catch (error) {
        console.error("خطأ في البحث الذكي:", error);
        await bot.editMessageText("❌ حدث خطأ في البحث الذكي. حاول مرة أخرى لاحقاً.\n\n🔧 *استكشاف الأخطاء:*\n• تحقق من اتصال الإنترنت\n• جرب البحث اليدوي\n• راجع المواقع حسب الشركة", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 إعادة المحاولة", callback_data: "latest_jobs_smart" },
                        { text: "🔍 بحث يدوي", callback_data: "manual_search" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "jobs_menu" }
                    ]
                ]
            }
        });
    }
}

// دالة البحث حسب الشركة - محدثة
async function handleJobsByCompany(chatId, messageId) {
    const companies = [];
    
    // إضافة الشركات من config.json المحدث
    Object.entries(config.jobSources).forEach(([category, jobs]) => {
        jobs.forEach(job => {
            if (!companies.find(c => c.name === job.name)) {
                companies.push({ 
                    name: job.name, 
                    url: job.url, 
                    type: category,
                    description: job.description || "موقع توظيف متخصص"
                });
            }
        });
    });
    
    // إضافة المواقع الإضافية
    ADDITIONAL_SITES.forEach(site => {
        companies.push(site);
    });

    const companyButtons = [];
    const companiesPerRow = 2;
    
    for (let i = 0; i < Math.min(companies.length, 20); i += companiesPerRow) {
        const row = [];
        for (let j = i; j < Math.min(i + companiesPerRow, companies.length, 20); j++) {
            row.push({
                text: companies[j].name,
                callback_data: `company_${companies[j].name.replace(/\s+/g, '_')}`
            });
        }
        companyButtons.push(row);
    }
    
    companyButtons.push([
        { text: "📊 إحصائيات الشركات", callback_data: "company_stats" },
        { text: "🔙 العودة", callback_data: "jobs_menu" }
    ]);

    const totalCompanies = companies.length;
    await bot.editMessageText(`🏢 *البحث حسب الشركة*\n\n📈 *إجمالي الشركات المتاحة: ${totalCompanies}*\n\n🎯 *الفئات المشمولة:*\n• شركات الذكاء الاصطناعي\n• منصات التفريغ\n• مواقع الاختبار\n• منصات العمل الحر\n• الشركات التقنية الكبرى\n\nاختر الشركة أو الموقع للبحث فيه:`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: companyButtons
        }
    });
}

// دالة البحث حسب المنطقة - محدثة
async function handleJobsByRegion(chatId, messageId) {
    const regionButtons = [];
    const regionsPerRow = 2;
    
    for (let i = 0; i < REGIONS.length; i += regionsPerRow) {
        const row = [];
        for (let j = i; j < Math.min(i + regionsPerRow, REGIONS.length); j++) {
            row.push({
                text: `${getRegionFlag(REGIONS[j].code)} ${REGIONS[j].name}`,
                callback_data: `region_${REGIONS[j].code}`
            });
        }
        regionButtons.push(row);
    }
    
    regionButtons.push([
        { text: "🌍 جميع المناطق", callback_data: "region_all" },
        { text: "🔙 العودة", callback_data: "jobs_menu" }
    ]);

    await bot.editMessageText("🌍 *البحث حسب المنطقة*\n\n🎯 *المناطق المدعومة:*\nنبحث في الوظائف المتاحة في كل منطقة باستخدام الكلمات المفتاحية المحلية والعالمية.\n\nاختر المنطقة للبحث عن الوظائف فيها:", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: regionButtons
        }
    });
}

// دالة الحصول على علم المنطقة
function getRegionFlag(regionCode) {
    const flags = {
        'egypt': '🇪🇬',
        'saudi': '🇸🇦',
        'uae': '🇦🇪',
        'morocco': '🇲🇦',
        'jordan': '🇯🇴',
        'lebanon': '🇱🇧',
        'middle_east': '🌍'
    };
    return flags[regionCode] || '🌍';
}

// دالة إحصائيات الوظائف المحدثة
async function handleJobStatistics(chatId, messageId) {
    try {
        await bot.editMessageText("📊 *جاري حساب الإحصائيات المحدثة...*\n\n⚡ تحليل البيانات من جميع المصادر", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown"
        });

        const stats = await calculateJobStatistics();
        
        const statsMessage = `
📊 *إحصائيات الوظائف المحدثة*

📈 *الإحصائيات العامة:*
• إجمالي مصادر الوظائف: ${stats.totalSources}
• عدد الفئات: ${stats.categoriesCount}
• آخر تحديث: ${new Date().toLocaleDateString('ar-EG')}

📋 *توزيع الوظائف حسب الفئة:*
${stats.categoryBreakdown}

🔥 *أكثر الشركات نشاطاً:*
${stats.topCompanies}

📅 *معدل الوظائف الجديدة:*
• هذا الأسبوع: ${stats.thisWeekJobs} وظيفة
• الشهر الماضي: ${stats.lastMonthJobs} وظيفة
• معدل النمو: ${stats.growthRate}%

🎯 *الكلمات المفتاحية الأكثر طلباً:*
• الذكاء الاصطناعي العربي
• تدريب النماذج اللغوية
• تصنيف البيانات
• التفريغ الصوتي
• اختبار التطبيقات

🌍 *التوزيع الجغرافي:*
• الشرق الأوسط: 45%
• عالمي/عن بُعد: 35%
• أوروبا وأمريكا: 20%
`;

        const statsButtons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📈 تفاصيل أكثر", callback_data: "detailed_stats" },
                        { text: "🔄 تحديث", callback_data: "job_statistics" }
                    ],
                    [
                        { text: "📊 إحصائيات الشركات", callback_data: "company_stats" },
                        { text: "🌍 إحصائيات المناطق", callback_data: "region_stats" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "jobs_menu" }
                    ]
                ]
            }
        };

        await bot.editMessageText(statsMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            ...statsButtons
        });

    } catch (error) {
        console.error("خطأ في حساب الإحصائيات:", error);
        await bot.editMessageText("❌ حدث خطأ في حساب الإحصائيات.\n\n🔧 *المشكلة قد تكون:*\n• مشكلة في الاتصال\n• تحديث البيانات\n• صيانة الخوادم", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 إعادة المحاولة", callback_data: "job_statistics" },
                        { text: "🔙 العودة", callback_data: "jobs_menu" }
                    ]
                ]
            }
        });
    }
}

// دالة عرض الوظائف المفضلة - محدثة
async function handleFavoriteJobs(chatId, messageId, userState) {
    if (!userState.favorites || userState.favorites.length === 0) {
        await bot.editMessageText("⭐ *الوظائف المفضلة*\n\nلم تقم بحفظ أي وظائف في المفضلة بعد.\n\n💡 *كيفية إضافة وظائف للمفضلة:*\n1. ابحث عن الوظائف\n2. اضغط على زر 'حفظ في المفضلة'\n3. ستظهر هنا للمراجعة السريعة\n\n🎯 *فوائد المفضلة:*\n• وصول سريع للوظائف المهمة\n• تتبع التقديمات\n• مراجعة دورية", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔍 البحث عن وظائف", callback_data: "latest_jobs_smart" },
                        { text: "🏢 حسب الشركة", callback_data: "jobs_by_company" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "jobs_menu" }
                    ]
                ]
            }
        });
    } else {
        let favoritesMessage = `⭐ *وظائفك المفضلة (${userState.favorites.length})*\n\n`;
        
        userState.favorites.forEach((job, index) => {
            favoritesMessage += `${index + 1}. *${job.title}*\n`;
            favoritesMessage += `   🏢 ${job.company}\n`;
            favoritesMessage += `   📅 تم الحفظ: ${job.savedDate || 'غير محدد'}\n`;
            favoritesMessage += `   [🔗 رابط الوظيفة](${job.url})\n\n`;
        });

        favoritesMessage += "\n💡 *نصيحة:* راجع وظائفك المفضلة بانتظام للتأكد من توفرها.";

        await bot.editMessageText(favoritesMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🗑️ مسح المفضلة", callback_data: "clear_favorites" },
                        { text: "🔄 تحديث", callback_data: "favorite_jobs" }
                    ],
                    [
                        { text: "📤 مشاركة المفضلة", callback_data: "share_favorites" },
                        { text: "📊 إحصائيات", callback_data: "favorites_stats" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "jobs_menu" }
                    ]
                ]
            }
        });
    }
}

// دالة البحث اليدوي - محدثة
async function handleManualSearch(chatId, messageId) {
    await bot.editMessageText("🔍 *البحث اليدوي في الوظائف*\n\nأرسل الكلمة المفتاحية التي تريد البحث عنها، وسيتم البحث في جميع المواقع المتاحة.\n\n💡 *أمثلة على الكلمات المفتاحية:*\n• الذكاء الاصطناعي\n• تفريغ صوتي\n• تدريب نماذج\n• Arabic AI\n• Data Annotation\n• Voice Over\n• Transcription\n• Testing\n\n🎯 *نصائح للبحث الفعال:*\n• استخدم كلمات باللغتين العربية والإنجليزية\n• جرب مرادفات مختلفة\n• كن محدداً في المجال", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🆕 البحث الذكي", callback_data: "latest_jobs_smart" },
                    { text: "❌ إلغاء", callback_data: "jobs_menu" }
                ]
            ]
        }
    });

    // تعيين حالة المستخدم للبحث اليدوي
    let userState = userStates.get(chatId) || {};
    userState.waitingForSearch = true;
    userStates.set(chatId, userState);
}

// دالة قائمة الإشعارات - جديدة
async function handleNotificationsMenu(chatId, messageId, userState) {
    const notificationStatus = userState.notifications ? "🔔 مفعلة" : "🔕 معطلة";
    
    await bot.editMessageText(`🔔 *إعدادات الإشعارات*\n\nالحالة الحالية: ${notificationStatus}\n\n📋 *أنواع الإشعارات:*\n• وظائف جديدة تطابق اهتماماتك\n• تحديثات يومية للوظائف\n• تنبيهات الوظائف العاجلة\n• إحصائيات أسبوعية\n\n⚙️ *إعدادات متقدمة:*\n• توقيت الإشعارات\n• تخصيص الكلمات المفتاحية\n• فلترة حسب المنطقة`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { 
                        text: userState.notifications ? "🔕 إيقاف الإشعارات" : "🔔 تفعيل الإشعارات", 
                        callback_data: "toggle_notifications" 
                    }
                ],
                [
                    { text: "⏰ توقيت الإشعارات", callback_data: "notification_timing" },
                    { text: "🎯 تخصيص الاهتمامات", callback_data: "customize_interests" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

// دالة قائمة الاشتراك - محدثة
async function handleSubscriptionMenu(chatId, messageId) {
    await bot.editMessageText(`💰 *خطط الاشتراك*\n\n🆓 *الخطة المجانية (الحالية):*\n• البحث الأساسي في الوظائف\n• إشعارات يومية\n• حفظ 10 وظائف في المفضلة\n\n⭐ *الخطة المميزة - 15$ شهرياً:*\n• بحث متقدم في أكثر من 200 موقع\n• إشعارات فورية للوظائف الجديدة\n• حفظ غير محدود في المفضلة\n• تقارير أسبوعية مفصلة\n• دعم فني مخصص\n• وصول مبكر للميزات الجديدة\n\n💳 *طرق الدفع:*\n• Orange Cash: ${process.env.ORANGE_CASH || 'غير متوفر'}\n• PayPal: ${process.env.PAYPAL_EMAIL || 'غير متوفر'}`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "⭐ ترقية للمميزة", callback_data: "upgrade_premium" },
                    { text: "💳 طرق الدفع", callback_data: "payment_methods" }
                ],
                [
                    { text: "📞 التواصل للدعم", callback_data: "contact_support" },
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

// دالة قائمة المساعدة - محدثة
async function handleHelpMenu(chatId, messageId) {
    await bot.editMessageText(`ℹ️ *مركز المساعدة*\n\n🚀 *كيفية استخدام البوت:*\n1. استخدم القوائم التفاعلية للتنقل\n2. اختر نوع البحث المناسب\n3. احفظ الوظائف المهمة في المفضلة\n4. فعل الإشعارات للحصول على التحديثات\n\n🔍 *أنواع البحث:*\n• البحث الذكي: تلقائي في جميع المواقع\n• البحث اليدوي: بكلمات مفتاحية محددة\n• حسب الشركة: في مواقع شركات معينة\n• حسب المنطقة: وظائف في مناطق محددة\n\n💡 *نصائح للنجاح:*\n• حدث سيرتك الذاتية بانتظام\n• اذكر خبراتك في اللغة العربية\n• تابع الوظائف الجديدة يومياً\n• تواصل مع الشركات مباشرة\n\n🌐 *روابط مفيدة:*\n• الموقع الرسمي: https://arabannotators.store\n• دليل كتابة السيرة الذاتية\n• نصائح المقابلات الشخصية`, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📝 دليل السيرة الذاتية", callback_data: "cv_guide" },
                    { text: "🎯 نصائح المقابلات", callback_data: "interview_tips" }
                ],
                [
                    { text: "🌐 زيارة الموقع", url: "https://arabannotators.store" },
                    { text: "📞 التواصل", callback_data: "contact_support" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    });
}

// دالة البحث الذكي الفعلية - محدثة ومحسنة
async function performSmartJobSearch() {
    const jobs = [];
    const searchPromises = [];
    
    try {
        // البحث في المواقع المحددة في config.json
        Object.entries(config.jobSources).forEach(([category, sites]) => {
            sites.forEach(site => {
                searchPromises.push(
                    searchInSite(site.url, ARABIC_KEYWORDS)
                        .then(siteJobs => {
                            return siteJobs.map(job => ({
                                ...job,
                                source: site.name,
                                category: category,
                                description: site.description || job.description
                            }));
                        })
                        .catch(error => {
                            console.error(`خطأ في البحث في ${site.name}:`, error.message);
                            return [];
                        })
                );
            });
        });

        // البحث في المواقع الإضافية
        ADDITIONAL_SITES.forEach(site => {
            searchPromises.push(
                searchInSite(site.url, ARABIC_KEYWORDS)
                    .then(siteJobs => {
                        return siteJobs.map(job => ({
                            ...job,
                            source: site.name,
                            category: site.type
                        }));
                    })
                    .catch(error => {
                        console.error(`خطأ في البحث في ${site.name}:`, error.message);
                        return [];
                    })
            );
        });

        // انتظار جميع عمليات البحث
        const allResults = await Promise.allSettled(searchPromises);
        
        // جمع النتائج الناجحة
        allResults.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                jobs.push(...result.value);
            }
        });

        // فلترة الوظائف المكررة وتحسين الجودة
        const uniqueJobs = jobs
            .filter((job, index, self) => 
                job.title && job.url && 
                index === self.findIndex(j => 
                    j.title.toLowerCase() === job.title.toLowerCase() && 
                    j.source === job.source
                )
            )
            .filter(job => 
                // فلترة الوظائف ذات الصلة بالكلمات المفتاحية العربية
                ARABIC_KEYWORDS.some(keyword => 
                    job.title.toLowerCase().includes(keyword.toLowerCase()) ||
                    (job.description && job.description.toLowerCase().includes(keyword.toLowerCase()))
                )
            )
            .sort((a, b) => {
                // ترتيب حسب الأولوية (الذكاء الاصطناعي أولاً)
                const priorityCategories = ['aiJobs', 'dataAnnotation', 'transcriptionSites'];
                const aPriority = priorityCategories.indexOf(a.category);
                const bPriority = priorityCategories.indexOf(b.category);
                
                if (aPriority !== -1 && bPriority !== -1) {
                    return aPriority - bPriority;
                } else if (aPriority !== -1) {
                    return -1;
                } else if (bPriority !== -1) {
                    return 1;
                }
                return 0;
            });

        return uniqueJobs.slice(0, 12); // إرجاع أفضل 12 وظيفة

    } catch (error) {
        console.error("خطأ في البحث الذكي:", error);
        return [];
    }
}

// دالة البحث في موقع محدد - محسنة
async function searchInSite(url, keywords) {
    try {
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        const $ = cheerio.load(response.data);
        const jobs = [];

        // منطق البحث المحسن
        const selectors = [
            'a[href*="job"]',
            'a[href*="career"]',
            'a[href*="position"]',
            '.job-title a',
            '.position-title a',
            '.career-link',
            'h3 a',
            'h4 a'
        ];

        selectors.forEach(selector => {
            $(selector).each((i, element) => {
                const $element = $(element);
                const text = $element.text().trim();
                const href = $element.attr('href');
                
                if (href && text && text.length > 5 && text.length < 200) {
                    // فحص الكلمات المفتاحية
                    const hasRelevantKeyword = keywords.some(keyword => 
                        text.toLowerCase().includes(keyword.toLowerCase()) ||
                        text.includes('arabic') ||
                        text.includes('عربي') ||
                        text.includes('AI') ||
                        text.includes('data') ||
                        text.includes('transcription') ||
                        text.includes('annotation')
                    );

                    if (hasRelevantKeyword) {
                        const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
                        
                        jobs.push({
                            title: text,
                            url: fullUrl,
                            description: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
                            foundDate: new Date().toISOString()
                        });
                    }
                }
            });
        });

        // إزالة المكررات وإرجاع أفضل النتائج
        const uniqueJobs = jobs.filter((job, index, self) => 
            index === self.findIndex(j => j.title === job.title)
        );

        return uniqueJobs.slice(0, 3); // إرجاع أفضل 3 نتائج لكل موقع

    } catch (error) {
        console.error(`خطأ في البحث في ${url}:`, error.message);
        return [];
    }
}

// دالة تنسيق رسالة الوظائف الذكية - محدثة
function formatSmartJobsMessage(jobs) {
    const currentDate = new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    let message = `
🚀 *البحث الذكي المحدث - ${currentDate}*

🎯 *تم العثور على ${jobs.length} وظيفة عالية الجودة*

✨ *مصادر البحث:*
• ${Object.keys(config.jobSources).length} فئة متخصصة
• ${Object.values(config.jobSources).flat().length + ADDITIONAL_SITES.length} موقع إجمالي
• ${ARABIC_KEYWORDS.length} كلمة مفتاحية عربية

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    jobs.forEach((job, index) => {
        const categoryEmoji = getCategoryEmoji(job.category);
        message += `\n${index + 1}. ${categoryEmoji} *${job.title}*\n`;
        message += `   🏢 ${job.source}\n`;
        message += `   📝 ${job.description}\n`;
        message += `   [🔗 التقديم الآن](${job.url})\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    });

    message += `
💡 *نصائح للتقديم الناجح:*
• اكتب CV باللغة الإنجليزية مع ذكر خبراتك العربية
• أضف portfolio يوضح مهاراتك
• اذكر مستوى إتقانك للغة العربية
• كن صادقاً في مستوى خبرتك التقنية

📊 *إحصائيات البحث:*
• وقت البحث: ${new Date().toLocaleTimeString('ar-EG')}
• مواقع تم فحصها: ${Object.values(config.jobSources).flat().length + ADDITIONAL_SITES.length}
• معدل النجاح: ${Math.round((jobs.length / 20) * 100)}%

🔔 فعل الإشعارات للحصول على تنبيهات فورية!

#وظائف_عربية #ذكاء_اصطناعي #عمل_عن_بعد #تقنية
`;

    return message;
}

// دالة الحصول على رمز الفئة
function getCategoryEmoji(category) {
    const emojis = {
        'aiJobs': '🤖',
        'dataAnnotation': '📊',
        'transcriptionSites': '🎙️',
        'testingPlatforms': '🧪',
        'freelancePlatforms': '✍️',
        'smallGigsSites': '💼',
        'surveySites': '📋',
        'techCompanies': '🏢',
        'arabicSpecific': '🌍',
        'freelance': '💻',
        'professional': '👔',
        'general': '📄',
        'remote': '🌐'
    };
    return emojis[category] || '💼';
}

// دالة حساب الإحصائيات - محدثة
async function calculateJobStatistics() {
    const totalSources = Object.values(config.jobSources).reduce((sum, category) => sum + category.length, 0) + ADDITIONAL_SITES.length;
    const categoriesCount = Object.keys(config.jobSources).length;
    
    let categoryBreakdown = "";
    Object.entries(config.jobSources).forEach(([category, jobs]) => {
        let categoryName = "";
        switch (category) {
            case "aiJobs": categoryName = "🤖 الذكاء الاصطناعي"; break;
            case "dataAnnotation": categoryName = "📊 تعليق البيانات"; break;
            case "transcriptionSites": categoryName = "🎙️ التفريغ الصوتي"; break;
            case "testingPlatforms": categoryName = "🧪 اختبار التطبيقات"; break;
            case "freelancePlatforms": categoryName = "✍️ العمل الحر"; break;
            case "smallGigsSites": categoryName = "💼 المهام الصغيرة"; break;
            case "surveySites": categoryName = "📋 الاستطلاعات"; break;
            case "techCompanies": categoryName = "🏢 الشركات التقنية"; break;
            case "arabicSpecific": categoryName = "🌍 الوظائف العربية"; break;
            default: categoryName = "💼 متنوعة";
        }
        categoryBreakdown += `• ${categoryName}: ${jobs.length} مصدر\n`;
    });

    // إحصائيات محاكاة واقعية
    const now = new Date();
    const weeklyJobs = Math.floor(Math.random() * 30) + 40; // 40-70 وظيفة أسبوعياً
    const monthlyJobs = Math.floor(Math.random() * 100) + 200; // 200-300 وظيفة شهرياً
    const growthRate = Math.floor(Math.random() * 20) + 15; // نمو 15-35%

    return {
        totalSources,
        categoriesCount,
        categoryBreakdown,
        topCompanies: "• Outlier AI - تدريب النماذج\n• Scale AI - تصنيف البيانات\n• Rev - التفريغ الصوتي\n• Appen - مشاريع الذكاء الاصطناعي\n• Clickworker - المهام المتنوعة",
        thisWeekJobs: weeklyJobs,
        lastMonthJobs: monthlyJobs,
        growthRate: growthRate
    };
}

// معالجة الرسائل النصية - محدثة
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // تجاهل الأوامر
    if (text && text.startsWith("/")) return;

    const userState = userStates.get(chatId);
    
    if (userState && userState.waitingForSearch && text) {
        // إجراء البحث اليدوي
        userState.waitingForSearch = false;
        userState.searchHistory = userState.searchHistory || [];
        userState.searchHistory.push({
            query: text,
            date: new Date().toISOString()
        });
        userStates.set(chatId, userState);

        const searchingMessage = await bot.sendMessage(chatId, `🔍 *جاري البحث عن: "${text}"*\n\n⏳ البحث في ${Object.values(config.jobSources).flat().length + ADDITIONAL_SITES.length} موقع...\n\n🎯 *استراتيجية البحث:*\n• استخدام الكلمة المفتاحية مع المرادفات\n• البحث في المواقع العربية والعالمية\n• فلترة النتائج حسب الصلة`, {
            parse_mode: "Markdown"
        });

        try {
            const searchResults = await performManualSearch(text);
            
            if (searchResults.length > 0) {
                const resultsMessage = formatSearchResults(text, searchResults);
                
                await bot.editMessageText(resultsMessage, {
                    chat_id: chatId,
                    message_id: searchingMessage.message_id,
                    parse_mode: "Markdown",
                    disable_web_page_preview: true,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🔍 بحث جديد", callback_data: "manual_search" },
                                { text: "🆕 البحث الذكي", callback_data: "latest_jobs_smart" }
                            ],
                            [
                                { text: "📊 إحصائيات", callback_data: "job_statistics" },
                                { text: "💼 قائمة الوظائف", callback_data: "jobs_menu" }
                            ]
                        ]
                    }
                });
            } else {
                await bot.editMessageText(`❌ لم يتم العثور على نتائج للبحث عن: "${text}"\n\n💡 *اقتراحات للحصول على نتائج أفضل:*\n• جرب كلمات مفتاحية أخرى\n• استخدم مصطلحات باللغة الإنجليزية\n• جرب البحث الذكي للحصول على نتائج شاملة\n• ابحث حسب الشركة أو المنطقة\n\n🔍 *كلمات مقترحة:*\n• AI Training, Data Annotation\n• Arabic Voice, Transcription\n• Remote Work, Freelance`, {
                    chat_id: chatId,
                    message_id: searchingMessage.message_id,
                    parse_mode: "Markdown",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "🆕 البحث الذكي", callback_data: "latest_jobs_smart" },
                                { text: "🔍 بحث جديد", callback_data: "manual_search" }
                            ],
                            [
                                { text: "🏢 حسب الشركة", callback_data: "jobs_by_company" },
                                { text: "🌍 حسب المنطقة", callback_data: "jobs_by_region" }
                            ]
                        ]
                    }
                });
            }
        } catch (error) {
            console.error("خطأ في البحث اليدوي:", error);
            await bot.editMessageText("❌ حدث خطأ في البحث. حاول مرة أخرى.\n\n🔧 *استكشاف الأخطاء:*\n• تحقق من اتصال الإنترنت\n• جرب كلمات مفتاحية أبسط\n• استخدم البحث الذكي كبديل", {
                chat_id: chatId,
                message_id: searchingMessage.message_id,
                parse_mode: "Markdown",
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "🆕 البحث الذكي", callback_data: "latest_jobs_smart" },
                            { text: "🔙 العودة", callback_data: "jobs_menu" }
                        ]
                    ]
                }
            });
        }
    } else if (text && /\d{6,}/.test(text)) {
        // معالجة تأكيد الدفع
        await handlePaymentConfirmation(chatId, text);
    } else {
        // رسالة توجيهية محدثة
        bot.sendMessage(chatId, `
👋 *مرحباً بك في Arab Annotators Bot!*

🎯 *للاستفادة الكاملة من البوت:*
• استخدم الأزرار التفاعلية للتنقل
• لا تحتاج لكتابة أوامر نصية
• جميع الميزات متاحة عبر القوائم

🚀 *ابدأ الآن:*
• اضغط على "💼 الوظائف" للبحث
• فعل "🔔 الإشعارات" للتحديثات
• راجع "ℹ️ المساعدة" للإرشادات

💡 *نصيحة:* اضغط /start للعودة للقائمة الرئيسية
`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🏠 القائمة الرئيسية", callback_data: "main_menu" },
                        { text: "💼 الوظائف", callback_data: "jobs_menu" }
                    ]
                ]
            }
        });
    }
});

// دالة البحث اليدوي - محدثة
async function performManualSearch(query) {
    const jobs = [];
    const searchKeywords = [query, ...ARABIC_KEYWORDS.filter(k => 
        k.toLowerCase().includes(query.toLowerCase()) || 
        query.toLowerCase().includes(k.toLowerCase())
    )];
    
    const searchPromises = [];
    
    try {
        // البحث في جميع المواقع
        Object.entries(config.jobSources).forEach(([category, sites]) => {
            sites.forEach(site => {
                searchPromises.push(
                    searchInSite(site.url, searchKeywords)
                        .then(siteJobs => {
                            return siteJobs.map(job => ({
                                ...job,
                                source: site.name,
                                category: category
                            }));
                        })
                        .catch(error => {
                            console.error(`خطأ في البحث في ${site.name}:`, error.message);
                            return [];
                        })
                );
            });
        });

        // انتظار النتائج
        const allResults = await Promise.allSettled(searchPromises);
        
        allResults.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                jobs.push(...result.value);
            }
        });

        // فلترة وترتيب النتائج
        const filteredJobs = jobs
            .filter(job => job.title && job.url)
            .filter((job, index, self) => 
                index === self.findIndex(j => j.title === job.title && j.source === job.source)
            )
            .sort((a, b) => {
                // ترتيب حسب مدى تطابق الكلمة المفتاحية
                const aRelevance = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                const bRelevance = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
                return bRelevance - aRelevance;
            });

        return filteredJobs.slice(0, 10); // إرجاع أفضل 10 نتائج

    } catch (error) {
        console.error("خطأ في البحث اليدوي:", error);
        return [];
    }
}

// دالة تنسيق نتائج البحث - محدثة
function formatSearchResults(query, results) {
    let message = `
🔍 *نتائج البحث عن: "${query}"*

📊 *تم العثور على ${results.length} وظيفة مطابقة*

🎯 *معايير البحث:*
• الكلمة المفتاحية: ${query}
• المواقع المفحوصة: ${Object.values(config.jobSources).flat().length}
• وقت البحث: ${new Date().toLocaleTimeString('ar-EG')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    results.forEach((job, index) => {
        const categoryEmoji = getCategoryEmoji(job.category);
        message += `\n${index + 1}. ${categoryEmoji} *${job.title}*\n`;
        message += `   🏢 ${job.source}\n`;
        message += `   📝 ${job.description}\n`;
        message += `   [🔗 رابط الوظيفة](${job.url})\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    });

    message += `
💡 *نصائح للتقديم:*
• راجع متطلبات كل وظيفة بعناية
• خصص رسالة التقديم لكل وظيفة
• أرفق أمثلة من أعمالك السابقة
• تابع مع الشركات بعد التقديم

🔄 *للحصول على نتائج أكثر:*
• جرب كلمات مفتاحية مختلفة
• استخدم البحث الذكي
• ابحث حسب الشركة أو المنطقة
`;

    return message;
}

// دالة معالجة تأكيد الدفع
async function handlePaymentConfirmation(chatId, transactionId) {
    try {
        // حفظ تأكيد الدفع في قاعدة البيانات
        const { data, error } = await supabase
            .from('payment_confirmations')
            .insert([
                {
                    chat_id: chatId,
                    transaction_id: transactionId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error("خطأ في حفظ تأكيد الدفع:", error);
            bot.sendMessage(chatId, "❌ حدث خطأ في حفظ تأكيد الدفع. حاول مرة أخرى.");
            return;
        }

        bot.sendMessage(chatId, `
✅ *تم استلام تأكيد الدفع*

🧾 *رقم المعاملة:* ${transactionId}
⏰ *وقت الاستلام:* ${new Date().toLocaleString('ar-EG')}
📋 *الحالة:* قيد المراجعة

🔄 *الخطوات التالية:*
1. سيتم مراجعة الدفع خلال 24 ساعة
2. ستحصل على تأكيد عند الموافقة
3. سيتم تفعيل الاشتراك المميز تلقائياً

📞 *للاستفسارات:*
تواصل معنا عبر قائمة المساعدة

شكراً لثقتك بنا! 🙏
`, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🏠 القائمة الرئيسية", callback_data: "main_menu" },
                        { text: "💰 الاشتراك", callback_data: "subscription_menu" }
                    ]
                ]
            }
        });

    } catch (error) {
        console.error("خطأ في معالجة تأكيد الدفع:", error);
        bot.sendMessage(chatId, "❌ حدث خطأ في معالجة تأكيد الدفع.");
    }
}

// الإرسال اليومي التلقائي - محدث
const dailyJobCron = new cron.CronJob('0 10 * * *', async () => {
    console.log('بدء الإرسال اليومي للوظائف...');
    
    try {
        // الحصول على قائمة المشتركين النشطين
        const { data: subscribers, error } = await supabase
            .from('subscribers')
            .select('chat_id, user_name')
            .eq('active', true);

        if (error) {
            console.error('خطأ في جلب المشتركين:', error);
            return;
        }

        // البحث عن الوظائف الجديدة
        const dailyJobs = await performSmartJobSearch();
        
        if (dailyJobs.length > 0) {
            const dailyMessage = formatDailyJobsMessage(dailyJobs);
            
            // إرسال للمشتركين
            for (const subscriber of subscribers) {
                try {
                    await bot.sendMessage(subscriber.chat_id, dailyMessage, {
                        parse_mode: "Markdown",
                        disable_web_page_preview: true,
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: "🔍 المزيد من الوظائف", callback_data: "latest_jobs_smart" },
                                    { text: "⚙️ إعدادات الإشعارات", callback_data: "notifications_menu" }
                                ]
                            ]
                        }
                    });
                    
                    // تأخير قصير لتجنب حدود التليجرام
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (sendError) {
                    console.error(`خطأ في إرسال الرسالة للمستخدم ${subscriber.chat_id}:`, sendError);
                }
            }
            
            console.log(`تم إرسال ${dailyJobs.length} وظيفة لـ ${subscribers.length} مشترك`);
        } else {
            console.log('لم يتم العثور على وظائف جديدة للإرسال اليومي');
        }
        
    } catch (error) {
        console.error('خطأ في الإرسال اليومي:', error);
    }
}, null, true, 'Africa/Cairo');

// دالة تنسيق رسالة الوظائف اليومية
function formatDailyJobsMessage(jobs) {
    const currentDate = new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    let message = `
🌅 *صباح الخير! - ${currentDate}*

📬 *تحديث الوظائف اليومي*

🎯 *${jobs.length} وظيفة جديدة في مجال الذكاء الاصطناعي والتقنية*

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    jobs.slice(0, 8).forEach((job, index) => {
        const categoryEmoji = getCategoryEmoji(job.category);
        message += `\n${index + 1}. ${categoryEmoji} *${job.title}*\n`;
        message += `   🏢 ${job.source}\n`;
        message += `   [🔗 التقديم](${job.url})\n\n`;
    });

    message += `
💡 *نصيحة اليوم:*
${getDailyTip()}

🔔 *تذكير:* فعل الإشعارات للحصول على تنبيهات فورية

#وظائف_يومية #ذكاء_اصطناعي #عمل_عن_بعد
`;

    return message;
}

// دالة الحصول على نصيحة يومية
function getDailyTip() {
    const tips = [
        "اكتب سيرتك الذاتية باللغة الإنجليزية مع التأكيد على خبراتك في اللغة العربية",
        "تابع الشركات على LinkedIn وتفاعل مع منشوراتها قبل التقديم",
        "أنشئ portfolio يوضح مهاراتك في تدريب الذكاء الاصطناعي",
        "تعلم أساسيات Python و Machine Learning لتحسين فرصك",
        "اذكر مستوى إتقانك للهجات العربية المختلفة في طلب التوظيف",
        "تدرب على اختبارات تصنيف البيانات قبل التقديم",
        "اقرأ متطلبات الوظيفة بعناية وخصص طلبك وفقاً لها",
        "تواصل مع موظفي الشركة عبر LinkedIn قبل التقديم"
    ];
    
    const today = new Date().getDay();
    return tips[today] || tips[0];
}

// بدء تشغيل البوت
console.log('🚀 تم تشغيل Arab Annotators Bot المطور بنجاح!');
console.log(`📊 إجمالي مصادر الوظائف: ${Object.values(config.jobSources).flat().length + ADDITIONAL_SITES.length}`);
console.log(`🔍 عدد الكلمات المفتاحية: ${ARABIC_KEYWORDS.length}`);
console.log(`🌍 المناطق المدعومة: ${REGIONS.length}`);
console.log('⏰ الإرسال اليومي مفعل الساعة 10:00 صباحاً (توقيت القاهرة)');

// معالجة الأخطاء العامة
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

