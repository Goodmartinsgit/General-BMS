const { pool } = require('./src/config/db');
pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`).then(r => { console.log(r.rows.map(x=>x.table_name).join(', ')); process.exit(0); });
