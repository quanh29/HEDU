// Test webhook locally
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

console.log('Testing MUX Webhook Endpoint...\n');

// Test 1: video.upload.asset_created
console.log('1️⃣ Testing: video.upload.asset_created');
try {
    const response1 = await axios.post(`${BASE_URL}/api/mux/webhook`, {
        type: 'video.upload.asset_created',
        data: {
            upload_id: 'test_upload_123',
            asset_id: 'test_asset_456'
        }
    });
    console.log('✅ Response:', response1.data);
} catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
}

console.log('\n');

// Test 2: video.asset.ready
console.log('2️⃣ Testing: video.asset.ready');
try {
    const response2 = await axios.post(`${BASE_URL}/api/mux/webhook`, {
        type: 'video.asset.ready',
        data: {
            id: 'test_asset_456',
            playback_ids: [
                { id: 'playback_123', policy: 'signed' }
            ],
            duration: 120.5
        }
    });
    console.log('✅ Response:', response2.data);
} catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
}

console.log('\n');

// Test 3: video.upload.errored
console.log('3️⃣ Testing: video.upload.errored');
try {
    const response3 = await axios.post(`${BASE_URL}/api/mux/webhook`, {
        type: 'video.upload.errored',
        data: {
            upload_id: 'test_upload_789',
            error: {
                type: 'invalid_input',
                message: 'Test error'
            }
        }
    });
    console.log('✅ Response:', response3.data);
} catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
}

console.log('\n✨ Webhook tests complete!');
console.log('Check backend console for detailed logs.');
