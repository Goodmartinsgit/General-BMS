const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];

function validateEnv() {
    const missing = requiredVars.filter(v => !process.env[v]);
    if (missing.length > 0) {
        console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
    if (process.env.JWT_SECRET.length < 32) {
        console.error('FATAL: JWT_SECRET must be at least 32 characters');
        process.exit(1);
    }
    if (process.env.JWT_SECRET.includes('change_this')) {
        console.warn('WARNING: JWT_SECRET contains default placeholder value. Change it before deploying to production.');
    }
}

module.exports = validateEnv;
