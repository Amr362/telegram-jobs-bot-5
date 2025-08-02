# Arab Annotators Bot 🤖

بوت تيليجرام متخصص في إرسال إشعارات الوظائف في مجال الذكاء الاصطناعي والتعليق التوضيحي للبيانات العربية.

## 🌟 المميزات

- ✅ إرسال يومي تلقائي للوظائف الساعة 10 صباحاً
- ✅ تصنيف الوظائف حسب المجال (AI، تعليق البيانات، مشاريع عربية، تدريب الصوت)
- ✅ نظام اشتراكات مع دعم Orange Cash و PayPal
- ✅ واجهة تفاعلية مع أزرار inline
- ✅ قاعدة بيانات Supabase لإدارة المشتركين
- ✅ مصادر وظائف متنوعة ومحدثة

## 🚀 النشر على Render

### الخطوة 1: رفع المشروع على GitHub

1. **إنشاء Repository جديد:**
   ```bash
   # في GitHub، أنشئ repository جديد باسم "arab-annotators-bot"
   ```

2. **رفع الملفات:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Arab Annotators Bot"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/arab-annotators-bot.git
   git push -u origin main
   ```

### الخطوة 2: النشر على Render

1. **إنشاء حساب على Render:**
   - اذهب إلى [render.com](https://render.com)
   - سجل دخول بحساب GitHub

2. **إنشاء Web Service جديد:**
   - اضغط "New" → "Web Service"
   - اختر repository "arab-annotators-bot"
   - املأ البيانات التالية:

   ```
   Name: arab-annotators-bot
   Environment: Node
   Region: Frankfurt (EU Central)
   Branch: main
   Build Command: npm install
   Start Command: node bot.js
   ```

3. **إعداد متغيرات البيئة:**
   في قسم "Environment Variables" أضف:
   ```
   BOT_TOKEN=8049922843:AAEMhlYFr3oyz61KK0gCpHylkLQbOGgywrk
   ADMIN_USER_ID=5854264732
   SUPABASE_URL=https://tindmlcmfgjcqgwrssqz.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbmRtbGNtZmdqY3Fnd3Jzc3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzOTQ3OTMsImV4cCI6MjA2ODk3MDc5M30.cTm8TLEsb7WzSPpt9qrD8xP19sAVWUwuH3EOcX-vZ2s
   ORANGE_CASH=201271284263
   PAYPAL_EMAIL=amramramr55000@gmail.com
   ```

4. **النشر:**
   - اضغط "Create Web Service"
   - انتظر حتى يكتمل النشر (5-10 دقائق)

## 🗄️ إعداد قاعدة البيانات (Supabase)

### إنشاء الجداول المطلوبة:

1. **جدول المشتركين:**
   ```sql
   CREATE TABLE subscribers (
     id SERIAL PRIMARY KEY,
     chat_id BIGINT UNIQUE NOT NULL,
     user_name TEXT,
     active BOOLEAN DEFAULT true,
     subscription_date TIMESTAMP DEFAULT NOW(),
     expiry_date TIMESTAMP
   );
   ```

2. **جدول تأكيدات الدفع:**
   ```sql
   CREATE TABLE payment_confirmations (
     id SERIAL PRIMARY KEY,
     chat_id BIGINT NOT NULL,
     user_name TEXT,
     transaction_id TEXT NOT NULL,
     status TEXT DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT NOW(),
     processed_at TIMESTAMP
   );
   ```

## 📱 الأوامر المتاحة

- `/start` - رسالة الترحيب مع معلومات الموقع
- `/subscribe` - تفاصيل الاشتراك وطرق الدفع
- `/jobs` - عرض الوظائف المتاحة حالياً

## 🔧 التطوير المحلي

1. **تثبيت المكتبات:**
   ```bash
   npm install
   ```

2. **تشغيل البوت:**
   ```bash
   npm start
   ```

## 📁 هيكل المشروع

```
Bot/
├── bot.js              # الكود الرئيسي للبوت
├── config.json         # مصادر الوظائف والإعدادات
├── package.json        # إعدادات Node.js والمكتبات
├── .env               # متغيرات البيئة (لا ترفع على GitHub)
└── README.md          # هذا الملف
```

## 🔄 التحديثات التلقائية

البوت مُعد للتحديث التلقائي عند:
- Push جديد على GitHub
- Render سيعيد النشر تلقائياً

## 🛠️ استكشاف الأخطاء

### مشاكل شائعة:

1. **البوت لا يرد:**
   - تأكد من صحة BOT_TOKEN
   - تحقق من logs في Render

2. **خطأ في قاعدة البيانات:**
   - تأكد من إنشاء الجداول في Supabase
   - تحقق من صحة SUPABASE_URL و SUPABASE_KEY

3. **الإرسال اليومي لا يعمل:**
   - تأكد من أن الخدمة تعمل 24/7 على Render
   - تحقق من timezone في الكود

## 📞 الدعم

للدعم التقني تواصل على:
- Email: amramramr55000@gmail.com
- Website: https://arabannotators.store

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT.

---

**ملاحظة مهمة:** لا تشارك ملف `.env` أو تحمله على GitHub لأنه يحتوي على معلومات حساسة. استخدم متغيرات البيئة في Render بدلاً من ذلك.

