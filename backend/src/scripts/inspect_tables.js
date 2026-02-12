const { pool } = require('../config/db');

const listColumns = async (tableName) => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = $1
            ORDER BY ordinal_position;
        `, [tableName]);
        console.log(`Columns in ${tableName}:`);
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    } catch (err) {
        console.error(`Error listing columns for ${tableName}:`, err);
    }
};

const run = async () => {
    await listColumns('orders');
    await listColumns('order_items');
    process.exit(0);
};

run();
