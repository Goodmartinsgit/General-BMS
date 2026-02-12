const { pool } = require('../config/db');

const checkSchema = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sales' AND column_name = 'id';
        `);
        console.log('Sales ID column:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        process.exit();
    }
};

checkSchema();
