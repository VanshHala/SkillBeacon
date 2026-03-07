// Usage: APIFY_API_TOKEN=your_token node backend/fetch.js
const token = process.env.APIFY_API_TOKEN;
if (!token) { console.error("ERROR: APIFY_API_TOKEN environment variable is not set."); process.exit(1); }
const url = `https://api.apify.com/v2/acts/bebity~linkedin-jobs-scraper/runs?token=${token}`;
const args = { title: 'Software Engineer', location: 'Indore, India', rows: 5 };
fetch(url, { method: 'POST', body: JSON.stringify(args), headers: { 'Content-Type': 'application/json' } }).then(r => r.json().then(j => console.log(j)));
