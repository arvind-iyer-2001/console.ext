const ConsoleExt = require('../src/console-ext');
const { createConfig } = require('../src/config');

const config = createConfig('development', {
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook-service.com/notify',
    enableText: true
});

const consoleExt = new ConsoleExt(config);

console.log('Application started successfully');

console.text('User logged in:', 'john@example.com');

setTimeout(() => {
    console.error('Database connection failed - critical error detected');
}, 2000);

setTimeout(() => {
    console.warn('Low memory warning - this is a critical issue');
}, 4000);

setTimeout(() => {
    console.text('Manual notification: Server maintenance scheduled');
}, 6000);

setTimeout(() => {
    console.log('Cleaning up...');
    consoleExt.restore();
    console.log('Console restored to original state');
}, 8000);