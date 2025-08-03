// ===== نظام القوائم والواجهات المتقدم =====
class AdvancedMenuManager {
    static getMainMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🚀 البحث الذكي المتطور", callback_data: "intelligent_search" },
                        { text: "🎯 البحث المخصص", callback_data: "custom_search" }
                    ],
                    [
                        { text: "🌍 البحث حسب المنطقة", callback_data: "region_search" },
                        { text: "🏢 البحث حسب الشركة", callback_data: "company_search" }
                    ],
                    [
                        { text: "🤖 وظائف الذكاء الاصطناعي", callback_data: "ai_jobs" },
                        { text: "📊 تصنيف البيانات", callback_data: "data_jobs" }
                    ],
                    [
                        { text: "🎙️ الوظائف الصوتية", callback_data: "voice_jobs" },
                        { text: "✍️ الكتابة والترجمة", callback_data: "writing_jobs" }
                    ],
                    [
                        { text: "⭐ المفضلة", callback_data: "favorites" },
                        { text: "📈 الإحصائيات المتقدمة", callback_data: "advanced_stats" }
                    ],
                    [
                        { text: "🔔 الإشعارات الذكية", callback_data: "smart_notifications" },
                        { text: "👤 الملف الشخصي", callback_data: "profile" }
                    ],
                    [
                        { text: "⚙️ الإعدادات المتقدمة", callback_data: "advanced_settings" },
                        { text: "💎 الاشتراك المميز", callback_data: "premium_subscription" }
                    ],
                    [
                        { text: "🆘 المساعدة والدعم", callback_data: "help_support" },
                        { text: "📊 تقرير الأداء", callback_data: "performance_report" }
                    ]
                ]
            }
        };
    }

    static getIntelligentSearchMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔍 بحث شامل في جميع المصادر", callback_data: "search_all_sources" }
                    ],
                    [
                        { text: "🎯 بحث متخصص في الذكاء الاصطناعي", callback_data: "search_ai_specialized" },
                        { text: "📊 بحث في تصنيف البيانات", callback_data: "search_data_annotation" }
                    ],
                    [
                        { text: "🌐 بحث في الوظائف العالمية", callback_data: "search_global" },
                        { text: "🏠 بحث في العمل عن بُعد", callback_data: "search_remote" }
                    ],
                    [
                        { text: "💰 بحث حسب الراتب", callback_data: "search_by_salary" },
                        { text: "⏰ بحث حسب نوع العمل", callback_data: "search_by_type" }
                    ],
                    [
                        { text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getCustomSearchMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎯 بحث بكلمة مفتاحية", callback_data: "search_by_keyword" }
                    ],
                    [
                        { text: "🏢 بحث بالشركة", callback_data: "search_by_company" },
                        { text: "📍 بحث بالموقع", callback_data: "search_by_location" }
                    ],
                    [
                        { text: "💼 بحث بمستوى الخبرة", callback_data: "search_by_experience" },
                        { text: "🎓 بحث بالمؤهل", callback_data: "search_by_qualification" }
                    ],
                    [
                        { text: "⚡ بحث سريع", callback_data: "quick_search" },
                        { text: "🔬 بحث متقدم", callback_data: "advanced_search_form" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getRegionMenu(regions) {
        const buttons = [];
        
        // ترتيب المناطق حسب الشعبية
        const sortedRegions = regions.sort((a, b) => {
            const popularity = {
                'uae': 8, 'saudi': 7, 'egypt': 6, 'qatar': 5,
                'kuwait': 4, 'jordan': 3, 'lebanon': 2, 'morocco': 1
            };
            return (popularity[b.code] || 0) - (popularity[a.code] || 0);
        });

        for (let i = 0; i < sortedRegions.length; i += 2) {
            const row = [];
            row.push({
                text: `${sortedRegions[i].flag} ${sortedRegions[i].name}`,
                callback_data: `region_${sortedRegions[i].code}`
            });
            if (i + 1 < sortedRegions.length) {
                row.push({
                    text: `${sortedRegions[i + 1].flag} ${sortedRegions[i + 1].name}`,
                    callback_data: `region_${sortedRegions[i + 1].code}`
                });
            }
            buttons.push(row);
        }

        buttons.push([
            { text: "🌍 جميع المناطق", callback_data: "region_all" },
            { text: "🔙 العودة", callback_data: "main_menu" }
        ]);

        return { reply_markup: { inline_keyboard: buttons } };
    }

    static getAdvancedStatsMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📊 إحصائيات البحث", callback_data: "search_statistics" },
                        { text: "📈 تحليل الاتجاهات", callback_data: "trend_analysis" }
                    ],
                    [
                        { text: "🏆 أفضل الوظائف", callback_data: "top_jobs" },
                        { text: "🔥 الأكثر طلباً", callback_data: "most_demanded" }
                    ],
                    [
                        { text: "💰 تحليل الرواتب", callback_data: "salary_analysis" },
                        { text: "🌍 توزيع جغرافي", callback_data: "geographic_distribution" }
                    ],
                    [
                        { text: "📅 تقرير أسبوعي", callback_data: "weekly_report" },
                        { text: "📆 تقرير شهري", callback_data: "monthly_report" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getSmartNotificationsMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔔 تفعيل الإشعارات", callback_data: "enable_notifications" },
                        { text: "🔕 إيقاف الإشعارات", callback_data: "disable_notifications" }
                    ],
                    [
                        { text: "⏰ جدولة الإشعارات", callback_data: "schedule_notifications" },
                        { text: "🎯 إشعارات مخصصة", callback_data: "custom_notifications" }
                    ],
                    [
                        { text: "📱 إشعارات فورية", callback_data: "instant_notifications" },
                        { text: "📧 إشعارات يومية", callback_data: "daily_notifications" }
                    ],
                    [
                        { text: "🔍 إشعارات البحث", callback_data: "search_notifications" },
                        { text: "⭐ إشعارات المفضلة", callback_data: "favorite_notifications" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getAdvancedSettingsMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🌐 تغيير اللغة", callback_data: "change_language" },
                        { text: "🎨 تغيير المظهر", callback_data: "change_theme" }
                    ],
                    [
                        { text: "📊 عدد النتائج", callback_data: "results_per_page" },
                        { text: "🔄 ترتيب النتائج", callback_data: "sort_results" }
                    ],
                    [
                        { text: "🔍 مرشحات البحث", callback_data: "search_filters" },
                        { text: "💾 إعدادات الحفظ", callback_data: "save_settings" }
                    ],
                    [
                        { text: "🔐 الخصوصية", callback_data: "privacy_settings" },
                        { text: "📈 تتبع الأداء", callback_data: "performance_tracking" }
                    ],
                    [
                        { text: "🔄 إعادة تعيين", callback_data: "reset_settings" },
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getPremiumSubscriptionMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💎 الاشتراك المميز", callback_data: "premium_features" }
                    ],
                    [
                        { text: "🚀 الخطة الأساسية - $9.99/شهر", callback_data: "basic_plan" }
                    ],
                    [
                        { text: "⭐ الخطة المتقدمة - $19.99/شهر", callback_data: "advanced_plan" }
                    ],
                    [
                        { text: "👑 الخطة الاحترافية - $39.99/شهر", callback_data: "professional_plan" }
                    ],
                    [
                        { text: "🎁 تجربة مجانية 7 أيام", callback_data: "free_trial" }
                    ],
                    [
                        { text: "💳 طرق الدفع", callback_data: "payment_methods" },
                        { text: "📋 مقارنة الخطط", callback_data: "compare_plans" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getHelpSupportMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "📖 دليل الاستخدام", callback_data: "user_guide" },
                        { text: "❓ الأسئلة الشائعة", callback_data: "faq" }
                    ],
                    [
                        { text: "🎥 فيديوهات تعليمية", callback_data: "tutorial_videos" },
                        { text: "📚 قاعدة المعرفة", callback_data: "knowledge_base" }
                    ],
                    [
                        { text: "💬 دردشة مع الدعم", callback_data: "live_chat" },
                        { text: "📧 إرسال تذكرة", callback_data: "submit_ticket" }
                    ],
                    [
                        { text: "🐛 الإبلاغ عن خطأ", callback_data: "report_bug" },
                        { text: "💡 اقتراح ميزة", callback_data: "suggest_feature" }
                    ],
                    [
                        { text: "📞 اتصل بنا", callback_data: "contact_us" },
                        { text: "🔙 العودة", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }

    static getJobActionMenu(jobId) {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "⭐ إضافة للمفضلة", callback_data: `favorite_${jobId}` },
                        { text: "📤 مشاركة", callback_data: `share_${jobId}` }
                    ],
                    [
                        { text: "🔔 تنبيه مشابه", callback_data: `alert_similar_${jobId}` },
                        { text: "📊 تفاصيل أكثر", callback_data: `details_${jobId}` }
                    ],
                    [
                        { text: "🚫 إخفاء", callback_data: `hide_${jobId}` },
                        { text: "📝 تقييم", callback_data: `rate_${jobId}` }
                    ],
                    [
                        { text: "🔙 العودة للنتائج", callback_data: "back_to_results" }
                    ]
                ]
            }
        };
    }

    static getSearchFiltersMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💰 الراتب", callback_data: "filter_salary" },
                        { text: "📍 الموقع", callback_data: "filter_location" }
                    ],
                    [
                        { text: "⏰ نوع العمل", callback_data: "filter_job_type" },
                        { text: "🎓 مستوى الخبرة", callback_data: "filter_experience" }
                    ],
                    [
                        { text: "🏢 حجم الشركة", callback_data: "filter_company_size" },
                        { text: "🏭 القطاع", callback_data: "filter_industry" }
                    ],
                    [
                        { text: "📅 تاريخ النشر", callback_data: "filter_date_posted" },
                        { text: "🔤 اللغة المطلوبة", callback_data: "filter_language" }
                    ],
                    [
                        { text: "🔄 إعادة تعيين المرشحات", callback_data: "reset_filters" },
                        { text: "✅ تطبيق المرشحات", callback_data: "apply_filters" }
                    ],
                    [
                        { text: "🔙 العودة", callback_data: "advanced_settings" }
                    ]
                ]
            }
        };
    }

    static getPaginationMenu(currentPage, totalPages, baseCallback) {
        const buttons = [];
        
        // أزرار التنقل
        const navRow = [];
        if (currentPage > 1) {
            navRow.push({ text: "⬅️ السابق", callback_data: `${baseCallback}_${currentPage - 1}` });
        }
        if (currentPage < totalPages) {
            navRow.push({ text: "➡️ التالي", callback_data: `${baseCallback}_${currentPage + 1}` });
        }
        if (navRow.length > 0) buttons.push(navRow);

        // أرقام الصفحات
        const pageRow = [];
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const text = i === currentPage ? `• ${i} •` : i.toString();
            pageRow.push({ text, callback_data: `${baseCallback}_${i}` });
        }
        if (pageRow.length > 0) buttons.push(pageRow);

        // أزرار إضافية
        buttons.push([
            { text: "🔄 تحديث", callback_data: `${baseCallback}_refresh` },
            { text: "🔙 العودة", callback_data: "main_menu" }
        ]);

        return { reply_markup: { inline_keyboard: buttons } };
    }

    static getLoadingMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "⏳ جاري البحث...", callback_data: "searching" }
                    ],
                    [
                        { text: "🔄 إلغاء", callback_data: "cancel_search" }
                    ]
                ]
            }
        };
    }

    static getErrorMenu() {
        return {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🔄 إعادة المحاولة", callback_data: "retry_search" },
                        { text: "🆘 الإبلاغ عن المشكلة", callback_data: "report_error" }
                    ],
                    [
                        { text: "🔙 القائمة الرئيسية", callback_data: "main_menu" }
                    ]
                ]
            }
        };
    }
}

module.exports = AdvancedMenuManager;

