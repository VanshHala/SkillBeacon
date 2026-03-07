const { Client } = require('pg');

async function fixDoubleSerializedJsonb() {
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'skillbeacon',
        password: 'vansh',
        port: 5432,
    });

    try {
        await client.connect();

        // Find double-serialized rows: stored as a JSON string (starts with '"')
        // e.g. "\"[\\\"Problem Solving\\\",\\\"Python\\\"]\"" instead of ["Problem Solving","Python"]
        const result = await client.query(`
      SELECT id, skills_required::text as sr FROM jobs 
      WHERE skills_required::text LIKE '"%' OR skills_required::text LIKE E'"\\\\"'
    `);

        console.log(`Found ${result.rows.length} potentially double-serialized rows.`);

        let fixedCount = 0;
        for (const row of result.rows) {
            let raw = row.sr;
            // Try to unwrap: if it's a JSON string containing a JSON array
            try {
                let parsed = JSON.parse(raw);
                // If parsed is a string, parse again
                while (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                if (Array.isArray(parsed)) {
                    const cleanJson = JSON.stringify(parsed);
                    await client.query(`UPDATE jobs SET skills_required = $1::jsonb WHERE id = $2`, [cleanJson, row.id]);
                    fixedCount++;
                }
            } catch (e) {
                // If all parsing fails, just reset to empty array
                await client.query(`UPDATE jobs SET skills_required = '[]'::jsonb WHERE id = $1`, [row.id]);
                fixedCount++;
            }
        }

        console.log(`Fixed ${fixedCount} double-serialized rows.`);

        // Verify the top skills query works
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
