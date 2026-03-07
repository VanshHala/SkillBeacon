// Usage: APIFY_API_TOKEN=your_token node backend/fetchData.js
const token = process.env.APIFY_API_TOKEN;
if (!token) { console.error("ERROR: APIFY_API_TOKEN environment variable is not set."); process.exit(1); }
const runId = 'gljD8kd6HqYq0sw7I';
const pollUrl = `https://api.apify.com/v2/actor-runs/${runId}?token=${token}`;
const check = async () => { const r = await fetch(pollUrl); const j = await r.json(); console.log(j.data.status); if (j.data.status === 'SUCCEEDED') { const d = await fetch(`https://api.apify.com/v2/datasets/${j.data.defaultDatasetId}/items?format=json&clean=true`); console.log(JSON.stringify(await d.json(), null, 2).slice(0, 1000)); return; } setTimeout(check, 3000); }; check();
