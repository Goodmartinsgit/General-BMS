require('dotenv').config();
const { query } = require('./src/config/db');
query('SELECT id, product_name, product_images FROM products limit 20')
  .then(res => console.log(JSON.stringify(res.rows, null, 2)))
  .catch(console.error)
  .finally(() => process.exit(0));
