require('dotenv').config();
const validateEnv = require('./src/config/envValidator');
validateEnv();

const app = require('./src/app');
const autoMigrateCategories = require('./src/scripts/autoMigrateCategories');

const PORT = process.env.PORT || 5000;

autoMigrateCategories().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
