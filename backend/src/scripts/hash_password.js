const bcrypt = require('bcryptjs');

const run = async () => {
    const password = process.argv[2];
    if (!password) {
        console.error('Usage: node hash_password.js <password>');
        process.exit(1);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
};

run();
