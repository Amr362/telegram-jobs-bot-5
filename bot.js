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
    config = { jobSources: {} }; // Changed to empty object to avoid errors if jobSources is accessed
}

// رسالة الترحيب
const welcomeMessage = `
🌟 *مرحباً بك في Arab Annotators Bot* 🌟

🎯 *نحن متخصصون في:*
• وظائف الذكاء الاصطناعي
• تدريب النماذج اللغوية العربية
• تصنيف البيانات والتعليق التوضيحي
• مشاريع الصوت والنصوص العربية

🌐 *موقعنا الرسمي:*
https://arabannotators.store

💳 *طرق الدفع المتاحة:*
• Orange Cash: ${process.env.ORANGE_CASH}
• PayPal: ${process.env.PAYPAL_EMAIL}

📱 *الأوامر المتاحة:*
/start - رسالة الترحيب
/subscribe - تفاصيل الاشتراك
/jobs - عرض الوظائف المتاحة

🔔 سنرسل لك الوظائف الجديدة يومياً الساعة 10 صباحاً!
`;

// أمر البداية
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || "صديقي";
    
    bot.sendMessage(chatId, `مرحباً ${userName}! 👋\n\n${welcomeMessage}`, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "🌐 زيارة الموقع", url: "https://arabannotators.store" },
                    { text: "💰 الاشتراك", callback_data: "subscribe" }
                ],
                [
                    { text: "💼 عرض الوظائف", callback_data: "jobs" }
                ]
            ]
        }
    });
});

// أمر الاشتراك
bot.onText(/\/subscribe/, (msg) => {
    const chatId = msg.chat.id;
    
    const subscribeMessage = `
💰 *تفاصيل الاشتراك في Arab Annotators*

🎯 *ما ستحصل عليه:*
• إشعارات يومية بأحدث الوظائف
• وظائف حصرية في مجال الذكاء الاصطناعي
• مشاريع تدريب النماذج العربية
• دعم فني مباشر

💳 *طرق الدفع:*

📱 *Orange Cash:*
الرقم: \`${process.env.ORANGE_CASH}\`

💰 *PayPal:*
البريد: \`${process.env.PAYPAL_EMAIL}\`

📝 *بعد الدفع:*
أرسل رقم العملية أو لقطة شاشة للتأكيد

⚡ *سعر الاشتراك الشهري: 50 جنيه مصري*
`;

    bot.sendMessage(chatId, subscribeMessage, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📱 نسخ رقم Orange Cash", callback_data: "copy_orange" },
                    { text: "💰 نسخ PayPal", callback_data: "copy_paypal" }
                ],
                [
                    { text: "✅ تأكيد الدفع", callback_data: "confirm_payment" }
                ]
            ]
        }
    });
});

// أمر عرض الوظائف
bot.onText(/\/jobs/, async (msg) => {
    const chatId = msg.chat.id;
    await sendJobsMessage(chatId, "all");
});

// معالجة الأزرار
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    const chatId = message.chat.id;

    switch (data) {
        case "subscribe":
            bot.sendMessage(chatId, `
💰 *تفاصيل الاشتراك*

💳 *طرق الدفع:*
• Orange Cash: \`${process.env.ORANGE_CASH}\`
• PayPal: \`${process.env.PAYPAL_EMAIL}\`

أرسل رقم العملية بعد الدفع للتأكيد ✅
`, { parse_mode: "Markdown" });
            break;

        case "jobs":
            await sendJobsMessage(chatId, "all");
            break;

        case "latest_jobs_week":
            await sendJobsMessage(chatId, "week");
            break;

        case "copy_orange":
            bot.sendMessage(chatId, `📱 رقم Orange Cash:\n\`${process.env.ORANGE_CASH}\``, { parse_mode: "Markdown" });
            break;

        case "copy_paypal":
            bot.sendMessage(chatId, `💰 بريد PayPal:\n\`${process.env.PAYPAL_EMAIL}\``, { parse_mode: "Markdown" });
            break;

        case "confirm_payment":
            bot.sendMessage(chatId, `
✅ *تأكيد الدفع*

أرسل الآن:
• رقم العملية
• أو لقطة شاشة من عملية الدفع
• أو رقم المرجع

سيتم تفعيل اشتراكك خلال 24 ساعة 🚀
`);
            break;
    }

    bot.answerCallbackQuery(callbackQuery.id);
});

// دالة إرسال الوظائف
async function sendJobsMessage(chatId, filterType) {
    try {
        bot.sendMessage(chatId, "🔍 جاري البحث عن أحدث الوظائف...");

        const jobsMessage = await generateJobsMessage(filterType);
        
        bot.sendMessage(chatId, jobsMessage, {
            parse_mode: "Markdown",
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 تحديث الوظائف", callback_data: "jobs" },
                        { text: "💰 اشترك للمزيد", callback_data: "subscribe" }
                    ],
                    [
                        { text: "🆕 وظائف هذا الأسبوع", callback_data: "latest_jobs_week" }
                    ]
                ]
            }
        });
    } catch (error) {
        console.error("خطأ في إرسال الوظائف:", error);
        bot.sendMessage(chatId, "❌ حدث خطأ في جلب الوظائف. حاول مرة أخرى لاحقاً.");
    }
}

// دالة توليد رسالة الوظائف
async function generateJobsMessage(filterType) {
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

    for (const category of jobCategories) {
        if (config.jobSources[category] && config.jobSources[category].length > 0) {
            let categoryTitle = "";
            switch (category) {
                case "aiJobs": categoryTitle = "🤖 وظائف الذكاء الاصطناعي:"; break;
                case "dataAnnotation": categoryTitle = "📊 وظائف تعليق البيانات:"; break;
                case "freelancePlatforms": categoryTitle = "✍️ منصات العمل الحر:"; break;
                case "techCompanies": categoryTitle = "🏢 شركات التكنولوجيا:"; break;
                case "arabicSpecific": categoryTitle = "🌍 وظائف خاصة باللغة العربية:"; break;
                case "voiceTraining": categoryTitle = "🎙️ وظائف تدريب الصوت:"; break;
                default: categoryTitle = "وظائف متنوعة:";
            }
            message += `\n${categoryTitle}\n`;
            config.jobSources[category].forEach(job => {
                message += `\n• [${job.name}](${job.url}) - ${job.description}\n`;
            });
            message += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        }
    }

    message += `
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

// جدولة الإرسال اليومي
const dailyJob = new cron.CronJob("0 10 * * *", async () => {
    try {
        console.log("بدء الإرسال اليومي للوظائف...");
        
        // جلب قائمة المشتركين من قاعدة البيانات
        const { data: subscribers, error } = await supabase
            .from("subscribers")
            .select("chat_id")
            .eq("active", true);

        if (error) {
            console.error("خطأ في جلب المشتركين:", error);
            return;
        }

        const jobsMessage = await generateJobsMessage("all"); // Daily message sends all jobs
        const dailyMessage = `
🌅 *صباح الخير! إليك وظائف اليوم*

${jobsMessage}

🎯 *هذه رسالة يومية تلقائية*
للإلغاء أرسل /stop
`;

        // إرسال للمشتركين
        for (const subscriber of subscribers || []) {
            try {
                await bot.sendMessage(subscriber.chat_id, dailyMessage, {
                    parse_mode: "Markdown",
                    disable_web_page_preview: true
                });
                
                // تأخير بسيط لتجنب حدود التيليجرام
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

// معالجة الرسائل النصية (لتأكيد الدفع)
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // تجاهل الأوامر
    if (text && text.startsWith("/")) return;

    // إذا كانت الرسالة تحتوي على أرقام (رقم عملية محتمل)
    if (text && /\d{6,}/.test(text)) {
        try {
            // حفظ معلومات الدفع في قاعدة البيانات
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

            bot.sendMessage(chatId, `
✅ *تم استلام تأكيد الدفع*

🔢 رقم العملية: \`${text}\`

⏰ *سيتم مراجعة طلبك وتفعيل الاشتراك خلال 24 ساعة*

📞 للاستفسار تواصل معنا على:
${process.env.PAYPAL_EMAIL}

شكراً لثقتك في Arab Annotators! 🙏
`, { parse_mode: "Markdown" });

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
    }
});

// معالجة الأخطاء
bot.on("error", (error) => {
    console.error("خطأ في البوت:", error);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

console.log("🚀 Arab Annotators Bot بدأ العمل...");
console.log("⏰ المهمة اليومية مجدولة للساعة 10:00 صباحاً بتوقيت القاهرة");

// إضافة Express Server لـ UptimeRobot
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.json({
        status: "✅ Bot is running!",
        bot_name: "Arab Annotators Bot",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Server is live on port ${PORT}`);
});

const jobMonitor = require('./job_monitor');




bot.onText(/\/monitor_jobs/, async (msg) => {
    const chatId = msg.chat.id;
    console.log("بدء مراقبة الوظائف...");
    let allNewJobs = [];

    console.log("جلب وظائف Outlier AI...");
    const outlierJobs = await jobMonitor.scrapeOutlierAI();
    console.log(`تم جلب ${outlierJobs.length} وظيفة من Outlier AI.`);
    allNewJobs = allNewJobs.concat(outlierJobs);

    console.log("جلب وظائف Alignerr...");
    const alignerrJobs = await jobMonitor.scrapeAlignerr();
    console.log(`تم جلب ${alignerrJobs.length} وظيفة من Alignerr.`);
    allNewJobs = allNewJobs.concat(alignerrJobs);

    console.log("جلب وظائف CVAT...");
    const cvatJobs = await jobMonitor.fetchCvatJobs();
    console.log(`تم جلب ${cvatJobs.length} وظيفة من CVAT.`);
    allNewJobs = allNewJobs.concat(cvatJobs);

    console.log("جلب وظائف Dataannotation Tech...");
    const dataannotationJobs = await jobMonitor.scrapeDataannotationTech();
    console.log(`تم جلب ${dataannotationJobs.length} وظيفة من Dataannotation Tech.`);
    allNewJobs = allNewJobs.concat(dataannotationJobs);

    console.log("جلب وظائف Turing...");
    const turingJobs = await jobMonitor.scrapeTuring();
    console.log(`تم جلب ${turingJobs.length} وظيفة من Turing.`);
    allNewJobs = allNewJobs.concat(turingJobs);

    console.log("جلب وظائف Argilla...");
    const argillaJobs = await jobMonitor.scrapeArgilla();
    console.log(`تم جلب ${argillaJobs.length} وظيفة من Argilla.`);
    allNewJobs = allNewJobs.concat(argillaJobs);

    console.log("جلب وظائف Clickworker...");
    const clickworkerJobs = await jobMonitor.scrapeClickworker();
    console.log(`تم جلب ${clickworkerJobs.length} وظيفة من Clickworker.`);
    allNewJobs = allNewJobs.concat(clickworkerJobs);

    console.log("جلب وظائف X AI...");
    const xaiJobs = await jobMonitor.scrapeXAI();
    console.log(`تم جلب ${xaiJobs.length} وظيفة من X AI.`);
    allNewJobs = allNewJobs.concat(xaiJobs);

    console.log("جلب وظائف Stellar AI...");
    const stellarAIJobs = await jobMonitor.scrapeStellarAI();
    console.log(`تم جلب ${stellarAIJobs.length} وظيفة من Stellar AI.`);
    allNewJobs = allNewJobs.concat(stellarAIJobs);

    console.log("جلب وظائف Hivemicro...");
    const hivemicroJobs = await jobMonitor.scrapeHivemicro();
    console.log(`تم جلب ${hivemicroJobs.length} وظيفة من Hivemicro.`);
    allNewJobs = allNewJobs.concat(hivemicroJobs);

    console.log("جلب وظائف Humanatic...");
    const humanaticJobs = await jobMonitor.scrapeHumanatic();
    console.log(`تم جلب ${humanaticJobs.length} وظيفة من Humanatic.`);
    allNewJobs = allNewJobs.concat(humanaticJobs);

    console.log("جلب وظائف Wow AI...");
    const wowAIJobs = await jobMonitor.scrapeWowAI();
    console.log(`تم جلب ${wowAIJobs.length} وظيفة من Wow AI.`);
    allNewJobs = allNewJobs.concat(wowAIJobs);

    console.log("جلب وظائف Mturk...");
    const mturkJobs = await jobMonitor.fetchMturkJobs();
    console.log(`تم جلب ${mturkJobs.length} وظيفة من Mturk.`);
    allNewJobs = allNewJobs.concat(mturkJobs);

    console.log("جلب وظائف Lemon AI...");
    const lemonAIJobs = await jobMonitor.scrapeLemonAI();
    console.log(`تم جلب ${lemonAIJobs.length} وظيفة من Lemon AI.`);
    allNewJobs = allNewJobs.concat(lemonAIJobs);

    console.log("جلب وظائف Telus International...");
    const telusInternationalJobs = await jobMonitor.scrapeTelusInternational();
    console.log(`تم جلب ${telusInternationalJobs.length} وظيفة من Telus International.`);
    allNewJobs = allNewJobs.concat(telusInternationalJobs);

    console.log("جلب وظائف Datature...");
    const datatureJobs = await jobMonitor.scrapeDatature();
    console.log(`تم جلب ${datatureJobs.length} وظيفة من Datature.`);
    allNewJobs = allNewJobs.concat(datatureJobs);

    console.log("جلب وظائف Surge AI...");
    const surgeAIJobs = await jobMonitor.scrapeSurgeAI();
    console.log(`تم جلب ${surgeAIJobs.length} وظيفة من Surge AI.`);
    allNewJobs = allNewJobs.concat(surgeAIJobs);

    console.log("جلب وظائف Suki AI...");
    const sukiAIJobs = await jobMonitor.fetchSukiAIJobs();
    console.log(`تم جلب ${sukiAIJobs.length} وظيفة من Suki AI.`);
    allNewJobs = allNewJobs.concat(sukiAIJobs);

    console.log("جلب وظائف Cloud Factory...");
    const cloudFactoryJobs = await jobMonitor.scrapeCloudFactory();
    console.log(`تم جلب ${cloudFactoryJobs.length} وظيفة من Cloud Factory.`);
    allNewJobs = allNewJobs.concat(cloudFactoryJobs);

    console.log("جلب وظائف Spark AI...");
    const sparkAIJobs = await jobMonitor.scrapeSparkAI();
    console.log(`تم جلب ${sparkAIJobs.length} وظيفة من Spark AI.`);
    allNewJobs = allNewJobs.concat(sparkAIJobs);

    console.log("جلب وظائف Cohere...");
    const cohereJobs = await jobMonitor.fetchCohereJobs();
    console.log(`تم جلب ${cohereJobs.length} وظيفة من Cohere.`);
    allNewJobs = allNewJobs.concat(cohereJobs);

    console.log("جلب وظائف Datadog...");
    const datadogJobs = await jobMonitor.fetchDatadogJobs();
    console.log(`تم جلب ${datadogJobs.length} وظيفة من Datadog.`);
    allNewJobs = allNewJobs.concat(datadogJobs);

    console.log("جلب وظائف Datatroniq...");
    const datatroniqJobs = await jobMonitor.scrapeDatatroniq();
    console.log(`تم جلب ${datatroniqJobs.length} وظيفة من Datatroniq.`);
    allNewJobs = allNewJobs.concat(datatroniqJobs);

    console.log("جلب وظائف Hivemind...");
    const hivemindJobs = await jobMonitor.scrapeHivemind();
    console.log(`تم جلب ${hivemindJobs.length} وظيفة من Hivemind.`);
    allNewJobs = allNewJobs.concat(hivemindJobs);

    console.log("جلب وظائف Soul AI...");
    const soulAIJobs = await jobMonitor.scrapeSoulAI();
    console.log(`تم جلب ${soulAIJobs.length} وظيفة من Soul AI.`);
    allNewJobs = allNewJobs.concat(soulAIJobs);

    console.log("جلب وظائف iMerit...");
    const imeritJobs = await jobMonitor.fetchImeritJobs();
    console.log(`تم جلب ${imeritJobs.length} وظيفة من iMerit.`);
    allNewJobs = allNewJobs.concat(imeritJobs);

    console.log("جلب وظائف Labelbox...");
    const labelboxJobs = await jobMonitor.scrapeLabelbox();
    console.log(`تم جلب ${labelboxJobs.length} وظيفة من Labelbox.`);
    allNewJobs = allNewJobs.concat(labelboxJobs);

    console.log("جلب وظائف Lebal Studio...");
    const lebalStudioJobs = await jobMonitor.scrapeLebalStudio();
    console.log(`تم جلب ${lebalStudioJobs.length} وظيفة من Lebal Studio.`);
    allNewJobs = allNewJobs.concat(lebalStudioJobs);

    console.log(`إجمالي الوظائف التي تم جلبها: ${allNewJobs.length}`);
    const filteredJobs = jobMonitor.filterJobsByKeywords(allNewJobs);
    console.log(`إجمالي الوظائف المفلترة: ${filteredJobs.length}`);

    if (filteredJobs.length > 0) {
        let message = "تم العثور على وظائف جديدة ذات صلة:\n\n";
        filteredJobs.forEach(job => {
            message += `*${job.title}*\n${job.link}\n\n`;
        });
        ctx.replyWithMarkdown(message);
    } else {
        bot.sendMessage(chatId, "لم يتم العثور على وظائف جديدة ذات صلة في الوقت الحالي.");
    }
});


