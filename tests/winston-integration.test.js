const WinstonConsoleExt = require('../src/winston-integration');

// Mock winston
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  })),
  format: {
    combine: jest.fn(() => 'mock-format'),
    timestamp: jest.fn(() => 'mock-timestamp'),
    errors: jest.fn(() => 'mock-errors'),
    json: jest.fn(() => 'mock-json'),
    colorize: jest.fn(() => 'mock-colorize'),
    simple: jest.fn(() => 'mock-simple')
  },
  transports: {
    File: jest.fn(),
    Console: jest.fn()
  }
}));

describe('WinstonConsoleExt', () => {
  let winstonConsoleExt;
  let mockLogger;

  beforeEach(() => {
    const winston = require('winston');
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    };
    winston.createLogger.mockReturnValue(mockLogger);
    
    winstonConsoleExt = new WinstonConsoleExt({
      phoneNumber: '+1234567890',
      webhookUrl: 'https://test-webhook.com',
      logLevel: 'debug',
      errorLogFile: 'test-error.log',
      combinedLogFile: 'test-combined.log'
    });
  });

  afterEach(() => {
    if (winstonConsoleExt && winstonConsoleExt.getConsoleExt()) {
      winstonConsoleExt.getConsoleExt().restore();
    }
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create Winston logger with custom configuration', () => {
      const winston = require('winston');
      
      expect(winston.createLogger).toHaveBeenCalledWith({
        level: 'debug',
        format: 'mock-format',
        transports: expect.any(Array)
      });
    });

    test('should use default configuration when none provided', () => {
      const winston = require('winston');
      winston.createLogger.mockClear();
      
      new WinstonConsoleExt();
      
      expect(winston.createLogger).toHaveBeenCalledWith({
        level: 'info',
        format: 'mock-format',
        transports: expect.any(Array)
      });
    });

    test('should create ConsoleExt instance', () => {
      expect(winstonConsoleExt.getConsoleExt()).toBeDefined();
      expect(winstonConsoleExt.getConsoleExt().constructor.name).toBe('ConsoleExt');
    });
  });

  describe('Logger Override', () => {
    test('should override logger.error and warn methods', () => {
      const checkForCriticalErrorSpy = jest.spyOn(winstonConsoleExt, 'checkForCriticalError');
      winstonConsoleExt.overrideWinstonMethods();
      
      // Test error override
      winstonConsoleExt.logger.error('critical system failure');
      expect(checkForCriticalErrorSpy).toHaveBeenCalledWith('critical system failure');
      
      // Test warn override  
      winstonConsoleExt.logger.warn('critical memory issue');
      expect(checkForCriticalErrorSpy).toHaveBeenCalledWith('critical memory issue');
      
      expect(checkForCriticalErrorSpy).toHaveBeenCalledTimes(4); // Called during construction too
    });

    test('should preserve original logger functionality', () => {
      winstonConsoleExt.overrideWinstonMethods();
      
      // Should still be able to log
      expect(() => {
        winstonConsoleExt.logger.error('test');
        winstonConsoleExt.logger.warn('test');
        winstonConsoleExt.logger.info('test');
      }).not.toThrow();
    });
  });

  describe('Critical Error Detection', () => {
    test('should detect critical errors and send notifications', () => {
      const sendNotificationSpy = jest.spyOn(winstonConsoleExt.getConsoleExt(), 'sendNotification');
      
      winstonConsoleExt.checkForCriticalError('Database connection failed - critical error');
      
      expect(sendNotificationSpy).toHaveBeenCalledWith('critical', 'Database connection failed - critical error');
    });

    test('should not send notifications for non-critical messages', () => {
      const sendNotificationSpy = jest.spyOn(winstonConsoleExt.getConsoleExt(), 'sendNotification');
      
      winstonConsoleExt.checkForCriticalError('Normal log message');
      
      expect(sendNotificationSpy).not.toHaveBeenCalled();
    });

    test('should detect multiple critical keywords', () => {
      const sendNotificationSpy = jest.spyOn(winstonConsoleExt.getConsoleExt(), 'sendNotification');
      
      winstonConsoleExt.checkForCriticalError('Fatal exception in database connection');
      
      expect(sendNotificationSpy).toHaveBeenCalledWith('critical', 'Fatal exception in database connection');
    });
  });

  describe('Notification Logging', () => {
    test('should log notifications with proper format', () => {
      winstonConsoleExt.logNotification('critical', 'Test error message', true);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Console.ext Notification', {
        type: 'critical',
        message: 'Test error message',
        delivered: true,
        timestamp: expect.any(String),
        source: 'console-ext'
      });
    });

    test('should truncate long messages', () => {
      const longMessage = 'a'.repeat(300);
      winstonConsoleExt.logNotification('error', longMessage, false);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Console.ext Notification', {
        type: 'error',
        message: longMessage.substring(0, 200),
        delivered: false,
        timestamp: expect.any(String),
        source: 'console-ext'
      });
    });
  });

  describe('Getters', () => {
    test('should return Winston logger instance', () => {
      const logger = winstonConsoleExt.getLogger();
      expect(logger).toBe(mockLogger);
    });

    test('should return ConsoleExt instance', () => {
      const consoleExt = winstonConsoleExt.getConsoleExt();
      expect(consoleExt).toBeDefined();
      expect(typeof consoleExt.sendNotification).toBe('function');
    });
  });

  describe('Integration', () => {
    test('should work with both Winston and ConsoleExt', () => {
      const logger = winstonConsoleExt.getLogger();
      const consoleExt = winstonConsoleExt.getConsoleExt();
      
      expect(logger).toBeDefined();
      expect(consoleExt).toBeDefined();
      expect(typeof logger.error).toBe('function');
      expect(typeof consoleExt.sendNotification).toBe('function');
    });
  });
});