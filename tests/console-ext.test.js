const ConsoleExt = require('../src/console-ext');

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

  describe('Error Handling', () => {
    test('should handle fetch errors in sendTextMessage', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const originalError = consoleExt.originalConsole.error;
      consoleExt.originalConsole.error = jest.fn();
      
      await consoleExt.sendTextMessage({
        type: 'test',
        message: 'test message',
        timestamp: new Date().toISOString()
      });
      
      expect(consoleExt.originalConsole.error).toHaveBeenCalledWith(
        'Console.ext: Failed to send text notification:',
        expect.any(Error)
      );
      
      consoleExt.originalConsole.error = originalError;
    });

    test('should handle fetch errors in makeCall', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const originalError = consoleExt.originalConsole.error;
      consoleExt.originalConsole.error = jest.fn();
      
      await consoleExt.makeCall({
        type: 'critical',
        message: 'test message',
        timestamp: new Date().toISOString()
      });
      
      expect(consoleExt.originalConsole.error).toHaveBeenCalledWith(
        'Console.ext: Failed to make call notification:',
        expect.any(Error)
      );
      
      consoleExt.originalConsole.error = originalError;
    });

    test('should handle fetch errors in sendWebhook', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));
      const originalError = consoleExt.originalConsole.error;
      consoleExt.originalConsole.error = jest.fn();
      
      await consoleExt.sendWebhook({
        type: 'test',
        message: 'test message',
        timestamp: new Date().toISOString()
      });
      
      expect(consoleExt.originalConsole.error).toHaveBeenCalledWith(
        'Console.ext: Failed to send webhook:',
        expect.any(Error)
      );
      
      consoleExt.originalConsole.error = originalError;
    });

    test('should handle fetch errors in sendToDataDog', async () => {
      const dataDogConsoleExt = new ConsoleExt({
        dataDogApiKey: 'test-key',
        phoneNumber: '+1234567890'
      });
      
      global.fetch.mockRejectedValue(new Error('DataDog error'));
      const originalError = dataDogConsoleExt.originalConsole.error;
      dataDogConsoleExt.originalConsole.error = jest.fn();
      
      await dataDogConsoleExt.sendToDataDog({
        type: 'critical',
        message: 'test message',
        timestamp: new Date().toISOString()
      });
      
      expect(dataDogConsoleExt.originalConsole.error).toHaveBeenCalledWith(
        'Console.ext: Failed to send to DataDog:',
        expect.any(Error)
      );
      
      dataDogConsoleExt.originalConsole.error = originalError;
      dataDogConsoleExt.restore();
    });

    test('should handle HTTP errors in sendTextMessage', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500
      });
      
      const originalError = consoleExt.originalConsole.error;
      consoleExt.originalConsole.error = jest.fn();
      
      await consoleExt.sendTextMessage({
        type: 'test',
        message: 'test message',
        timestamp: new Date().toISOString()
      });
      
      expect(consoleExt.originalConsole.error).toHaveBeenCalled();
      consoleExt.originalConsole.error = originalError;
    });

    test('should warn when webhook URL is missing for text notifications', async () => {
      const noWebhookConsoleExt = new ConsoleExt({
        phoneNumber: '+1234567890',
        enableText: true
      });
      
      const originalWarn = noWebhookConsoleExt.originalConsole.warn;
      noWebhookConsoleExt.originalConsole.warn = jest.fn();
      
      await noWebhookConsoleExt.sendTextMessage({
        type: 'test',
        message: 'test'
      });
      
      expect(noWebhookConsoleExt.originalConsole.warn).toHaveBeenCalledWith(
        'Console.ext: No webhook URL configured for text notifications'
      );
      
      noWebhookConsoleExt.originalConsole.warn = originalWarn;
      noWebhookConsoleExt.restore();
    });

    test('should warn when webhook URL is missing for call notifications', async () => {
      const noWebhookConsoleExt = new ConsoleExt({
        phoneNumber: '+1234567890',
        enableCall: true
      });
      
      const originalWarn = noWebhookConsoleExt.originalConsole.warn;
      noWebhookConsoleExt.originalConsole.warn = jest.fn();
      
      await noWebhookConsoleExt.makeCall({
        type: 'critical',
        message: 'test'
      });
      
      expect(noWebhookConsoleExt.originalConsole.warn).toHaveBeenCalledWith(
        'Console.ext: No webhook URL configured for call notifications'
      );
      
      noWebhookConsoleExt.originalConsole.warn = originalWarn;
      noWebhookConsoleExt.restore();
    });
  });

  describe('DataDog Integration', () => {
    test('should send to DataDog when API key is provided', async () => {
      const dataDogConsoleExt = new ConsoleExt({
        dataDogApiKey: 'test-api-key',
        phoneNumber: '+1234567890'
      });
      
      global.fetch.mockResolvedValue({ ok: true });
      
      await dataDogConsoleExt.sendToDataDog({
        type: 'critical',
        message: 'test error',
        timestamp: '2024-01-01T00:00:00.000Z'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.datadoghq.com/api/v1/logs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'DD-API-KEY': 'test-api-key'
          },
          body: JSON.stringify({
            message: 'test error',
            level: 'error',
            timestamp: '2024-01-01T00:00:00.000Z',
            source: 'console-ext',
            tags: ['type:critical', 'source:console-ext']
          })
        }
      );
      
      dataDogConsoleExt.restore();
    });

    test('should not send to DataDog when API key is not provided', async () => {
      await consoleExt.sendToDataDog({
        type: 'info',
        message: 'test'
      });
      
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('datadoghq.com'),
        expect.any(Object)
      );
    });

    test('should map critical type to error level in DataDog', async () => {
      const dataDogConsoleExt = new ConsoleExt({
        dataDogApiKey: 'test-key'
      });
      
      await dataDogConsoleExt.sendToDataDog({
        type: 'critical',
        message: 'test'
      });
      
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.level).toBe('error');
      
      dataDogConsoleExt.restore();
    });

    test('should map non-critical types to info level in DataDog', async () => {
      const dataDogConsoleExt = new ConsoleExt({
        dataDogApiKey: 'test-key'
      });
      
      await dataDogConsoleExt.sendToDataDog({
        type: 'text',
        message: 'test'
      });
      
      const lastCall = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.level).toBe('info');
      
      dataDogConsoleExt.restore();
    });
  });

  describe('Urgent Notifications', () => {
    test('should make call for urgent notifications when enabled', async () => {
      consoleExt.config.enableCall = true;
      const makeCallSpy = jest.spyOn(consoleExt, 'makeCall');
      
      await consoleExt.sendNotification('urgent', 'Urgent issue');
      
      expect(makeCallSpy).toHaveBeenCalled();
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