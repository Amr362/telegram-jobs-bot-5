const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

// التحقق من المتغيرات البيئية المطلوبة
const requiredEnvVars = ['BOT_TOKEN', 'SUPABASE_URL', 'SUPABASE_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ متغير البيئة ${envVar} مطلوب ولكنه غير موجود`);
        process.exit(1);
    }
}

console.log("✅ جميع متغيرات البيئة متوفرة");

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

🤖 *وظائف الذكاء الاصطناعي:*
• [Outlier AI](https://outlier.ai/careers) - تدريب النماذج العربية
• [Alignerr](https://alignerr.com) - محاذاة الذكاء الاصطناعي
• [Turing](https://www.turing.com) - هندسة الذكاء الاصطناعي

📊 *وظائف تعليق البيانات:*
• [CVAT](https://www.cvat.ai) - تعليق الصور والفيديو
• [Dataannotation](https://dataannotation.tech) - تصنيف البيانات
• [Clickworker](https://www.clickworker.com) - مهام متنوعة

✍️ *منصات العمل الحر:*
• [Upwork AI Jobs](https://upwork.com) - مشاريع متنوعة
• [Freelancer](https://freelancer.com) - وظائف عربية

━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// إضافة Express Server لـ UptimeRobot
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

console.log("🚀 Arab Annotators Bot بدأ العمل...");
console.log("✅ البوت جاهز لاستقبال الرسائل");
console.log(`🔗 Dev URL متاح للـ UptimeRobot monitoring`);