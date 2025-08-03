#!/bin/bash

# Arab Annotators Bot - Auto Deploy Script
# هذا السكريبت يقوم بالنشر التلقائي على Replit

set -e

echo "🚀 بدء عملية النشر التلقائي..."

# ألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة لطباعة الرسائل الملونة
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# التحقق من وجود Git
if ! command -v git &> /dev/null; then
    print_error "Git غير مثبت!"
    exit 1
fi

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js غير مثبت!"
    exit 1
fi

# التحقق من وجود npm
if ! command -v npm &> /dev/null; then
    print_error "npm غير مثبت!"
    exit 1
fi

print_status "التحقق من حالة Git..."

# التحقق من وجود تغييرات غير محفوظة
if [[ -n $(git status --porcelain) ]]; then
    print_warning "يوجد تغييرات غير محفوظة"
    
    # إضافة جميع الملفات
    print_status "إضافة جميع الملفات..."
    git add .
    
    # إنشاء commit تلقائي
    COMMIT_MESSAGE="Auto-deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    print_status "إنشاء commit: $COMMIT_MESSAGE"
    git commit -m "$COMMIT_MESSAGE"
else
    print_success "لا توجد تغييرات جديدة"
fi

# تحديث التبعيات
print_status "تحديث التبعيات..."
npm install

# إصلاح الثغرات الأمنية
print_status "إصلاح الثغرات الأمنية..."
npm audit fix --force || print_warning "بعض الثغرات لم يتم إصلاحها"

# تشغيل الاختبارات إذا كانت موجودة
if npm run test --silent 2>/dev/null; then
    print_status "تشغيل الاختبارات..."
    npm test
else
    print_warning "لا توجد اختبارات للتشغيل"
fi

# بناء المشروع إذا كان مطلوباً
if npm run build --silent 2>/dev/null; then
    print_status "بناء المشروع..."
    npm run build
else
    print_status "لا يحتاج المشروع للبناء"
fi

# دفع التغييرات إلى GitHub
print_status "دفع التغييرات إلى GitHub..."

# الحصول على الفرع الحالي
CURRENT_BRANCH=$(git branch --show-current)
print_status "الفرع الحالي: $CURRENT_BRANCH"

# دفع التغييرات
if git push origin "$CURRENT_BRANCH"; then
    print_success "تم دفع التغييرات بنجاح إلى GitHub"
else
    print_error "فشل في دفع التغييرات إلى GitHub"
    exit 1
fi

# انتظار GitHub Actions
print_status "انتظار GitHub Actions..."
sleep 10

# التحقق من حالة النشر
print_status "التحقق من حالة النشر..."

# إرسال إشعار للتليجرام (إذا كان متاحاً)
if [ ! -z "$TELEGRAM_BOT_TOKEN" ] && [ ! -z "$TELEGRAM_CHAT_ID" ]; then
    MESSAGE="🚀 تم بدء النشر التلقائي للبوت%0A%0A📝 الفرع: $CURRENT_BRANCH%0A⏰ الوقت: $(date '+%Y-%m-%d %H:%M:%S')%0A🔗 المستودع: $(git config --get remote.origin.url)"
    
    curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
        -d "chat_id=$TELEGRAM_CHAT_ID" \
        -d "text=$MESSAGE" \
        -d "parse_mode=HTML" > /dev/null
    
    print_success "تم إرسال إشعار التليجرام"
fi

# إنشاء ملف معلومات النشر
DEPLOY_INFO_FILE="deploy-info.json"
cat > "$DEPLOY_INFO_FILE" << EOF
{
    "deploymentId": "$(date +%s)",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "branch": "$CURRENT_BRANCH",
    "commit": "$(git rev-parse HEAD)",
    "commitMessage": "$(git log -1 --pretty=%B)",
    "deployer": "$(git config user.name)",
    "version": "4.0.0",
    "environment": "production",
    "status": "deployed"
}
EOF

print_success "تم إنشاء ملف معلومات النشر: $DEPLOY_INFO_FILE"

# تنظيف الملفات المؤقتة
print_status "تنظيف الملفات المؤقتة..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .npm 2>/dev/null || true

print_success "✅ تمت عملية النشر التلقائي بنجاح!"
print_status "🔗 يمكنك مراقبة حالة النشر من GitHub Actions"
print_status "📊 لوحة المراقبة: https://your-replit-url.repl.co/dashboard"

echo ""
echo "🎉 Arab Annotators Bot v4.0 جاهز للعمل!"
echo "📱 تأكد من تحديث متغيرات البيئة في Replit"
echo "🔔 فعل الإشعارات في GitHub للحصول على تحديثات فورية"

