const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'skillbeacon',
    password: 'vansh',
    port: 5432
});

pool.query("DELETE FROM jobs WHERE source_platform LIKE 'LinkedIn%';", (err, res) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Rows deleted:', res.rowCount);
    }
    pool.end();
});
