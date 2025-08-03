const { searchEngine, stateManager } = require("./enhanced_bot_v4");

async function runSearchTest() {
    console.log("بدء اختبار وظائف البحث...");

    // اختبار البحث بكلمة مفتاحية
    console.log("\n--- اختبار البحث بكلمة مفتاحية: Arabic AI ---");
    let results = await searchEngine.searchByKeyword("Arabic AI", "test_user_1");
    console.log(`تم العثور على ${results.length} نتيجة.`);
    results.slice(0, 5).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} (${job.source}) - Score: ${job.matchScore}, Quality: ${job.qualityScore}`);
    });

    // اختبار البحث حسب المنطقة
    console.log("\n--- اختبار البحث حسب المنطقة: Egypt ---");
    results = await searchEngine.searchByRegion("egypt", "test_user_2");
    console.log(`تم العثور على ${results.length} نتيجة.`);
    results.slice(0, 5).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} (${job.source}) - Score: ${job.matchScore}, Quality: ${job.qualityScore}`);
    });

    // اختبار البحث المخصص (كلمة مفتاحية ومنطقة)
    console.log("\n--- اختبار البحث المخصص: Data Annotation في السعودية ---");
    results = await searchEngine.customSearch({ keyword: "Data Annotation", region: "saudi" }, "test_user_3");
    console.log(`تم العثور على ${results.length} نتيجة.`);
    results.slice(0, 5).forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} (${job.source}) - Score: ${job.matchScore}, Quality: ${job.qualityScore}`);
    });

    console.log("\n--- إحصائيات البحث بعد الاختبار ---");
    console.log("إجمالي عمليات البحث:", stateManager.analytics.totalSearches);
    console.log("عمليات البحث الناجحة:", stateManager.analytics.successfulSearches);
    console.log("متوسط وقت الاستجابة:", stateManager.analytics.averageResponseTime.toFixed(2), "ms");
    console.log("أكثر الكلمات المفتاحية شيوعاً:", Array.from(stateManager.analytics.topKeywords.entries()).sort((a, b) => b[1] - a[1]));
    console.log("مشاركة المستخدمين:", Array.from(stateManager.analytics.userEngagement.entries()));

    console.log("انتهى اختبار وظائف البحث.");
}

runSearchTest();


