const { pool } = require('./src/config/db');
pool.query("UPDATE sales SET sale_date = created_at WHERE sale_source = 'online' AND notes LIKE '%(Backfilled)%'").then(r => { console.log(r.rowCount); process.exit(0); });
