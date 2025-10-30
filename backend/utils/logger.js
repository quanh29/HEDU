// Helper để log messages đẹp hơn trong console
export const logger = {
    success: (message) => console.log('✅', message),
    error: (message) => console.error('❌', message),
    warning: (message) => console.warn('⚠️', message),
    info: (message) => console.log('ℹ️', message),
    debug: (message) => console.log('🐛', message),
    
    section: (title) => {
        console.log('\n' + '='.repeat(50));
        console.log('  ' + title);
        console.log('='.repeat(50) + '\n');
    },
    
    envCheck: (varName, value) => {
        const status = value ? '✅' : '❌';
        const display = value 
            ? (value.length > 30 ? value.substring(0, 30) + '...' : value)
            : 'Missing';
        console.log(`${status} ${varName}: ${display}`);
    },

    muxEvent: (eventType, data) => {
        const icons = {
            'video.upload.asset_created': '📤',
            'video.asset.ready': '🎬',
            'video.asset.errored': '❌',
            'video.upload.errored': '❌',
            'video.upload.cancelled': '🚫'
        };
        const icon = icons[eventType] || '🔔';
        console.log(`${icon} MUX Webhook: ${eventType}`);
        if (data) {
            console.log('   Data:', JSON.stringify(data, null, 2));
        }
    }
};

export default logger;
