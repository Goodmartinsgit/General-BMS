const db = require('../config/db');

async function inspect() {
  try {
    const customers = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers'");
    console.log('Columns in customers:');
    customers.rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));

    const sales = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'sales'");
    console.log('\nColumns in sales:');
    sales.rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
