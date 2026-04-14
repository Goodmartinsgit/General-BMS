const { pool } = require('./src/config/db');
pool.query(`UPDATE sales SET status = 'reversed' WHERE reversed_at IS NOT NULL AND (unreversed_at IS NULL OR reversed_at > unreversed_at) AND status != 'reversed'`).then(r => { console.log("Fixed statuses:", r.rowCount); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
