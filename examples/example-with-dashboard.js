const ConsoleExt = require('../src/console-ext');
const DashboardServer = require('../src/dashboard-server');
const { createConfig } = require('../src/config');

const config = createConfig('development', {
    phoneNumber: '+1234567890',
    webhookUrl: 'https://your-webhook-service.com/notify',
    enableText: true,
    rateLimitWindow: 60000,
    rateLimitMax: 3
});

const consoleExt = new ConsoleExt(config);
const dashboard = new DashboardServer(consoleExt, 3000);

dashboard.start();

console.log('Console.ext with Dashboard Example');
console.log('Dashboard available at: http://localhost:3000');

console.text('System initialized with dashboard support');

let errorCount = 0;
const simulateErrors = setInterval(() => {
    errorCount++;
    
    if (errorCount <= 5) {
        console.error(`Simulated error #${errorCount} - This should trigger notifications`);
    } else if (errorCount <= 8) {
        console.error(`Rate limited error #${errorCount} - This should be blocked`);
    } else {
        console.log('Error simulation complete. Check dashboard for results.');
        clearInterval(simulateErrors);
        
        setTimeout(() => {
            console.log('Shutting down in 30 seconds...');
            setTimeout(() => {
                dashboard.stop();
                process.exit(0);
            }, 30000);
        }, 5000);
    }
}, 2000);