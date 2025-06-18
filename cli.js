#!/usr/bin/env node

const ConsoleExt = require('./src/console-ext');
const DashboardServer = require('./src/dashboard-server');
const { createConfig } = require('./src/config');
const fs = require('fs');
const path = require('path');

function showHelp() {
  console.log(`
Console.ext CLI - Logging and Notification System

Usage:
  console-ext [command] [options]

Commands:
  dashboard    Start the dashboard server
  init         Initialize configuration files
  test         Run a test notification
  help         Show this help message

Options:
  --port, -p      Dashboard port (default: 3000)
  --config, -c    Config file path (default: .env)
  --phone         Phone number for notifications
  --webhook       Webhook URL for notifications
  --dry-run       Test mode without sending notifications

Examples:
  console-ext dashboard --port 8080
  console-ext init --phone +1234567890 --webhook https://hook.com
  console-ext test --phone +1234567890
  
Environment Variables:
  CONSOLE_EXT_PHONE_NUMBER     Phone number for notifications
  CONSOLE_EXT_WEBHOOK_URL      Webhook URL
  CONSOLE_EXT_ENABLE_TEXT      Enable text notifications
  CONSOLE_EXT_ENABLE_CALL      Enable call notifications
  CONSOLE_EXT_DASHBOARD_PORT   Dashboard port
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};
  
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--?/, '');
    const value = args[i + 1];
    if (key) {
      options[key] = value || true;
    }
  }
  
  return { command, options };
}

function loadEnvConfig() {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not installed, use process.env directly
  }
  
  return {
    phoneNumber: process.env.CONSOLE_EXT_PHONE_NUMBER,
    webhookUrl: process.env.CONSOLE_EXT_WEBHOOK_URL,
    enableText: process.env.CONSOLE_EXT_ENABLE_TEXT === 'true',
    enableCall: process.env.CONSOLE_EXT_ENABLE_CALL === 'true',
    rateLimitMax: parseInt(process.env.CONSOLE_EXT_RATE_LIMIT_MAX) || 5,
    rateLimitWindow: parseInt(process.env.CONSOLE_EXT_RATE_LIMIT_WINDOW) || 60000,
    dashboardPort: parseInt(process.env.CONSOLE_EXT_DASHBOARD_PORT) || 3000
  };
}

function initCommand(options) {
  console.log('🚀 Initializing Console.ext configuration...');
  
  const envContent = `# Console.ext Configuration
CONSOLE_EXT_PHONE_NUMBER=${options.phone || '+1234567890'}
CONSOLE_EXT_WEBHOOK_URL=${options.webhook || 'https://your-webhook.com/notify'}
CONSOLE_EXT_ENABLE_TEXT=true
CONSOLE_EXT_ENABLE_CALL=false
CONSOLE_EXT_RATE_LIMIT_MAX=5
CONSOLE_EXT_RATE_LIMIT_WINDOW=60000
CONSOLE_EXT_DASHBOARD_PORT=3000
`;

  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file');
  
  const packageJsonPath = 'package.json';
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!pkg.scripts) pkg.scripts = {};
    pkg.scripts['console-ext:dashboard'] = 'console-ext dashboard';
    pkg.scripts['console-ext:test'] = 'console-ext test';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
    console.log('✅ Updated package.json scripts');
  }
  
  console.log('\n🎉 Console.ext initialized successfully!');
  console.log('\nNext steps:');
  console.log('1. Update .env with your actual webhook URL and phone number');
  console.log('2. Run: console-ext dashboard');
  console.log('3. Visit: http://localhost:3000');
}

function dashboardCommand(options) {
  const config = loadEnvConfig();
  const port = options.port || options.p || config.dashboardPort;
  
  console.log('🚀 Starting Console.ext dashboard...');
  
  const consoleExt = new ConsoleExt({
    ...config,
    phoneNumber: options.phone || config.phoneNumber,
    webhookUrl: options.webhook || config.webhookUrl
  });
  
  const dashboard = new DashboardServer(consoleExt, port);
  dashboard.start();
  
  console.log(`✅ Dashboard running at http://localhost:${port}`);
  console.log('Press Ctrl+C to stop');
  
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping dashboard...');
    dashboard.stop();
    process.exit(0);
  });
}

function testCommand(options) {
  const config = loadEnvConfig();
  
  console.log('🧪 Running Console.ext test notification...');
  
  const consoleExt = new ConsoleExt({
    ...config,
    phoneNumber: options.phone || config.phoneNumber,
    webhookUrl: options.webhook || config.webhookUrl,
    enableText: !options['dry-run']
  });
  
  console.log('Sending test error...');
  console.error('Test critical error from Console.ext CLI');
  
  setTimeout(() => {
    console.text('Test manual notification from Console.ext CLI');
    
    setTimeout(() => {
      const stats = consoleExt.getNotificationStats();
      console.log('\n📊 Test Results:');
      console.log(`  Sent: ${stats.sent}`);
      console.log(`  Rate Limited: ${stats.undelivered}`);
      
      if (options['dry-run']) {
        console.log('\n💡 This was a dry run - no actual notifications sent');
      }
      
      consoleExt.restore();
      process.exit(0);
    }, 1000);
  }, 1000);
}

function main() {
  const { command, options } = parseArgs();
  
  switch (command) {
    case 'dashboard':
      dashboardCommand(options);
      break;
      
    case 'init':
      initCommand(options);
      break;
      
    case 'test':
      testCommand(options);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "console-ext help" for usage information');
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, parseArgs, loadEnvConfig };