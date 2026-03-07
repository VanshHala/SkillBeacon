const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const client = new Client({
        user: process.env.DATABASE_USERNAME || 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        database: process.env.DATABASE_NAME || 'skillbeacon',
        password: process.env.DATABASE_PASSWORD || '',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
    });

    try {
        await client.connect();
        const data = JSON.parse(fs.readFileSync('apify_data.json', 'utf8'));
        console.log(`Successfully loaded ${data.length} records from Apify dataset.`);

        let inserted = 0;
        for (const item of data) {
            if (!item.title) continue;

            try {
                const city = item.location ? item.location.split(',')[0].trim() : 'Remote';

                const mockSkills = ['Communication', 'Teamwork', 'Problem Solving'];
                if (item.title.toLowerCase().includes('engineer') || item.title.toLowerCase().includes('developer')) {
                    mockSkills.push('JavaScript', 'Python', 'React', 'Java');
                } else if (item.title.toLowerCase().includes('data')) {
                    mockSkills.push('SQL', 'Excel', 'Python', 'Tableau');
                }

                const date = item.publishedAt && item.publishedAt.match(/^\d{4}-\d{2}-\d{2}/)
                    ? item.publishedAt.split('T')[0]
                    : new Date().toISOString().split('T')[0];

                await client.query(
                    `INSERT INTO jobs (
            job_title, company_name, location_city, skills_required, 
            salary, job_description, source_platform, job_posted_date, created_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                    [
                        item.title.substring(0, 255),
                        (item.companyName || 'Confidential').substring(0, 255),
                        city.substring(0, 255),
                        JSON.stringify(mockSkills),
                        (item.salary || 'Not Specified').substring(0, 255),
                        item.description || 'No description provided.',
                        'Apify (LinkedIn)',
                        date
                    ]
                );
                inserted++;
            } catch (e) {
                console.error(`Failed to insert record: ${e.message}`);
            }
        }
        console.log(`Process Complete. Successfully seeded ${inserted} real jobs into the SkillBeacon database!`);
    } catch (err) {
        console.error('Database Connection or Parsing Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
