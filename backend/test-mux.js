// Test MUX Connection
import Mux from '@mux/mux-node';
import 'dotenv/config';

console.log('Testing MUX Connection...');
console.log('Environment variables:');
console.log('- MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID ? 'Set ✓' : 'Missing ✗');
console.log('- MUX_SECRET_KEY:', process.env.MUX_SECRET_KEY ? 'Set ✓' : 'Missing ✗');

if (!process.env.MUX_TOKEN_ID || !process.env.MUX_SECRET_KEY) {
    console.error('\n❌ Missing MUX credentials in .env file');
    console.log('\nAdd these to your .env file:');
    console.log('MUX_TOKEN_ID=your_token_id');
    console.log('MUX_SECRET_KEY=your_secret_key');
    console.log('\nGet credentials from: https://dashboard.mux.com/settings/access-tokens');
    process.exit(1);
}

try {
    const { video } = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_SECRET_KEY
    });

    console.log('\n✅ Mux client initialized successfully');

    // Test: List assets (just to verify connection)
    console.log('\nTesting connection by listing assets...');
    const assets = await video.assets.list({ limit: 1 });
    console.log('✅ Connection successful!');
    console.log('Assets count:', assets.length);

    // Test: Create upload
    console.log('\nTesting upload creation...');
    const upload = await video.uploads.create({
        new_asset_settings: {
            playback_policy: ['signed'],
            encoding_tier: 'baseline'
        },
        cors_origin: '*',
        test: false
    });

    console.log('✅ Upload created successfully!');
    console.log('Upload ID:', upload.id);
    console.log('Upload URL:', upload.url);

    // Cancel the test upload
    await video.uploads.cancel(upload.id);
    console.log('✅ Test upload cancelled');

    console.log('\n🎉 All tests passed! MUX is configured correctly.');
} catch (error) {
    console.error('\n❌ MUX Connection Error:');
    console.error('Message:', error.message);
    
    if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('\n💡 Tip: Check that your MUX_TOKEN_ID and MUX_SECRET_KEY are correct');
        console.log('Get new credentials from: https://dashboard.mux.com/settings/access-tokens');
    }
    
    process.exit(1);
}
