const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("cron");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

// ===== إعدادات البوت المتقدمة =====
console.log("🚀 بدء تشغيل Arab Annotators Bot v4.0 - النسخة المتطورة...");

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
        interval: 1000,
        autoStart: true,
        params: {
            timeout: 10
        }
    }
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// إعداد خادم Express للصحة
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🌐 خادم الصحة يعمل على المنفذ ${PORT}`);
});

// ===== نظام إدارة الحالة المتقدم =====
class AdvancedStateManager {
    constructor() {
        this.userStates = new Map();
        this.config = this.loadConfig();
        this.keywords = this.loadAdvancedKeywords();
        this.regions = this.loadRegions();
        this.jobCache = new Map();
        this.searchHistory = new Map();
        this.analytics = {
            totalSearches: 0,
            successfulSearches: 0,
            failedSearches: 0,
            averageResponseTime: 0,
            topKeywords: new Map(),
            userEngagement: new Map()
        };
    }

    loadConfig() {
        try {
            return JSON.parse(fs.readFileSync("./config.json", "utf8"));
        } catch (error) {
            console.error("خطأ في قراءة ملف التكوين:", error);
            return { jobSources: {} };
        }
    }

    loadAdvancedKeywords() {
        return {
            // كلمات مفتاحية عربية متقدمة
            arabic: [
                "مطلوب لغة عربية", "Arabic Language", "Arabic Annotator", "مُعلق بيانات عربي",
                "الشرق الأوسط", "AI Training Arabic", "Voice Actor Arabic", "ممثل صوت عربي",
                "Transcription Arabic", "تفريغ صوت", "Voice Over Arabic", "تعليق صوتي عربي",
                "Data Collection Arabic", "تدريب الذكاء الاصطناعي للغة العربية",
                "Arabic NLP", "Arabic AI", "Middle East", "Arabic Speaker", "متحدث عربي",
                "Arabic Data", "Arabic Content", "Arabic Translation", "ترجمة عربية",
                "محتوى عربي", "مراجعة نصوص", "تدقيق لغوي", "كاتب محتوى عربي"
            ],
            // كلمات تقنية متخصصة
            technical: [
                "Machine Learning", "تعلم الآلة", "Deep Learning", "التعلم العميق",
                "Natural Language Processing", "معالجة اللغة الطبيعية", "Computer Vision", "رؤية الحاسوب",
                "Data Science", "علم البيانات", "Big Data", "البيانات الضخمة",
                "Neural Networks", "الشبكات العصبية", "Algorithm", "خوارزمية",
                "Python", "TensorFlow", "PyTorch", "Keras", "Scikit-learn"
            ],
            // أنواع الوظائف
            jobTypes: [
                "Remote", "عن بُعد", "Freelance", "عمل حر", "Part-time", "دوام جزئي",
                "Full-time", "دوام كامل", "Contract", "عقد", "Internship", "تدريب",
                "Entry Level", "مستوى مبتدئ", "Senior", "كبير", "Lead", "قائد فريق"
            ],
            // مهارات مطلوبة
            skills: [
                "Annotation", "تعليق", "Labeling", "تصنيف", "Tagging", "وسم",
                "Quality Assurance", "ضمان الجودة", "Data Entry", "إدخال البيانات",
                "Content Moderation", "إشراف المحتوى", "Proofreading", "تدقيق",
                "Linguistics", "لسانيات", "Phonetics", "صوتيات"
            ]
        };
    }

    loadRegions() {
        return [
            { 
                name: "مصر", code: "egypt", flag: "🇪🇬", 
                keywords: ["Egypt", "Cairo", "مصر", "القاهرة", "الإسكندرية", "الجيزة"],
                timezone: "Africa/Cairo",
                currency: "EGP"
            },
            { 
                name: "السعودية", code: "saudi", flag: "🇸🇦", 
                keywords: ["Saudi", "Riyadh", "السعودية", "الرياض", "جدة", "الدمام"],
                timezone: "Asia/Riyadh",
                currency: "SAR"
            },
            { 
                name: "الإمارات", code: "uae", flag: "🇦🇪", 
                keywords: ["UAE", "Dubai", "الإمارات", "دبي", "أبوظبي", "الشارقة"],
                timezone: "Asia/Dubai",
                currency: "AED"
            },
            { 
                name: "المغرب", code: "morocco", flag: "🇲🇦", 
                keywords: ["Morocco", "Casablanca", "المغرب", "الدار البيضاء", "الرباط"],
                timezone: "Africa/Casablanca",
                currency: "MAD"
            },
            { 
                name: "الأردن", code: "jordan", flag: "🇯🇴", 
                keywords: ["Jordan", "Amman", "الأردن", "عمان", "إربد"],
                timezone: "Asia/Amman",
                currency: "JOD"
            },
            { 
                name: "لبنان", code: "lebanon", flag: "🇱🇧", 
                keywords: ["Lebanon", "Beirut", "لبنان", "بيروت", "طرابلس"],
                timezone: "Asia/Beirut",
                currency: "LBP"
            },
            { 
                name: "الكويت", code: "kuwait", flag: "🇰🇼", 
                keywords: ["Kuwait", "الكويت", "مدينة الكويت"],
                timezone: "Asia/Kuwait",
                currency: "KWD"
            },
            { 
                name: "قطر", code: "qatar", flag: "🇶🇦", 
                keywords: ["Qatar", "Doha", "قطر", "الدوحة"],
                timezone: "Asia/Qatar",
                currency: "QAR"
            }
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
                    keywords: [],
                    schedule: '09:00'
                },
                subscription: {
                    type: 'free',
                    expiry: null,
                    features: ['basic_search', 'notifications']
                },
                preferences: {
                    language: 'ar',
                    resultsPerPage: 10,
                    theme: 'default',
                    sortBy: 'relevance'
                },
                analytics: {
                    totalSearches: 0,
                    lastActive: new Date(),
                    favoriteCategories: [],
                    searchPatterns: []
                }
            });
        }
        return this.userStates.get(chatId);
    }

    updateUserState(chatId, updates) {
        const state = this.getUserState(chatId);
        Object.assign(state, updates);
        state.analytics.lastActive = new Date();
        this.userStates.set(chatId, state);
    }

    // حفظ البيانات في Supabase
    async saveUserData(chatId, userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .upsert({
                    chat_id: chatId,
                    user_data: userData,
                    updated_at: new Date()
                });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('خطأ في حفظ بيانات المستخدم:', error);
            return false;
        }
    }

    // استرجاع البيانات من Supabase
    async loadUserData(chatId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('user_data')
                .eq('chat_id', chatId)
                .single();

            if (error) throw error;
            return data?.user_data || null;
        } catch (error) {
            console.error('خطأ في تحميل بيانات المستخدم:', error);
            return null;
        }
    }
}

// ===== محرك البحث المتطور - أفضل من جوجل =====
class SuperiorJobSearchEngine {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.searchCache = new Map();
        this.rateLimiter = new Map();
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
    }

    // البحث الذكي المتطور
    async intelligentSearch(filters = {}, userId = null) {
        const startTime = Date.now();
        const searchId = this.generateSearchId();

        console.log(`🔍 [${searchId}] بدء البحث الذكي المتطور...`);

        try {
            // فحص الكاش أولاً
            const cacheKey = this.generateCacheKey(filters);
            if (this.searchCache.has(cacheKey)) {
                const cached = this.searchCache.get(cacheKey);
                if (Date.now() - cached.timestamp < 300000) { // 5 دقائق
                    console.log(`💾 [${searchId}] استخدام النتائج المحفوظة`);
                    return cached.results;
                }
            }

            // البحث المتوازي في جميع المصادر
            const searchPromises = [];

            // البحث في المصادر التقليدية
            Object.entries(this.stateManager.config.jobSources).forEach(([category, sites]) => {
                sites.forEach(site => {
                    searchPromises.push(
                        this.advancedSiteSearch(site, category, filters, searchId)
                    );
                });
            });

            // البحث في مصادر إضافية متقدمة
            searchPromises.push(
                this.searchLinkedInJobs(filters, searchId),
                this.searchIndeedJobs(filters, searchId),
                this.searchGlassdoorJobs(filters, searchId),
                this.searchRemoteOkJobs(filters, searchId),
                this.searchAngelListJobs(filters, searchId)
            );

            // انتظار جميع النتائج
            const allResults = await Promise.allSettled(searchPromises);

            // جمع وتنظيف النتائج
            let combinedResults = [];
            allResults.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    combinedResults.push(...result.value);
                }
            });

            // تطبيق الذكاء الاصطناعي للتصفية والترتيب
            const intelligentResults = await this.applyAIFiltering(combinedResults, filters);

            // حفظ في الكاش
            this.searchCache.set(cacheKey, {
                results: intelligentResults,
                timestamp: Date.now()
            });

            // تحديث الإحصائيات
            const responseTime = Date.now() - startTime;
            this.updateSearchAnalytics(true, responseTime, filters, userId);

            console.log(`✅ [${searchId}] البحث اكتمل في ${responseTime}ms - ${intelligentResults.length} نتيجة عالية الجودة`);

            return intelligentResults;

        } catch (error) {
            console.error(`❌ [${searchId}] خطأ في البحث الذكي:`, error);
            this.updateSearchAnalytics(false, Date.now() - startTime, filters, userId);
            return [];
        }
    }

    // البحث المتطور في المواقع
    async advancedSiteSearch(site, category, filters, searchId) {
        try {
            const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];

            const response = await axios.get(site.url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });

            const $ = cheerio.load(response.data);
            const jobs = [];

            // محددات متقدمة لاستخراج الوظائف
            const selectors = this.getAdvancedSelectors(site.name);

            selectors.forEach(selector => {
                $(selector.container).each((i, element) => {
                    const title = this.extractText($, element, selector.title);
                    const link = this.extractLink($, element, selector.link, site.url);
                    const company = this.extractText($, element, selector.company);
                    const location = this.extractText($, element, selector.location);
                    const salary = this.extractText($, element, selector.salary);
                    const description = this.extractText($, element, selector.description);

                    if (this.isHighQualityJob(title, link, company, filters)) {
                        const job = {
                            title: title,
                            url: link,
                            company: company || site.name,
                            location: location,
                            salary: salary,
                            description: description,
                            source: site.name,
                            category: category,
                            matchScore: this.calculateAdvancedMatchScore(title, description, company, filters),
                            qualityScore: this.calculateQualityScore(title, description, company, salary),
                            dateFound: new Date().toISOString(),
                            searchId: searchId
                        };

                        jobs.push(job);
                    }
                });
            });

            console.log(`📊 [${searchId}] ${site.name}: ${jobs.length} وظائف عالية الجودة`);
            return jobs.slice(0, 10); // أفضل 10 نتائج لكل موقع

        } catch (error) {
            console.error(`❌ [${searchId}] خطأ في البحث في ${site.name}:`, error.message);
            return [];
        }
    }

    // محددات متقدمة لكل موقع
    getAdvancedSelectors(siteName) {
        const selectors = {
            'LinkedIn Jobs': [
                {
                    container: '.job-search-card, .jobs-search__results-list li',
                    title: '.job-search-card__title a, h3 a',
                    link: '.job-search-card__title a, h3 a',
                    company: '.job-search-card__subtitle-primary-grouping strong, .job-search-card__subtitle',
                    location: '.job-search-card__subtitle-secondary-grouping, .job-search-card__location',
                    description: '.job-search-card__snippet'
                }
            ],
            'Upwork': [
                {
                    container: '[data-test="JobTile"], .job-tile',
                    title: '[data-test="JobTileTitle"] a, .job-tile-title a',
                    link: '[data-test="JobTileTitle"] a, .job-tile-title a',
                    company: '[data-test="ClientInfo"], .client-info',
                    description: '[data-test="JobDescription"], .job-tile-description'
                }
            ],
            'Indeed': [
                {
                    container: '.jobsearch-SerpJobCard, [data-testid="job-result"]',
                    title: '.jobTitle a, [data-testid="job-title"] a',
                    link: '.jobTitle a, [data-testid="job-title"] a',
                    company: '.companyName, [data-testid="company-name"]',
                    location: '.companyLocation, [data-testid="job-location"]',
                    salary: '.salary-snippet, [data-testid="salary-snippet"]',
                    description: '.summary, [data-testid="job-snippet"]'
                }
            ]
        };

        return selectors[siteName] || [
            {
                container: 'article, .job, .position, .listing',
                title: 'h1, h2, h3, .title, .job-title',
                link: 'h1 a, h2 a, h3 a, .title a, .job-title a',
                company: '.company, .employer, .organization',
                location: '.location, .city, .country',
                description: '.description, .summary, .excerpt, p'
            }
        ];
    }

    // استخراج النص بذكاء
    extractText($, element, selector) {
        if (!selector) return '';
        const found = $(element).find(selector).first();
        return found.length ? found.text().trim() : '';
    }

    // استخراج الرابط بذكاء
    extractLink($, element, selector, baseUrl) {
        if (!selector) return '';
        const found = $(element).find(selector).first();
        const href = found.attr('href');
        if (!href) return '';

        return href.startsWith('http') ? href : new URL(href, baseUrl).toString();
    }

    // فحص جودة الوظيفة
    isHighQualityJob(title, link, company, filters) {
        if (!title || !link || title.length < 10) return false;

        const titleLower = title.toLowerCase();

        // فحص الكلمات المفتاحية المتقدم
        const hasRelevantKeywords = this.checkAdvancedKeywords(titleLower, filters);

        // فحص جودة العنوان
        const hasQualityIndicators = this.checkQualityIndicators(title, company);

        // فحص عدم وجود كلمات مرفوضة
        const hasNoSpamWords = this.checkNoSpamWords(titleLower);

        return hasRelevantKeywords && hasQualityIndicators && hasNoSpamWords;
    }

    // فحص الكلمات المفتاحية المتقدم
    checkAdvancedKeywords(titleLower, filters) {
        const allKeywords = [
            ...this.stateManager.keywords.arabic,
            ...this.stateManager.keywords.technical,
            ...this.stateManager.keywords.jobTypes,
            ...this.stateManager.keywords.skills
        ];

        let keywordScore = 0;
        allKeywords.forEach(keyword => {
            if (titleLower.includes(keyword.toLowerCase())) {
                keywordScore += this.getKeywordWeight(keyword);
            }
        });

        // فحص المرشحات المحددة
        if (filters.keyword) {
            if (titleLower.includes(filters.keyword.toLowerCase())) {
                keywordScore += 20;
            }
        }

        if (filters.region) {
            const region = this.stateManager.regions.find(r => r.code === filters.region);
            if (region) {
                region.keywords.forEach(regionKeyword => {
                    if (titleLower.includes(regionKeyword.toLowerCase())) {
                        keywordScore += 15;
                    }
                });
            }
        }

        return keywordScore >= 10; // الحد الأدنى للقبول
    }

    // وزن الكلمات المفتاحية
    getKeywordWeight(keyword) {
        const weights = {
            'arabic': 25, 'عربي': 25, 'عربية': 25,
            'ai': 20, 'artificial intelligence': 20, 'ذكاء اصطناعي': 20,
            'machine learning': 18, 'تعلم الآلة': 18,
            'data': 15, 'بيانات': 15,
            'remote': 12, 'عن بُعد': 12,
            'annotation': 15, 'تعليق': 15,
            'transcription': 15, 'تفريغ': 15
        };

        return weights[keyword.toLowerCase()] || 5;
    }

    // فحص مؤشرات الجودة
    checkQualityIndicators(title, company) {
        const qualityIndicators = [
            /\$\d+/,  // راتب محدد
            /\d+\s*(hour|hr|month|year)/i,  // معدل زمني
            /full.?time|part.?time|contract/i,  // نوع العمل
            /senior|lead|manager|director/i,  // مستوى الخبرة
            /remote|work.?from.?home/i  // عمل عن بُعد
        ];

        let qualityScore = 0;
        qualityIndicators.forEach(indicator => {
            if (indicator.test(title)) qualityScore += 5;
        });

        // شركات موثوقة
        if (company) {
            const trustedCompanies = ['google', 'microsoft', 'amazon', 'meta', 'apple', 'openai', 'anthropic'];
            if (trustedCompanies.some(trusted => company.toLowerCase().includes(trusted))) {
                qualityScore += 15;
            }
        }

        return qualityScore >= 5;
    }

    // فحص عدم وجود كلمات سبام
    checkNoSpamWords(titleLower) {
        const spamWords = [
            'make money fast', 'easy money', 'no experience needed',
            'work from home scam', 'pyramid scheme', 'multi level marketing',
            'get rich quick', 'guaranteed income', 'no skills required'
        ];

        return !spamWords.some(spam => titleLower.includes(spam));
    }

    // حساب نقاط التطابق المتقدم
    calculateAdvancedMatchScore(title, description, company, filters) {
        let score = 0;
        const text = `${title} ${description} ${company}`.toLowerCase();

        // نقاط الكلمات المفتاحية
        Object.values(this.stateManager.keywords).flat().forEach(keyword => {
            if (text.includes(keyword.toLowerCase())) {
                score += this.getKeywordWeight(keyword);
            }
        });

        // نقاط المرشحات
        if (filters.keyword && text.includes(filters.keyword.toLowerCase())) {
            score += 30;
        }

        if (filters.region) {
            const region = this.stateManager.regions.find(r => r.code === filters.region);
            if (region) {
                region.keywords.forEach(regionKeyword => {
                    if (text.includes(regionKeyword.toLowerCase())) {
                        score += 20;
                    }
                });
            }
        }

        // نقاط إضافية للجودة
        if (title.length > 20 && title.length < 100) score += 5;
        if (description && description.length > 50) score += 5;
        if (company && company.length > 3) score += 5;

        return Math.min(score, 100); // الحد الأقصى 100
    }

    // حساب نقاط الجودة
    calculateQualityScore(title, description, company, salary) {
        let score = 0;

        // جودة العنوان
        if (title && title.length >= 10 && title.length <= 100) score += 20;
        if (title && !/[!@#$%^&*()_+={}\[\]|\\:";'<>?,./]/.test(title)) score += 10;

        // جودة الوصف
        if (description && description.length >= 50) score += 15;
        if (description && description.length >= 200) score += 10;

        // وجود الشركة
        if (company && company.length >= 3) score += 15;

        // وجود الراتب
        if (salary && salary.trim().length > 0) score += 20;

        // مؤشرات احترافية
        const professionalWords = ['experience', 'skills', 'requirements', 'benefits', 'خبرة', 'مهارات', 'متطلبات', 'مزايا'];
        professionalWords.forEach(word => {
            if (description && description.toLowerCase().includes(word)) score += 2;
        });

        return Math.min(score, 100);
    }

    // تطبيق الذكاء الاصطناعي للتصفية
    async applyAIFiltering(results, filters) {
        // إزالة المكررات المتقدمة
        const uniqueResults = this.removeDuplicatesAdvanced(results);

        // ترتيب بالذكاء الاصطناعي
        const sortedResults = this.aiSort(uniqueResults, filters);

        // تطبيق مرشحات الجودة
        const qualityFiltered = sortedResults.filter(job => job.qualityScore >= 30);

        // تحديد التنوع
        const diverseResults = this.ensureDiversity(qualityFiltered);

        return diverseResults.slice(0, 50); // أفضل 50 نتيجة
    }

    // إزالة المكررات المتقدمة
    removeDuplicatesAdvanced(results) {
        const seen = new Set();
        return results.filter(job => {
            const signature = this.generateJobSignature(job);
            if (seen.has(signature)) return false;
            seen.add(signature);
            return true;
        });
    }

    // توليد بصمة الوظيفة
    generateJobSignature(job) {
        const title = job.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const company = (job.company || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${title}-${company}`;
    }

    // ترتيب بالذكاء الاصطناعي
    aiSort(results, filters) {
        return results.sort((a, b) => {
            // الوزن المركب
            const scoreA = (a.matchScore * 0.4) + (a.qualityScore * 0.3) + (this.getRecencyScore(a) * 0.2) + (this.getPopularityScore(a) * 0.1);
            const scoreB = (b.matchScore * 0.4) + (b.qualityScore * 0.3) + (this.getRecencyScore(b) * 0.2) + (this.getPopularityScore(b) * 0.1);

            return scoreB - scoreA;
        });
    }

    // نقاط الحداثة
    getRecencyScore(job) {
        const now = new Date();
        const jobDate = new Date(job.dateFound);
        const hoursDiff = (now - jobDate) / (1000 * 60 * 60);

        if (hoursDiff < 1) return 100;
        if (hoursDiff < 24) return 80;
        if (hoursDiff < 168) return 60; // أسبوع
        return 40;
    }

    // نقاط الشعبية
    getPopularityScore(job) {
        const popularSources = ['linkedin', 'indeed', 'glassdoor', 'google'];
        const sourceLower = job.source.toLowerCase();

        if (popularSources.some(source => sourceLower.includes(source))) return 80;
        return 50;
    }

    // ضمان التنوع
    ensureDiversity(results) {
        const diverse = [];
        const categoryCounts = {};
        const sourceCounts = {};

        results.forEach(job => {
            const category = job.category || 'other';
            const source = job.source || 'unknown';

            categoryCounts[category] = (categoryCounts[category] || 0);
            sourceCounts[source] = (sourceCounts[source] || 0);

            // حد أقصى 10 وظائف لكل فئة و 5 لكل مصدر
            if (categoryCounts[category] < 10 && sourceCounts[source] < 5) {
                diverse.push(job);
                categoryCounts[category]++;
                sourceCounts[source]++;
            }
        });

        return diverse;
    }

    // البحث في LinkedIn
    async searchLinkedInJobs(filters, searchId) {
        try {
            const query = this.buildLinkedInQuery(filters);
            const url = `https://www.linkedin.com/jobs/search/?${query}`;

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': this.userAgents[0],
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            const $ = cheerio.load(response.data);
            const jobs = [];

            $('.job-search-card').each((i, element) => {
                const title = $(element).find('.job-search-card__title a').text().trim();
                const link = $(element).find('.job-search-card__title a').attr('href');
                const company = $(element).find('.job-search-card__subtitle-primary-grouping').text().trim();
                const location = $(element).find('.job-search-card__subtitle-secondary-grouping').text().trim();

                if (this.isHighQualityJob(title, link, company, filters)) {
                    jobs.push({
                        title,
                        url: link?.startsWith('http') ? link : `https://www.linkedin.com${link}`,
                        company,
                        location,
                        source: 'LinkedIn',
                        category: 'professional',
                        matchScore: this.calculateAdvancedMatchScore(title, '', company, filters),
                        qualityScore: this.calculateQualityScore(title, '', company, ''),
                        dateFound: new Date().toISOString(),
                        searchId
                    });
                }
            });

            return jobs.slice(0, 15);
        } catch (error) {
            console.error(`❌ [${searchId}] خطأ في البحث في LinkedIn:`, error.message);
            return [];
        }
    }

    // بناء استعلام LinkedIn
    buildLinkedInQuery(filters) {
        const params = new URLSearchParams();

        let keywords = 'Arabic AI data annotation';
        if (filters.keyword) keywords += ` ${filters.keyword}`;

        params.append('keywords', keywords);
        params.append('location', 'Worldwide');
        params.append('f_TPR', 'r86400'); // آخر 24 ساعة
        params.append('f_WT', '2'); // عمل عن بُعد

        return params.toString();
    }

    // البحث في Indeed
    async searchIndeedJobs(filters, searchId) {
        try {
            const query = this.buildIndeedQuery(filters);
            const url = `https://www.indeed.com/jobs?${query}`;

            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': this.userAgents[1]
                }
            });

            const $ = cheerio.load(response.data);
            const jobs = [];

            $('[data-testid="job-result"]').each((i, element) => {
                const title = $(element).find('[data-testid="job-title"] a').text().trim();
                const link = $(element).find('[data-testid="job-title"] a').attr('href');
                const company = $(element).find('[data-testid="company-name"]').text().trim();
                const location = $(element).find('[data-testid="job-location"]').text().trim();
                const salary = $(element).find('[data-testid="salary-snippet"]').text().trim();

                if (this.isHighQualityJob(title, link, company, filters)) {
                    jobs.push({
                        title,
                        url: link?.startsWith('http') ? link : `https://www.indeed.com${link}`,
                        company,
                        location,
                        salary,
                        source: 'Indeed',
                        category: 'general',
                        matchScore: this.calculateAdvancedMatchScore(title, '', company, filters),
                        qualityScore: this.calculateQualityScore(title, '', company, salary),
                        dateFound: new Date().toISOString(),
                        searchId
                    });
                }
            });

            return jobs.slice(0, 15);
        } catch (error) {
            console.error(`❌ [${searchId}] خطأ في البحث في Indeed:`, error.message);            return [];
        }
    }

    // بناء استعلام Indeed
    buildIndeedQuery(filters) {
        const params = new URLSearchParams();

        let query = 'Arabic AI data annotation machine learning';
        if (filters.keyword) query += ` ${filters.keyword}`;

        params.append('q', query);
        params.append('l', 'Remote');
        params.append('fromage', '1'); // آخر يوم
        params.append('sort', 'date');

        return params.toString();
    }

    // البحث في Glassdoor
    async searchGlassdoorJobs(filters, searchId) {
        // تنفيذ مشابه للمواقع الأخرى
    const url = 'https://www.glassdoor.com/Job/index.htm';
        return [];
    }

    // البحث في Remote OK
    async searchRemoteOkJobs(filters, searchId) {
        try {
            const url = 'https://remoteok.io/remote-dev-jobs';

            const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            maxRedirects: 5,
            validateStatus: (status) => status < 500
        });

            const $ = cheerio.load(response.data);
            const jobs = [];

            $('.job').each((i, element) => {
                const title = $(element).find('.company_and_position h2').text().trim();
                const link = $(element).find('a').attr('href');
                const company = $(element).find('.company h3').text().trim();
                const tags = $(element).find('.tags .tag').map((i, el) => $(el).text()).get().join(' ');

                if (this.isHighQualityJob(title, link, company, filters)) {
                    jobs.push({
                        title,
                        url: link?.startsWith('http') ? link : `https://remoteok.io${link}`,
                        company,
                        description: tags,
                        source: 'Remote OK',
                        category: 'remote',
                        matchScore: this.calculateAdvancedMatchScore(title, tags, company, filters),
                        qualityScore: this.calculateQualityScore(title, tags, company, ''),
                        dateFound: new Date().toISOString(),
                        searchId
                    });
                }
            });

            return jobs.slice(0, 10);
        } catch (error) {
            console.error(`❌ [${searchId}] خطأ في البحث في Remote OK:`, error.message);
            return [];
        }
    }

    // البحث في AngelList
    async searchAngelListJobs(filters, searchId) {
        // تنفيذ مشابه
        return [];
    }

    // توليد معرف البحث
    generateSearchId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // توليد مفتاح الكاش
    generateCacheKey(filters) {
        return JSON.stringify(filters);
    }

    // تحديث إحصائيات البحث
    updateSearchAnalytics(success, responseTime, filters, userId) {
        this.stateManager.analytics.totalSearches++;

        if (success) {
            this.stateManager.analytics.successfulSearches++;
        } else {
            this.stateManager.analytics.failedSearches++;
        }

        // تحديث متوسط وقت الاستجابة
        const currentAvg = this.stateManager.analytics.averageResponseTime;
        const totalSearches = this.stateManager.analytics.totalSearches;
        this.stateManager.analytics.averageResponseTime = 
            ((currentAvg * (totalSearches - 1)) + responseTime) / totalSearches;

        // تتبع الكلمات المفتاحية الشائعة
        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            const count = this.stateManager.analytics.topKeywords.get(keyword) || 0;
            this.stateManager.analytics.topKeywords.set(keyword, count + 1);
        }

        // تتبع مشاركة المستخدمين
        if (userId) {
            const engagement = this.stateManager.analytics.userEngagement.get(userId) || 0;
            this.stateManager.analytics.userEngagement.set(userId, engagement + 1);
        }
    }

    // البحث حسب المنطقة
    async searchByRegion(regionCode, userId = null) {
        const region = this.stateManager.regions.find(r => r.code === regionCode);
        if (!region) return [];

        return await this.intelligentSearch({ region: regionCode }, userId);
    }

    // البحث بالكلمة المفتاحية
    async searchByKeyword(keyword, userId = null) {
        return await this.intelligentSearch({ keyword: keyword }, userId);
    }

    // البحث المخصص
    async customSearch(params, userId = null) {
        return await this.intelligentSearch(params, userId);
    }
}

// تهيئة النظام
const stateManager = new AdvancedStateManager();
const searchEngine = new SuperiorJobSearchEngine(stateManager);

console.log("✅ Arab Annotators Bot v4.0 جاهز للعمل!");

module.exports = {
    bot,
    stateManager,
    searchEngine,
    supabase
};