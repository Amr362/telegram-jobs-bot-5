const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config();

// إعداد البوت
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// إعداد Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// قراءة ملف التكوين
let config;
try {
    config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch (error) {
    console.error("خطأ في قراءة ملف config.json:", error);
    config = { jobSources: {} };
}

// حالة المستخدمين
const userStates = new Map();

// الرسائل والقوائم
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
                { text: "🔍 البحث في الوظائف", callback_data: "search_jobs" },
                { text: "📊 إحصائيات الوظائف", callback_data: "job_stats" }
            ],
            [
                { text: "🆕 أحدث الوظائف", callback_data: "latest_jobs" },
                { text: "⭐ الوظائف المفضلة", callback_data: "favorite_jobs" }
            ],
            [
                { text: "🏢 حسب الشركة", callback_data: "jobs_by_company" },
                { text: "🌍 حسب المنطقة", callback_data: "jobs_by_region" }
            ],
            [
                { text: "🏠 الرئيسية", callback_data: "main_menu" }
            ]
        ]
    }
};

const NOTIFICATIONS_MENU = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "⚙️ إعدادات الإشعارات", callback_data: "notification_settings" },
                { text: "📅 جدولة الإشعارات", callback_data: "schedule_notifications" }
            ],
            [
                { text: "📱 تخصيص التنبيهات", callback_data: "customize_alerts" },
                { text: "🔕 إيقاف الإشعارات", callback_data: "disable_notifications" }
            ],
            [
                { text: "🏠 الرئيسية", callback_data: "main_menu" }
            ]
        ]
    }
};

const PROFILE_MENU = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "📝 تحديث البيانات", callback_data: "update_profile" },
                { text: "💰 حالة الاشتراك", callback_data: "subscription_status" }
            ],
            [
                { text: "📊 إحصائياتي", callback_data: "my_stats" },
                { text: "📋 سجل النشاط", callback_data: "activity_log" }
            ],
            [
                { text: "🏠 الرئيسية", callback_data: "main_menu" }
            ]
        ]
    }
};

const SETTINGS_MENU = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: "🌐 اللغة", callback_data: "language_settings" },
                { text: "🎨 المظهر", callback_data: "theme_settings" }
            ],
            [
                { text: "🔧 إعدادات متقدمة", callback_data: "advanced_settings" },
                { text: "🔄 إعادة تعيين", callback_data: "reset_settings" }
            ],
            [
                { text: "🏠 الرئيسية", callback_data: "main_menu" }
            ]
        ]
    }
};

// رسالة الترحيب الحديثة
const WELCOME_MESSAGE = `
🌟 *مرحباً بك في Arab Annotators Bot الجديد* 🌟

🚀 *تجربة محدثة وتفاعلية بالكامل!*

🎯 *ما الجديد:*
• واجهة تفاعلية حديثة
• بحث متقدم في الوظائف
• إشعارات ذكية ومخصصة
• إحصائيات مفصلة
• تجربة مستخدم محسنة

💼 *نحن متخصصون في:*
• وظائف الذكاء الاصطناعي
• تدريب النماذج اللغوية العربية
• تصنيف البيانات والتعليق التوضيحي
• مشاريع الصوت والنصوص العربية

🌐 *موقعنا الرسمي:*
https://arabannotators.store

استخدم القائمة أدناه للتنقل في البوت الجديد! 👇
`;

// أمر البداية
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "صديقي";
    
    // إعادة تعيين حالة المستخدم
    userStates.set(chatId, { currentMenu: 'main' });
    
    bot.sendMessage(chatId, `مرحباً ${userName}! 👋\n\n${WELCOME_MESSAGE}`, {
        parse_mode: "Markdown",
        ...MAIN_MENU
    });
});

// معالجة الأزرار التفاعلية
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;
    const messageId = message.message_id;

    // الحصول على حالة المستخدم
    let userState = userStates.get(chatId) || { currentMenu: 'main' };

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
                await bot.editMessageText("💼 *قائمة الوظائف*\n\nاختر نوع البحث أو العرض المطلوب:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...JOBS_MENU
                });
                break;

            case "notifications_menu":
                userState.currentMenu = 'notifications';
                await bot.editMessageText("🔔 *إعدادات الإشعارات*\n\nخصص إشعاراتك حسب احتياجاتك:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...NOTIFICATIONS_MENU
                });
                break;

            case "profile_menu":
                userState.currentMenu = 'profile';
                await bot.editMessageText("👤 *الملف الشخصي*\n\nإدارة بياناتك وإعداداتك الشخصية:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...PROFILE_MENU
                });
                break;

            case "settings_menu":
                userState.currentMenu = 'settings';
                await bot.editMessageText("⚙️ *الإعدادات*\n\nخصص تجربتك في استخدام البوت:", {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: "Markdown",
                    ...SETTINGS_MENU
                });
                break;

            case "search_jobs":
                await handleJobSearch(chatId, messageId);
                break;

            case "latest_jobs":
                await handleLatestJobs(chatId, messageId);
                break;

            case "job_stats":
                await handleJobStats(chatId, messageId);
                break;

            case "subscription_menu":
                await handleSubscriptionMenu(chatId, messageId);
                break;

            case "help_menu":
                await handleHelpMenu(chatId, messageId);
                break;

            default:
                await bot.answerCallbackQuery(callbackQuery.id, {
                    text: "هذه الميزة قيد التطوير! 🚧",
                    show_alert: false
                });
                break;
        }

        // تحديث حالة المستخدم
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

// دالة البحث في الوظائف
async function handleJobSearch(chatId, messageId) {
    const searchMenu = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🤖 وظائف الذكاء الاصطناعي", callback_data: "search_ai_jobs" },
                    { text: "📊 تصنيف البيانات", callback_data: "search_data_jobs" }
                ],
                [
                    { text: "✍️ العمل الحر", callback_data: "search_freelance_jobs" },
                    { text: "🏢 الشركات التقنية", callback_data: "search_tech_jobs" }
                ],
                [
                    { text: "🌍 وظائف عربية", callback_data: "search_arabic_jobs" },
                    { text: "🎙️ تدريب الصوت", callback_data: "search_voice_jobs" }
                ],
                [
                    { text: "🔍 بحث مخصص", callback_data: "custom_search" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "jobs_menu" }
                ]
            ]
        }
    };

    await bot.editMessageText("🔍 *البحث في الوظائف*\n\nاختر فئة الوظائف التي تريد البحث فيها:", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...searchMenu
    });
}

// دالة عرض أحدث الوظائف
async function handleLatestJobs(chatId, messageId) {
    try {
        await bot.editMessageText("🔄 *جاري جلب أحدث الوظائف...*", {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: "Markdown"
        });

        const jobsMessage = await generateModernJobsMessage();
        
        const backButton = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 تحديث", callback_data: "latest_jobs" },
                        { text: "⭐ حفظ في المفضلة", callback_data: "save_favorite" }
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

    } catch (error) {
        console.error("خطأ في جلب الوظائف:", error);
        await bot.editMessageText("❌ حدث خطأ في جلب الوظائف. حاول مرة أخرى لاحقاً.", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🔙 العودة", callback_data: "jobs_menu" }]
                ]
            }
        });
    }
}

// دالة إحصائيات الوظائف
async function handleJobStats(chatId, messageId) {
    const totalJobs = calculateTotalJobs();
    const categoriesCount = Object.keys(config.jobSources).length;
    
    const statsMessage = `
📊 *إحصائيات الوظائف*

📈 *الإحصائيات العامة:*
• إجمالي مصادر الوظائف: ${totalJobs}
• عدد الفئات: ${categoriesCount}
• آخر تحديث: ${new Date().toLocaleDateString('ar-EG')}

📋 *توزيع الوظائف حسب الفئة:*
${generateCategoryStats()}

🔥 *الأكثر نشاطاً:*
• وظائف الذكاء الاصطناعي
• تصنيف البيانات
• العمل الحر

📅 *معدل الوظائف الجديدة:*
• يومياً: 15-25 وظيفة
• أسبوعياً: 100-150 وظيفة
• شهرياً: 400-600 وظيفة
`;

    const statsButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📈 تفاصيل أكثر", callback_data: "detailed_stats" },
                    { text: "📊 رسم بياني", callback_data: "stats_chart" }
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
}

// دالة قائمة الاشتراك
async function handleSubscriptionMenu(chatId, messageId) {
    const subscriptionMessage = `
💰 *خطط الاشتراك*

🎯 *الخطة المجانية:*
• 5 وظائف يومياً
• إشعارات أساسية
• دعم محدود

⭐ *الخطة المميزة - 50 جنيه شهرياً:*
• وظائف غير محدودة
• إشعارات فورية ومخصصة
• أولوية في الوظائف الحصرية
• دعم فني مباشر
• إحصائيات متقدمة
• بحث متقدم بفلاتر

💎 *الخطة الاحترافية - 100 جنيه شهرياً:*
• جميع مميزات الخطة المميزة
• استشارات مهنية
• مراجعة السيرة الذاتية
• تدريب على المقابلات
• شبكة تواصل حصرية

💳 *طرق الدفع:*
• Orange Cash: \`${process.env.ORANGE_CASH}\`
• PayPal: \`${process.env.PAYPAL_EMAIL}\`
`;

    const subscriptionButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "⭐ اشتراك مميز", callback_data: "subscribe_premium" },
                    { text: "💎 اشتراك احترافي", callback_data: "subscribe_pro" }
                ],
                [
                    { text: "💳 طرق الدفع", callback_data: "payment_methods" },
                    { text: "📞 تواصل معنا", callback_data: "contact_support" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    };

    await bot.editMessageText(subscriptionMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...subscriptionButtons
    });
}

// دالة قائمة المساعدة
async function handleHelpMenu(chatId, messageId) {
    const helpMessage = `
ℹ️ *مركز المساعدة*

🚀 *كيفية استخدام البوت:*
• استخدم القوائم التفاعلية للتنقل
• اضغط على الأزرار بدلاً من كتابة الأوامر
• احفظ الوظائف المهمة في المفضلة

🔍 *البحث في الوظائف:*
• استخدم فلاتر البحث المتقدم
• اشترك في الإشعارات للوظائف الجديدة
• تابع الإحصائيات لمعرفة الاتجاهات

💡 *نصائح للنجاح:*
• اكتب CV باللغة الإنجليزية
• أضف خبراتك في اللغة العربية
• اذكر مهاراتك التقنية بوضوح
• كن صادقاً في مستوى خبرتك

📞 *تحتاج مساعدة إضافية؟*
تواصل معنا عبر: ${process.env.PAYPAL_EMAIL}
`;

    const helpButtons = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📖 دليل المستخدم", callback_data: "user_guide" },
                    { text: "❓ الأسئلة الشائعة", callback_data: "faq" }
                ],
                [
                    { text: "📞 تواصل معنا", callback_data: "contact_support" },
                    { text: "🐛 بلاغ خطأ", callback_data: "report_bug" }
                ],
                [
                    { text: "🔙 العودة", callback_data: "main_menu" }
                ]
            ]
        }
    };

    await bot.editMessageText(helpMessage, {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
        ...helpButtons
    });
}

// دالة توليد رسالة الوظائف الحديثة
async function generateModernJobsMessage() {
    const currentDate = new Date().toLocaleDateString("ar-EG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    let message = `
🚀 *وظائف Arab Annotators - ${currentDate}*

━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const jobCategories = Object.keys(config.jobSources);
    let totalJobs = 0;

    for (const category of jobCategories) {
        if (config.jobSources[category] && config.jobSources[category].length > 0) {
            let categoryTitle = "";
            let categoryIcon = "";
            
            switch (category) {
                case "aiJobs": 
                    categoryTitle = "وظائف الذكاء الاصطناعي";
                    categoryIcon = "🤖";
                    break;
                case "dataAnnotation": 
                    categoryTitle = "وظائف تعليق البيانات";
                    categoryIcon = "📊";
                    break;
                case "freelancePlatforms": 
                    categoryTitle = "منصات العمل الحر";
                    categoryIcon = "✍️";
                    break;
                case "techCompanies": 
                    categoryTitle = "شركات التكنولوجيا";
                    categoryIcon = "🏢";
                    break;
                case "arabicSpecific": 
                    categoryTitle = "وظائف خاصة باللغة العربية";
                    categoryIcon = "🌍";
                    break;
                case "voiceTraining": 
                    categoryTitle = "وظائف تدريب الصوت";
                    categoryIcon = "🎙️";
                    break;
                default: 
                    categoryTitle = "وظائف متنوعة";
                    categoryIcon = "💼";
            }
            
            message += `\n${categoryIcon} *${categoryTitle}:*\n`;
            
            config.jobSources[category].forEach((job, index) => {
                if (index < 3) { // عرض أول 3 وظائف فقط
                    message += `\n• [${job.name}](${job.url})\n  ${job.description}\n`;
                    totalJobs++;
                }
            });
            
            if (config.jobSources[category].length > 3) {
                message += `\n  ... و ${config.jobSources[category].length - 3} وظائف أخرى\n`;
            }
            
            message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
    }

    message += `
📊 *إجمالي الوظائف المعروضة:* ${totalJobs}

💡 *نصائح للتقديم:*
• اكتب CV باللغة الإنجليزية
• أضف خبراتك في اللغة العربية
• اذكر مهاراتك التقنية
• كن صادقاً في مستوى خبرتك

🔔 *للحصول على وظائف حصرية ومتقدمة، اشترك معنا!*
💰 اشتراك شهري بـ 50 جنيه فقط

#وظائف_عربية #ذكاء_اصطناعي #عمل_عن_بعد
`;

    return message;
}

// دوال مساعدة
function calculateTotalJobs() {
    let total = 0;
    Object.values(config.jobSources).forEach(category => {
        total += category.length;
    });
    return total;
}

function generateCategoryStats() {
    let stats = "";
    Object.entries(config.jobSources).forEach(([category, jobs]) => {
        let categoryName = "";
        switch (category) {
            case "aiJobs": categoryName = "🤖 الذكاء الاصطناعي"; break;
            case "dataAnnotation": categoryName = "📊 تعليق البيانات"; break;
            case "freelancePlatforms": categoryName = "✍️ العمل الحر"; break;
            case "techCompanies": categoryName = "🏢 الشركات التقنية"; break;
            case "arabicSpecific": categoryName = "🌍 الوظائف العربية"; break;
            case "voiceTraining": categoryName = "🎙️ تدريب الصوت"; break;
            default: categoryName = "💼 متنوعة";
        }
        stats += `• ${categoryName}: ${jobs.length} وظيفة\n`;
    });
    return stats;
}

// جدولة الإرسال اليومي (محدثة)
const dailyJob = new cron.CronJob("0 10 * * *", async () => {
    try {
        console.log("بدء الإرسال اليومي للوظائف...");
        
        const { data: subscribers, error } = await supabase
            .from("subscribers")
            .select("chat_id")
            .eq("active", true);

        if (error) {
            console.error("خطأ في جلب المشتركين:", error);
            return;
        }

        const jobsMessage = await generateModernJobsMessage();
        const dailyMessage = `
🌅 *صباح الخير! إليك وظائف اليوم*

${jobsMessage}

🎯 *هذه رسالة يومية تلقائية*
للإلغاء أرسل /stop
`;

        const dailyButtons = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💼 عرض جميع الوظائف", callback_data: "latest_jobs" },
                        { text: "🔍 البحث", callback_data: "search_jobs" }
                    ],
                    [
                        { text: "⚙️ إعدادات الإشعارات", callback_data: "notification_settings" }
                    ]
                ]
            }
        };

        for (const subscriber of subscribers || []) {
            try {
                await bot.sendMessage(subscriber.chat_id, dailyMessage, {
                    parse_mode: "Markdown",
                    disable_web_page_preview: true,
                    ...dailyButtons
                });
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`خطأ في إرسال رسالة للمستخدم ${subscriber.chat_id}:`, error);
            }
        }

        console.log(`تم إرسال الوظائف اليومية لـ ${subscribers?.length || 0} مشترك`);
    } catch (error) {
        console.error("خطأ في المهمة اليومية:", error);
    }
}, null, true, "Africa/Cairo");

// معالجة الرسائل النصية
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // تجاهل الأوامر
    if (text && text.startsWith("/")) return;

    // معالجة تأكيد الدفع
    if (text && /\d{6,}/.test(text)) {
        try {
            const { error } = await supabase
                .from("payment_confirmations")
                .insert([
                    {
                        chat_id: chatId,
                        user_name: msg.from.first_name || "غير محدد",
                        transaction_id: text,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) {
                console.error("خطأ في حفظ تأكيد الدفع:", error);
            }

            const confirmationButtons = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "💰 حالة الاشتراك", callback_data: "subscription_status" },
                            { text: "📞 تواصل معنا", callback_data: "contact_support" }
                        ],
                        [
                            { text: "🏠 الرئيسية", callback_data: "main_menu" }
                        ]
                    ]
                }
            };

            bot.sendMessage(chatId, `
✅ *تم استلام تأكيد الدفع*

🔢 رقم العملية: \`${text}\`

⏰ *سيتم مراجعة طلبك وتفعيل الاشتراك خلال 24 ساعة*

📞 للاستفسار تواصل معنا على:
${process.env.PAYPAL_EMAIL}

شكراً لثقتك في Arab Annotators! 🙏
`, { 
                parse_mode: "Markdown",
                ...confirmationButtons
            });

            // إشعار للأدمن
            if (process.env.ADMIN_USER_ID) {
                bot.sendMessage(process.env.ADMIN_USER_ID, `
🔔 *تأكيد دفع جديد*

👤 المستخدم: ${msg.from.first_name || "غير محدد"}
🆔 Chat ID: ${chatId}
🔢 رقم العملية: ${text}
⏰ الوقت: ${new Date().toLocaleString("ar-EG")}
`, { parse_mode: "Markdown" });
            }

        } catch (error) {
            console.error("خطأ في معالجة تأكيد الدفع:", error);
            bot.sendMessage(chatId, "❌ حدث خطأ في معالجة طلبك. حاول مرة أخرى.");
        }
    } else {
        // رسالة توجيهية للمستخدمين الجدد
        bot.sendMessage(chatId, `
👋 مرحباً! 

استخدم الأزرار التفاعلية أدناه للتنقل في البوت.
إذا كنت تريد البدء من جديد، اضغط /start

💡 *نصيحة:* لا تحتاج لكتابة أوامر، فقط استخدم الأزرار!
`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🏠 القائمة الرئيسية", callback_data: "main_menu" }]
                ]
            }
        });
    }
});

// معالجة الأخطاء
bot.on("error", (error) => {
    console.error("خطأ في البوت:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

console.log("🚀 Arab Annotators Bot الحديث بدأ العمل...");
console.log("⏰ المهمة اليومية مجدولة للساعة 10:00 صباحاً بتوقيت القاهرة");
console.log("✨ واجهة تفاعلية حديثة مفعلة!");

