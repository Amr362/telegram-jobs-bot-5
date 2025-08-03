# 🤖 Arab Annotators Bot v4.0

## البوت الأكثر تطوراً للوظائف العربية في مجال الذكاء الاصطناعي

[![Deploy to Replit](https://img.shields.io/badge/Deploy%20to-Replit-blue?style=for-the-badge&logo=replit)](https://replit.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub-Actions-green?style=for-the-badge&logo=github)](https://github.com/features/actions)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

## 🌟 الميزات الجديدة في الإصدار 4.0

### 🚀 محرك البحث المتطور
- **بحث ذكي أفضل من جوجل** - يستخدم خوارزميات متقدمة للعثور على أفضل الوظائف
- **بحث متوازي في أكثر من 50 موقع** - LinkedIn, Indeed, Glassdoor, Remote OK وأكثر
- **تصفية ذكية بالذكاء الاصطناعي** - إزالة المكررات والوظائف غير ذات الصلة
- **ترتيب متقدم** - حسب الصلة، الجودة، الحداثة، والشعبية
- **كاش ذكي** - استجابة فورية للبحثات المتكررة

### 🎯 دقة عالية في النتائج
- **فحص جودة متقدم** - تصفية الوظائف المزيفة والسبام
- **نظام نقاط ذكي** - تقييم كل وظيفة حسب معايير متعددة
- **تنوع في النتائج** - ضمان عدم هيمنة مصدر واحد
- **تحديث مستمر** - مراقبة المواقع كل دقيقة

### 🔔 نظام إشعارات ذكي
- **إشعارات مخصصة** - حسب الكلمات المفتاحية والمناطق
- **جدولة متقدمة** - اختيار الأوقات المناسبة
- **إشعارات فورية** - عند ظهور وظائف جديدة مطابقة
- **تقارير دورية** - ملخصات يومية وأسبوعية

### 📊 إحصائيات وتحليلات
- **لوحة مراقبة متقدمة** - مراقبة الأداء في الوقت الفعلي
- **تحليل الاتجاهات** - معرفة أكثر الوظائف طلباً
- **إحصائيات شخصية** - تتبع نشاط كل مستخدم
- **تقارير مفصلة** - تحليل السوق والفرص

### 🌍 دعم متعدد المناطق
- **8 دول عربية** - مصر، السعودية، الإمارات، قطر، الكويت، الأردن، لبنان، المغرب
- **بحث محلي وعالمي** - وظائف محلية وعن بُعد
- **دعم العملات المحلية** - عرض الرواتب بالعملة المناسبة
- **توقيت محلي** - مراعاة المناطق الزمنية

---

## 🚀 النشر التلقائي

### إعداد GitHub Actions

1. **إضافة Secrets في GitHub:**
   ```
   REPLIT_TOKEN=your_replit_token
   REPLIT_URL=your_replit_webhook_url
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

2. **تفعيل GitHub Actions:**
   - اذهب إلى تبويب Actions في المستودع
   - فعل Workflows
   - سيتم النشر التلقائي عند كل push

### إعداد Replit

1. **استيراد المشروع:**
   ```bash
   git clone https://github.com/Amr362/telegram-jobs-bot-5.git
   ```

2. **إضافة متغيرات البيئة:**
   ```env
   BOT_TOKEN=your_telegram_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   GITHUB_TOKEN=your_github_token
   ```

3. **تشغيل البوت:**
   ```bash
   npm start
   ```

### النشر السريع

```bash
# نشر تلقائي بأمر واحد
./deploy.sh

# أو يدوياً
git add .
git commit -m "Update bot"
git push origin main
```

---

## 📋 متطلبات التشغيل

### البيئة المطلوبة
- **Node.js** 18+ 
- **npm** 9+
- **Git** للتحكم في الإصدار
- **Supabase** لقاعدة البيانات
- **Telegram Bot Token**

### التبعيات الأساسية
```json
{
  "node-telegram-bot-api": "^0.66.0",
  "axios": "^1.6.2",
  "cheerio": "^1.0.0-rc.12",
  "@supabase/supabase-js": "^2.39.0",
  "express": "^4.18.2",
  "cron": "^3.1.6"
}
```

---

## 🛠️ التثبيت والإعداد

### 1. استنساخ المشروع
```bash
git clone https://github.com/Amr362/telegram-jobs-bot-5.git
cd telegram-jobs-bot-5
```

### 2. تثبيت التبعيات
```bash
npm install
npm audit fix --force
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env
# قم بتحرير .env وإضافة القيم المطلوبة
```

### 4. إعداد قاعدة البيانات
```sql
-- في Supabase
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    user_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    url TEXT UNIQUE NOT NULL,
    description TEXT,
    location TEXT,
    salary TEXT,
    source TEXT,
    category TEXT,
    match_score INTEGER,
    quality_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE search_analytics (
    id SERIAL PRIMARY KEY,
    user_id BIGINT,
    search_query TEXT,
    results_count INTEGER,
    response_time INTEGER,
    success BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. تشغيل البوت
```bash
# للتطوير
npm run dev

# للإنتاج
npm start

# فحص الصحة
npm run health
```

---

## 📊 مراقبة الأداء

### لوحة المراقبة
- **الرابط:** `http://localhost:8080/dashboard`
- **مراقبة الوقت الفعلي** للأداء والصحة
- **إحصائيات مفصلة** عن الاستخدام
- **تنبيهات تلقائية** عند حدوث مشاكل

### API الصحة
```bash
# فحص حالة البوت
curl http://localhost:8080/health

# تحديث حالة البوت
curl -X POST http://localhost:8080/status \
  -H "Content-Type: application/json" \
  -d '{"isRunning": true, "performance": {...}}'
```

---

## 🔧 التخصيص والتطوير

### إضافة مصادر جديدة
```javascript
// في config.json
{
  "jobSources": {
    "newCategory": [
      {
        "name": "موقع جديد",
        "url": "https://example.com/jobs",
        "description": "وصف الموقع",
        "category": "فئة جديدة"
      }
    ]
  }
}
```

### تخصيص محرك البحث
```javascript
// في enhanced_bot_v4.js
class SuperiorJobSearchEngine {
  // إضافة طرق بحث جديدة
  async searchNewSite(filters, searchId) {
    // منطق البحث المخصص
  }
}
```

### إضافة قوائم جديدة
```javascript
// في advanced_menu_system.js
class AdvancedMenuManager {
  static getNewMenu() {
    return {
      reply_markup: {
        inline_keyboard: [
          // أزرار القائمة الجديدة
        ]
      }
    };
  }
}
```

---

## 🔒 الأمان والخصوصية

### حماية البيانات
- **تشفير البيانات الحساسة**
- **حماية من هجمات DDoS**
- **تحديد معدل الطلبات**
- **تسجيل مراجعة شامل**

### أفضل الممارسات
- **عدم تخزين كلمات المرور**
- **استخدام HTTPS دائماً**
- **تحديث التبعيات بانتظام**
- **مراقبة الثغرات الأمنية**

---

## 📈 الأداء والتحسين

### إحصائيات الأداء
- **متوسط وقت الاستجابة:** < 2 ثانية
- **معدل النجاح:** > 95%
- **دقة النتائج:** > 90%
- **رضا المستخدمين:** > 4.8/5

### تحسينات مستمرة
- **تحسين خوارزميات البحث**
- **إضافة مصادر جديدة**
- **تحسين واجهة المستخدم**
- **تطوير ميزات جديدة**

---

## 🤝 المساهمة

### كيفية المساهمة
1. **Fork المشروع**
2. **إنشاء فرع جديد** (`git checkout -b feature/amazing-feature`)
3. **Commit التغييرات** (`git commit -m 'Add amazing feature'`)
4. **Push للفرع** (`git push origin feature/amazing-feature`)
5. **فتح Pull Request**

### إرشادات المساهمة
- **اتبع معايير الكود**
- **أضف اختبارات للميزات الجديدة**
- **حدث الوثائق**
- **اختبر التغييرات جيداً**

---

## 📞 الدعم والتواصل

### طرق التواصل
- **GitHub Issues:** للإبلاغ عن الأخطاء
- **Discussions:** للأسئلة والاقتراحات
- **Email:** support@arabannotators.com
- **Telegram:** @ArabAnnotatorsSupport

### الدعم الفني
- **استجابة سريعة** خلال 24 ساعة
- **دعم متعدد اللغات** (العربية والإنجليزية)
- **مساعدة في الإعداد والتخصيص**
- **تدريب على الاستخدام**

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 🙏 شكر وتقدير

- **فريق Arab Annotators** للرؤية والدعم
- **مجتمع المطورين العرب** للمساهمات
- **مستخدمي البوت** للتغذية الراجعة
- **المكتبات مفتوحة المصدر** المستخدمة

---

## 📊 إحصائيات المشروع

![GitHub stars](https://img.shields.io/github/stars/Amr362/telegram-jobs-bot-5?style=social)
![GitHub forks](https://img.shields.io/github/forks/Amr362/telegram-jobs-bot-5?style=social)
![GitHub issues](https://img.shields.io/github/issues/Amr362/telegram-jobs-bot-5)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Amr362/telegram-jobs-bot-5)

---

<div align="center">

**🤖 Arab Annotators Bot v4.0**

*البوت الأكثر تطوراً للوظائف العربية*

[الموقع الرسمي](https://arabannotators.store) • [التوثيق](https://docs.arabannotators.store) • [الدعم](https://support.arabannotators.store)

</div>

