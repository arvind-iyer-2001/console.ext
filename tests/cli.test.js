const { main, parseArgs, loadEnvConfig } = require('../cli');
const ConsoleExt = require('../src/console-ext');
const DashboardServer = require('../src/dashboard-server');
const fs = require('fs');

// Mock dependencies
jest.mock('fs');
jest.mock('../src/console-ext');
jest.mock('../src/dashboard-server');

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  error: jest.fn()
};

describe('CLI', () => {
  let mockExit;
  let mockArgv;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockArgv = process.argv;
    Object.assign(console, mockConsole);
    
    // Clear environment variables before each test
    delete process.env.CONSOLE_EXT_PHONE_NUMBER;
    delete process.env.CONSOLE_EXT_WEBHOOK_URL;
    delete process.env.CONSOLE_EXT_ENABLE_TEXT;
    delete process.env.CONSOLE_EXT_ENABLE_CALL;
    delete process.env.CONSOLE_EXT_RATE_LIMIT_MAX;
    delete process.env.CONSOLE_EXT_RATE_LIMIT_WINDOW;
    delete process.env.CONSOLE_EXT_DASHBOARD_PORT;
    
    // Mock ConsoleExt
    ConsoleExt.mockImplementation(() => ({
      getNotificationStats: () => ({ sent: 2, undelivered: 1 }),
      restore: jest.fn()
    }));
    
    // Mock DashboardServer
    DashboardServer.mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn()
    }));
  });

  afterEach(() => {
    mockExit.mockRestore();
    process.argv = mockArgv;
    Object.assign(console, originalConsole);
    delete process.env.CONSOLE_EXT_PHONE_NUMBER;
    delete process.env.CONSOLE_EXT_WEBHOOK_URL;
  });

  describe('parseArgs', () => {
    test('should parse command without options', () => {
      process.argv = ['node', 'cli.js', 'help'];
      const result = parseArgs();
      
      expect(result.command).toBe('help');
      expect(result.options).toEqual({});
    });

    test('should parse command with options', () => {
      process.argv = ['node', 'cli.js', 'dashboard', '--port', '8080', '--phone', '+1234567890'];
      const result = parseArgs();
      
      expect(result.command).toBe('dashboard');
      expect(result.options).toEqual({
        port: '8080',
        phone: '+1234567890'
      });
    });

    test('should parse single dash options', () => {
      process.argv = ['node', 'cli.js', 'test', '-p', '3000'];
      const result = parseArgs();
      
      expect(result.command).toBe('test');
      expect(result.options).toEqual({
        p: '3000'
      });
    });

    test('should handle flags without values', () => {
      process.argv = ['node', 'cli.js', 'test', '--dry-run'];
      const result = parseArgs();
      
      expect(result.command).toBe('test');
      expect(result.options).toEqual({
        'dry-run': true
      });
    });

    test('should default to help command', () => {
      process.argv = ['node', 'cli.js'];
      const result = parseArgs();
      
      expect(result.command).toBe('help');
    });
  });

  describe('loadEnvConfig', () => {
    test('should load configuration from environment variables', () => {
      process.env.CONSOLE_EXT_PHONE_NUMBER = '+1234567890';
      process.env.CONSOLE_EXT_WEBHOOK_URL = 'https://test.com';
      process.env.CONSOLE_EXT_ENABLE_TEXT = 'true';
      process.env.CONSOLE_EXT_ENABLE_CALL = 'false';
      process.env.CONSOLE_EXT_RATE_LIMIT_MAX = '10';
      process.env.CONSOLE_EXT_RATE_LIMIT_WINDOW = '30000';
      process.env.CONSOLE_EXT_DASHBOARD_PORT = '4000';

      const config = loadEnvConfig();

      expect(config).toEqual({
        phoneNumber: '+1234567890',
        webhookUrl: 'https://test.com',
        enableText: true,
        enableCall: false,
        rateLimitMax: 10,
        rateLimitWindow: 30000,
        dashboardPort: 4000
      });
    });

    test('should use default values when env vars are not set', () => {
      const config = loadEnvConfig();

      expect(config).toEqual({
        phoneNumber: undefined,
        webhookUrl: undefined,
        enableText: false,
        enableCall: false,
        rateLimitMax: 5,
        rateLimitWindow: 60000,
        dashboardPort: 3000
      });
    });

    test('should handle invalid numeric values', () => {
      process.env.CONSOLE_EXT_RATE_LIMIT_MAX = 'invalid';
      process.env.CONSOLE_EXT_DASHBOARD_PORT = 'also-invalid';

      const config = loadEnvConfig();

      expect(config.rateLimitMax).toBe(5); // default
      expect(config.dashboardPort).toBe(3000); // default
    });
  });

  describe('Help Command', () => {
    test('should show help for help command', () => {
      process.argv = ['node', 'cli.js', 'help'];
      
      main();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Console.ext CLI'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Commands:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('dashboard'));
    });

    test('should show help for --help flag', () => {
      process.argv = ['node', 'cli.js', '--help'];
      
      main();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Console.ext CLI'));
    });

    test('should show help for -h flag', () => {
      process.argv = ['node', 'cli.js', '-h'];
      
      main();
      
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Console.ext CLI'));
    });
  });

  describe('Init Command', () => {
    beforeEach(() => {
      fs.writeFileSync.mockImplementation(() => {});
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        scripts: {}
      }));
    });

    test('should create .env file with default values', () => {
      process.argv = ['node', 'cli.js', 'init'];
      
      main();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith('.env', expect.stringContaining('CONSOLE_EXT_PHONE_NUMBER=+1234567890'));
      expect(console.log).toHaveBeenCalledWith('✅ Created .env file');
    });

    test('should create .env file with custom values', () => {
      process.argv = ['node', 'cli.js', 'init', '--phone', '+9876543210', '--webhook', 'https://custom.com'];
      
      main();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith('.env', expect.stringContaining('CONSOLE_EXT_PHONE_NUMBER=+9876543210'));
      expect(fs.writeFileSync).toHaveBeenCalledWith('.env', expect.stringContaining('https://custom.com'));
    });

    test('should update package.json if it exists', () => {
      process.argv = ['node', 'cli.js', 'init'];
      
      main();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith('package.json', expect.stringContaining('console-ext:dashboard'));
      expect(console.log).toHaveBeenCalledWith('✅ Updated package.json scripts');
    });

    test('should handle missing package.json', () => {
      fs.existsSync.mockReturnValue(false);
      process.argv = ['node', 'cli.js', 'init'];
      
      main();
      
      expect(fs.writeFileSync).toHaveBeenCalledWith('.env', expect.any(String));
      expect(fs.writeFileSync).not.toHaveBeenCalledWith('package.json', expect.any(String));
    });
  });

  describe('Unknown Command', () => {
    test('should handle unknown commands', () => {
      process.argv = ['node', 'cli.js', 'unknown-command'];
      
      main();
      
      expect(console.error).toHaveBeenCalledWith('Unknown command: unknown-command');
      expect(console.log).toHaveBeenCalledWith('Run "console-ext help" for usage information');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors gracefully', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });
      
      process.argv = ['node', 'cli.js', 'init'];
      
      expect(() => main()).toThrow('File write error');
    });
  });

  describe('Module Exports', () => {
    test('should export required functions', () => {
      expect(typeof parseArgs).toBe('function');
      expect(typeof loadEnvConfig).toBe('function');
      expect(typeof main).toBe('function');
    });
  });
});