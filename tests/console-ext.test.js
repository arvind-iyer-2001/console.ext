const ConsoleExt = require('../console-ext');

describe('ConsoleExt', () => {
  let consoleExt;
  let originalConsole;

  beforeEach(() => {
    originalConsole = { ...console };
    consoleExt = new ConsoleExt({
      phoneNumber: '+1234567890',
      webhookUrl: 'https://test-webhook.com',
      enableText: true,
      rateLimitMax: 3,
      rateLimitWindow: 60000
    });
  });

  afterEach(() => {
    if (consoleExt) {
      consoleExt.restore();
    }
  });

  describe('Console Override', () => {
    test('should override console.log', () => {
      expect(typeof console.log).toBe('function');
      expect(console.log).not.toBe(originalConsole.log);
    });

    test('should override console.error', () => {
      expect(typeof console.error).toBe('function');
      expect(console.error).not.toBe(originalConsole.error);
    });

    test('should override console.warn', () => {
      expect(typeof console.warn).toBe('function');
      expect(console.warn).not.toBe(originalConsole.warn);
    });

    test('should add console.text method', () => {
      expect(typeof console.text).toBe('function');
    });
  });

  describe('Critical Error Detection', () => {
    test('should detect critical keywords in error messages', () => {
      const sendNotificationSpy = jest.spyOn(consoleExt, 'sendNotification');
      
      console.error('Database connection failed - critical error');
      
      expect(sendNotificationSpy).toHaveBeenCalledWith('critical', 'Database connection failed - critical error');
    });

    test('should not trigger notification for non-critical messages', () => {
      const sendNotificationSpy = jest.spyOn(consoleExt, 'sendNotification');
      
      console.log('Application started successfully');
      
      expect(sendNotificationSpy).not.toHaveBeenCalled();
    });

    test('should detect multiple critical keywords', () => {
      const sendNotificationSpy = jest.spyOn(consoleExt, 'sendNotification');
      
      console.error('Fatal exception occurred');
      console.warn('Timeout error detected');
      
      expect(sendNotificationSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow notifications within rate limit', () => {
      const sendTextMessageSpy = jest.spyOn(consoleExt, 'sendTextMessage');
      
      console.error('Error 1');
      console.error('Error 2');
      console.error('Error 3');
      
      expect(sendTextMessageSpy).toHaveBeenCalledTimes(3);
    });

    test('should block notifications when rate limit exceeded', async () => {
      const sendTextMessageSpy = jest.spyOn(consoleExt, 'sendTextMessage');
      
      console.error('Error 1');
      console.error('Error 2');
      console.error('Error 3');
      console.error('Error 4'); // Should be rate limited
      
      expect(sendTextMessageSpy).toHaveBeenCalledTimes(3);
    });

    test('should track undelivered notifications', () => {
      console.error('Error 1');
      console.error('Error 2');
      console.error('Error 3');
      console.error('Error 4'); // Should be rate limited
      
      const stats = consoleExt.getNotificationStats();
      expect(stats.undelivered).toBe(1);
      expect(stats.sent).toBe(3);
    });
  });

  describe('Configuration', () => {
    test('should use default configuration when none provided', () => {
      const defaultConsoleExt = new ConsoleExt();
      
      expect(defaultConsoleExt.config.enableText).toBe(false);
      expect(defaultConsoleExt.config.rateLimitMax).toBe(5);
      expect(defaultConsoleExt.config.criticalKeywords).toContain('error');
      
      defaultConsoleExt.restore();
    });

    test('should merge custom configuration with defaults', () => {
      const customConsoleExt = new ConsoleExt({
        enableText: true,
        customSetting: 'test'
      });
      
      expect(customConsoleExt.config.enableText).toBe(true);
      expect(customConsoleExt.config.customSetting).toBe('test');
      expect(customConsoleExt.config.rateLimitMax).toBe(5); // Default
      
      customConsoleExt.restore();
    });
  });

  describe('Notification Sending', () => {
    test('should send text notification when enabled', async () => {
      const sendTextMessageSpy = jest.spyOn(consoleExt, 'sendTextMessage');
      
      await consoleExt.sendNotification('critical', 'Test error message');
      
      expect(sendTextMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'critical',
          message: 'Test error message'
        })
      );
    });

    test('should not send text notification when disabled', async () => {
      consoleExt.config.enableText = false;
      const sendTextMessageSpy = jest.spyOn(consoleExt, 'sendTextMessage');
      
      await consoleExt.sendNotification('critical', 'Test error message');
      
      expect(sendTextMessageSpy).not.toHaveBeenCalled();
    });

    test('should make call for critical notifications when enabled', async () => {
      consoleExt.config.enableCall = true;
      const makeCallSpy = jest.spyOn(consoleExt, 'makeCall');
      
      await consoleExt.sendNotification('critical', 'Critical error');
      
      expect(makeCallSpy).toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    test('should track notification statistics', () => {
      console.error('Error 1');
      console.text('Manual notification');
      
      const stats = consoleExt.getNotificationStats();
      
      expect(stats.sent).toBe(2);
      expect(stats.sentNotifications).toHaveLength(2);
      expect(stats.sentNotifications[0].type).toBe('critical');
      expect(stats.sentNotifications[1].type).toBe('text');
    });

    test('should clear statistics', () => {
      console.error('Error 1');
      console.error('Error 2');
      
      let stats = consoleExt.getNotificationStats();
      expect(stats.sent).toBe(2);
      
      consoleExt.clearStats();
      
      stats = consoleExt.getNotificationStats();
      expect(stats.sent).toBe(0);
      expect(stats.undelivered).toBe(0);
    });
  });

  describe('ID Generation', () => {
    test('should generate unique IDs for notifications', () => {
      const id1 = consoleExt.generateId();
      const id2 = consoleExt.generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('Console Restoration', () => {
    test('should restore original console methods', () => {
      consoleExt.restore();
      
      expect(console.log).toBe(originalConsole.log);
      expect(console.error).toBe(originalConsole.error);
      expect(console.warn).toBe(originalConsole.warn);
      expect(console.text).toBeUndefined();
    });
  });
});