import 'dotenv/config';

console.log('=== Environment Variables Check ===\n');

const requiredVars = [
    'MUX_TOKEN_ID',
    'MUX_SECRET_KEY',
    'MUX_SIGNING_KEY_ID',
    'MUX_SIGNING_PRIVATE_KEY',
    'NGROK_AUTH_TOKEN'
];

const optionalVars = [
    'VITE_BASE_URL',
    'MONGODB_URI',
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE'
];

console.log('Required Variables:');
requiredVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const display = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'Missing';
    console.log(`${status} ${varName}: ${display}`);
});

console.log('\nOptional Variables:');
optionalVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '⚠️';
    const display = value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : 'Not set';
    console.log(`${status} ${varName}: ${display}`);
});

const missingRequired = requiredVars.filter(v => !process.env[v]);
if (missingRequired.length > 0) {
    console.log('\n❌ Missing required variables:', missingRequired.join(', '));
    console.log('\nAdd them to your .env file in the backend directory.');
    process.exit(1);
} else {
    console.log('\n✅ All required environment variables are set!');
}
