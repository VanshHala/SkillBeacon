const { Client } = require('pg');

async function fixDoubleSerializedJsonb() {
    const client = new Client({
        user: process.env.DATABASE_USERNAME || 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        database: process.env.DATABASE_NAME || 'skillbeacon',
        password: process.env.DATABASE_PASSWORD || '',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
    });

    try {
        await client.connect();

        const result = await client.query(`
      SELECT id, skills_required::text as sr FROM jobs 
      WHERE skills_required::text LIKE '"%' OR skills_required::text LIKE E'"\\\\\"'
    `);

        console.log(`Found ${result.rows.length} potentially double-serialized rows.`);

        let fixedCount = 0;
        for (const row of result.rows) {
            let raw = row.sr;
            try {
                let parsed = JSON.parse(raw);
                while (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                if (Array.isArray(parsed)) {
                    const cleanJson = JSON.stringify(parsed);
                    await client.query(`UPDATE jobs SET skills_required = $1::jsonb WHERE id = $2`, [cleanJson, row.id]);
                    fixedCount++;
                }
            } catch (e) {
                await client.query(`UPDATE jobs SET skills_required = '[]'::jsonb WHERE id = $1`, [row.id]);
                fixedCount++;
            }
        }

        console.log(`Fixed ${fixedCount} double-serialized rows.`);

        try {
            const skills = await client.query(`
        SELECT skill, COUNT(*) as cnt
        FROM jobs, jsonb_array_elements_text(skills_required) as skill 
        WHERE skills_required IS NOT NULL 
          AND skills_required::text != '[]'
        GROUP BY skill 
        ORDER BY cnt DESC 
        LIMIT 10
      `);
            console.log('\\nTop skills query works! Results:');
            skills.rows.forEach(r => console.log(`  ${r.skill}: ${r.cnt}`));
        } catch (e) {
            console.error('Top skills query STILL fails:', e.message);
        }

    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        await client.end();
    }
}

fixDoubleSerializedJsonb();
