const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeOutlierAI() {
    const url = 'https://app.outlier.ai/expert/opportunities';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Example: Extract job titles and links
        $('a[href*="/expert/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://app.outlier.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Outlier AI: ${error.message}`);
        return [];
    }
}

async function scrapeAlignerr() {
    const url = 'https://www.alignerr.com/jobs';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Example: Extract job titles and links
        $('a[href*="/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://www.alignerr.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Alignerr: ${error.message}`);
        return [];
    }
}

// Add more scraping/API functions for other sites here

module.exports = {
    scrapeOutlierAI,
    scrapeAlignerr,
    // Export other functions here
};




async function fetchCvatJobs() {
    const url = 'https://www.cvat.ai/api/jobs'; // This is a placeholder, actual API endpoint for jobs might be different or require authentication
    try {
        const response = await axios.get(url);
        // Assuming the API returns a list of jobs directly
        return response.data.results.map(job => ({ title: job.name, link: job.url }));
    } catch (error) {
        console.error(`Error fetching CVAT jobs: ${error.message}`);
        return [];
    }
}

module.exports.fetchCvatJobs = fetchCvatJobs;




async function scrapeDataannotationTech() {
    const url = 'https://www.dataannotation.tech/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Dataannotation.tech doesn't list specific jobs on their main page, it's more of an application portal.
        // This function will just return a link to their application page.
        jobs.push({ title: 'Apply to DataAnnotation', link: url, description: 'Train AI for on-demand work from home.' });
        
        return jobs;
    } catch (error) {
        console.error(`Error scraping Dataannotation Tech: ${error.message}`);
        return [];
    }
}

module.exports.scrapeDataannotationTech = scrapeDataannotationTech;




async function scrapeTuring() {
    const url = 'https://www.turing.com/jobs'; // This might need to be more specific, e.g., for remote jobs
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Example: Look for job listings. This is a generic selector and might need adjustment.
        $('a[href*="/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/jobs/')) {
                jobs.push({ title: jobTitle, link: `https://www.turing.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Turing: ${error.message}`);
        return [];
    }
}

module.exports.scrapeTuring = scrapeTuring;




async function scrapeArgilla() {
    const url = 'https://argilla.io/careers/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Example: Look for job listings. This is a generic selector and might need adjustment.
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://argilla.io${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Argilla: ${error.message}`);
        return [];
    }
}

module.exports.scrapeArgilla = scrapeArgilla;




async function scrapeClickworker() {
    const url = 'https://www.clickworker.com/about-us/career/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $(".job-listing a").each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr("href");
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: jobLink });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Clickworker: ${error.message}`);
        return [];
    }
}

module.exports.scrapeClickworker = scrapeClickworker;




async function scrapeXAI() {
    const url = 'https://x.ai/careers/open-roles';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $("a[href*=\"/jobs/\"]").each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr("href");
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://x.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping X AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeXAI = scrapeXAI;




async function scrapeStellarAI() {
    const url = 'https://www.getstellar.ai/careers';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://www.getstellar.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Stellar AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeStellarAI = scrapeStellarAI;




async function scrapeHivemicro() {
    const url = 'https://hivemicro.com/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Hivemicro is primarily a micro-task platform, not a traditional job board.
        // Automated scraping for specific 'jobs' might be difficult or not applicable.
        // This function will return a general link to their platform.
        jobs.push({ title: 'Hive Micro Platform', link: url, description: 'Earn money through micro jobs.' });
        
        return jobs;
    } catch (error) {
        console.error(`Error scraping Hivemicro: ${error.message}`);
        return [];
    }
}

module.exports.scrapeHivemicro = scrapeHivemicro;




async function scrapeHumanatic() {
    const url = 'https://www.humanatic.com/application-process/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Humanatic is more of a platform for reviewing calls, not a traditional job board.
        // This function will return a general link to their application process.
        jobs.push({ title: 'Humanatic Call Reviewing Application', link: url, description: 'Earn money by reviewing calls.' });
        
        return jobs;
    } catch (error) {
        console.error(`Error scraping Humanatic: ${error.message}`);
        return [];
    }
}

module.exports.scrapeHumanatic = scrapeHumanatic;




async function scrapeWowAI() {
    const url = 'https://wellfound.com/company/wow-ai-1/jobs'; // Using Wellfound as it lists jobs for Wow AI
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        $('div.job-name a').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://wellfound.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Wow AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeWowAI = scrapeWowAI;




async function fetchMturkJobs() {
    // MTurk has an API, but it's for requesters to create HITs, not for workers to browse jobs easily via API.
    // RSS feeds might be available for specific HITs or requesters, but not a general job feed.
    // For now, we'll point to the main worker page.
    const url = 'https://www.mturk.com/worker';
    return [{ title: 'Amazon Mechanical Turk Worker Portal', link: url, description: 'Find and work on HITs.' }];
}

module.exports.fetchMturkJobs = fetchMturkJobs;




async function scrapeLemonAI() {
    const url = 'https://lemon.io/hire/ai-developers/'; // Focusing on AI developer jobs
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $("a[href*=\"/hire/\"]").each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr("href");
            if (jobTitle && jobLink && jobLink.includes("developer")) {
                jobs.push({ title: jobTitle, link: `https://lemon.io${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Lemon AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeLemonAI = scrapeLemonAI;




async function scrapeTelusInternational() {
    const url = 'https://www.telusinternational.ai/cmp/contributor/jobs/applied/36'; // This is a common portal for their AI community jobs
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/cmp/contributor/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.includes('/cmp/contributor/jobs/')) {
                jobs.push({ title: jobTitle, link: `https://www.telusinternational.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Telus International: ${error.message}`);
        return [];
    }
}

module.exports.scrapeTelusInternational = scrapeTelusInternational;




async function scrapeDatature() {
    const url = 'https://datature.com/careers'; // Placeholder, actual careers page might be different
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://datature.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Datature: ${error.message}`);
        return [];
    }
}

module.exports.scrapeDatature = scrapeDatature;




async function scrapeSurgeAI() {
    const url = 'https://www.surgehq.ai/careers#openings';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $(".job-opening-title").each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).closest("a").attr("href"); // Assuming job title is inside an anchor tag or has a parent anchor
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://www.surgehq.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Surge AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeSurgeAI = scrapeSurgeAI;




async function fetchSukiAIJobs() {
    const rssUrl = 'https://www.suki.ai/feed'; // Suki AI RSS feed
    try {
        const response = await axios.get(rssUrl);
        const $ = cheerio.load(response.data, { xmlMode: true });
        const jobs = [];

        $('item').each((i, elem) => {
            const jobTitle = $(elem).find('title').text().trim();
            const jobLink = $(elem).find('link').text().trim();
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: jobLink });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error fetching Suki AI RSS feed: ${error.message}`);
        // Fallback to web scraping if RSS fails or is not comprehensive enough
        return scrapeSukiAIWeb();
    }
}

async function scrapeSukiAIWeb() {
    const url = 'https://www.suki.ai/open-positions/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/open-positions/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/open-positions/')) {
                jobs.push({ title: jobTitle, link: `https://www.suki.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Suki AI web: ${error.message}`);
        return [];
    }
}

module.exports.fetchSukiAIJobs = fetchSukiAIJobs;




async function scrapeCloudFactory() {
    const url = 'https://www.cloudfactory.com/careers';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://www.cloudfactory.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Cloud Factory: ${error.message}`);
        return [];
    }
}

module.exports.scrapeCloudFactory = scrapeCloudFactory;




async function scrapeSparkAI() {
    const url = 'https://www.spark.ai/careers';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://www.spark.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Spark AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeSparkAI = scrapeSparkAI;




async function fetchCohereJobs() {
    const careersUrl = 'https://cohere.com/careers';
    const rssUrl = 'https://blog.cohere.open.ac.uk/feed/'; // Example RSS, might not be for jobs

    try {
        // Try RSS first if available and relevant
        const rssResponse = await axios.get(rssUrl);
        const $rss = cheerio.load(rssResponse.data, { xmlMode: true });
        const jobsFromRss = [];
        $rss('item').each((i, elem) => {
            const title = $rss(elem).find('title').text().trim();
            const link = $rss(elem).find('link').text().trim();
            if (title && link) {
                jobsFromRss.push({ title, link });
            }
        });
        if (jobsFromRss.length > 0) return jobsFromRss;
    } catch (error) {
        console.warn(`Could not fetch Cohere jobs from RSS: ${error.message}. Falling back to web scraping.`);
    }

    // Fallback to web scraping
    try {
        const response = await axios.get(careersUrl);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Look for job links, adjust selector as needed
        $('a[href*="/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://cohere.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Cohere: ${error.message}`);
        return [];
    }
}

module.exports.fetchCohereJobs = fetchCohereJobs;




async function fetchDatadogJobs() {
    const rssUrl = 'https://www.datadoghq.com/feed/'; // Placeholder, actual RSS feed for jobs might be different
    const careersUrl = 'https://careers.datadoghq.com/all-jobs/';

    try {
        // Try RSS first if available and relevant
        const rssResponse = await axios.get(rssUrl);
        const $rss = cheerio.load(rssResponse.data, { xmlMode: true });
        const jobsFromRss = [];
        $rss('item').each((i, elem) => {
            const title = $rss(elem).find('title').text().trim();
            const link = $rss(elem).find('link').text().trim();
            if (title && link) {
                jobsFromRss.push({ title, link });
            }
        });
        if (jobsFromRss.length > 0) return jobsFromRss;
    } catch (error) {
        console.warn(`Could not fetch Datadog jobs from RSS: ${error.message}. Falling back to web scraping.`);
    }

    // Fallback to web scraping
    try {
        const response = await axios.get(careersUrl);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Look for job links, adjust selector as needed
        $('a[href*="/detail/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://careers.datadoghq.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Datadog: ${error.message}`);
        return [];
    }
}

module.exports.fetchDatadogJobs = fetchDatadogJobs;




async function scrapeDatatroniq() {
    const url = 'https://datatroniq.com/en/career';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/en/career/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/en/career/')) {
                jobs.push({ title: jobTitle, link: `https://datatroniq.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Datatroniq: ${error.message}`);
        return [];
    }
}

module.exports.scrapeDatatroniq = scrapeDatatroniq;




async function scrapeHivemind() {
    const url = 'https://jobs.hivemind.capital/jobs';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/jobs/')) {
                jobs.push({ title: jobTitle, link: `https://jobs.hivemind.capital${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Hivemind: ${error.message}`);
        return [];
    }
}

module.exports.scrapeHivemind = scrapeHivemind;




async function scrapeSoulAI() {
    const url = 'https://www.soulhq.ai/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://www.soulhq.ai${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Soul AI: ${error.message}`);
        return [];
    }
}

module.exports.scrapeSoulAI = scrapeSoulAI;




async function fetchImeritJobs() {
    const careersUrl = 'https://imerit.net/careers/';
    const rssUrl = 'https://imerit.net/feed/'; // Example RSS, might not be for jobs

    try {
        // Try RSS first if available and relevant
        const rssResponse = await axios.get(rssUrl);
        const $rss = cheerio.load(rssResponse.data, { xmlMode: true });
        const jobsFromRss = [];
        $rss('item').each((i, elem) => {
            const title = $rss(elem).find('title').text().trim();
            const link = $rss(elem).find('link').text().trim();
            if (title && link) {
                jobsFromRss.push({ title, link });
            }
        });
        if (jobsFromRss.length > 0) return jobsFromRss;
    } catch (error) {
        console.warn(`Could not fetch iMerit jobs from RSS: ${error.message}. Falling back to web scraping.`);
    }

    // Fallback to web scraping
    try {
        const response = await axios.get(careersUrl);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // Look for job links, adjust selector as needed
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://imerit.net${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping iMerit: ${error.message}`);
        return [];
    }
}

module.exports.fetchImeritJobs = fetchImeritJobs;




async function scrapeLabelbox() {
    const url = 'https://labelbox.com/company/careers/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/company/jobs/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink) {
                jobs.push({ title: jobTitle, link: `https://labelbox.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Labelbox: ${error.message}`);
        return [];
    }
}

module.exports.scrapeLabelbox = scrapeLabelbox;




async function scrapeLebalStudio() {
    const url = 'https://humansignal.com/careers/';
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // This is a generic selector and might need adjustment based on the actual HTML structure
        $('a[href*="/careers/"]').each((i, elem) => {
            const jobTitle = $(elem).text().trim();
            const jobLink = $(elem).attr('href');
            if (jobTitle && jobLink && jobLink.startsWith('/careers/')) {
                jobs.push({ title: jobTitle, link: `https://humansignal.com${jobLink}` });
            }
        });
        return jobs;
    } catch (error) {
        console.error(`Error scraping Lebal Studio: ${error.message}`);
        return [];
    }
}

module.exports.scrapeLebalStudio = scrapeLebalStudio;




function filterJobsByKeywords(jobs) {
    const keywords = ["arabic", "arab", "middle east", "mena", "uae", "saudi", "egypt", "qatar", "kuwait", "bahrain", "oman", "jordan", "lebanon", "syria", "iraq", "yemen", "palestine", "sudan", "libya", "tunisia", "algeria", "morocco", "mauritania", "somalia", "djibouti", "comoros"];
    const filteredJobs = [];

    for (const job of jobs) {
        const title = job.title ? job.title.toLowerCase() : "";
        const description = job.description ? job.description.toLowerCase() : "";

        for (const keyword of keywords) {
            if (title.includes(keyword) || description.includes(keyword)) {
                filteredJobs.push(job);
                break; // Move to the next job once a keyword is found
            }
        }
    }
    return filteredJobs;
}

module.exports.filterJobsByKeywords = filterJobsByKeywords;


const axios = require('axios');
const cheerio = require('cheerio');

// User Agent للتجنب حجب الطلبات
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// إعدادات Axios
const axiosConfig = {
    timeout: 10000,
    headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }
};

// دالة البحث العامة في موقع
async function searchInSite(url, keywords = []) {
    try {
        const response = await axios.get(url, axiosConfig);
        const $ = cheerio.load(response.data);
        const jobs = [];

        // البحث في العناصر المختلفة
        const selectors = [
            'a[href*="job"]',
            'a[href*="career"]',
            'a[href*="position"]',
            '.job-title a',
            '.career-link',
            '[class*="job"] a',
            '[class*="career"] a'
        ];

        selectors.forEach(selector => {
            $(selector).each((i, element) => {
                const title = $(element).text().trim();
                const link = $(element).attr('href');
                
                if (title && link && title.length > 5) {
                    let fullLink = link;
                    if (link.startsWith('/')) {
                        const baseUrl = new URL(url).origin;
                        fullLink = baseUrl + link;
                    } else if (!link.startsWith('http')) {
                        fullLink = url + '/' + link;
                    }

                    jobs.push({
                        title: title,
                        link: fullLink,
                        source: new URL(url).hostname
                    });
                }
            });
        });

        return jobs.slice(0, 5); // أخذ أول 5 وظائف فقط
    } catch (error) {
        console.error(`خطأ في البحث في ${url}:`, error.message);
        return [];
    }
}

// دالة البحث في Outlier AI
async function scrapeOutlierAI() {
    try {
        return await searchInSite('https://outlier.ai/careers');
    } catch (error) {
        console.error('خطأ في Outlier AI:', error.message);
        return [{
            title: 'AI Training Specialist - Arabic',
            link: 'https://outlier.ai/careers',
            source: 'Outlier AI'
        }];
    }
}

// دالة البحث في Alignerr
async function scrapeAlignerr() {
    try {
        return await searchInSite('https://www.alignerr.com/careers');
    } catch (error) {
        console.error('خطأ في Alignerr:', error.message);
        return [{
            title: 'AI Alignment Specialist',
            link: 'https://www.alignerr.com',
            source: 'Alignerr'
        }];
    }
}

// دالة البحث في DataAnnotation
async function scrapeDataannotationTech() {
    try {
        return await searchInSite('https://www.dataannotation.tech/jobs');
    } catch (error) {
        console.error('خطأ في DataAnnotation:', error.message);
        return [{
            title: 'Data Annotation Specialist',
            link: 'https://www.dataannotation.tech',
            source: 'DataAnnotation'
        }];
    }
}

// دالة البحث في Turing
async function scrapeTuring() {
    try {
        return await searchInSite('https://www.turing.com/jobs');
    } catch (error) {
        console.error('خطأ في Turing:', error.message);
        return [{
            title: 'AI Developer - Remote',
            link: 'https://www.turing.com/jobs',
            source: 'Turing'
        }];
    }
}

// دالة البحث في Clickworker
async function scrapeClickworker() {
    try {
        return await searchInSite('https://www.clickworker.com/en/');
    } catch (error) {
        console.error('خطأ في Clickworker:', error.message);
        return [{
            title: 'Micro Tasks - Various',
            link: 'https://www.clickworker.com',
            source: 'Clickworker'
        }];
    }
}

module.exports = {
    searchInSite,
    scrapeOutlierAI,
    scrapeAlignerr,
    scrapeDataannotationTech,
    scrapeTuring,
    scrapeClickworker
};
