const { 
  defaultConfig, 
  productionConfig, 
  developmentConfig, 
  createConfig 
} = require('../src/config');

describe('Configuration', () => {
  describe('Default Configuration', () => {
    test('should have expected default values', () => {
      expect(defaultConfig.phoneNumber).toBeNull();
      expect(defaultConfig.webhookUrl).toBeNull();
      expect(defaultConfig.enableText).toBe(false);
      expect(defaultConfig.enableCall).toBe(false);
      expect(defaultConfig.criticalKeywords).toContain('error');
      expect(defaultConfig.criticalKeywords).toContain('fatal');
      expect(defaultConfig.criticalKeywords).toContain('critical');
    });

    test('should include comprehensive critical keywords', () => {
      const expectedKeywords = [
        'error', 'fatal', 'critical', 'exception', 'crash', 'fail',
        'timeout', 'unauthorized', 'forbidden', 'server error', 
        'database error', 'connection lost'
      ];
      
      expectedKeywords.forEach(keyword => {
        expect(defaultConfig.criticalKeywords).toContain(keyword);
      });
    });
  });

  describe('Production Configuration', () => {
    test('should enable notifications in production', () => {
      expect(productionConfig.enableText).toBe(true);
      expect(productionConfig.enableCall).toBe(true);
      expect(productionConfig.logLevel).toBe('error');
    });

    test('should inherit from default configuration', () => {
      expect(productionConfig.phoneNumber).toBe(defaultConfig.phoneNumber);
      expect(productionConfig.criticalKeywords).toEqual(defaultConfig.criticalKeywords);
    });
  });

  describe('Development Configuration', () => {
    test('should disable notifications in development', () => {
      expect(developmentConfig.enableText).toBe(false);
      expect(developmentConfig.enableCall).toBe(false);
      expect(developmentConfig.logLevel).toBe('debug');
    });

    test('should inherit from default configuration', () => {
      expect(developmentConfig.phoneNumber).toBe(defaultConfig.phoneNumber);
      expect(developmentConfig.criticalKeywords).toEqual(defaultConfig.criticalKeywords);
    });
  });

  describe('createConfig function', () => {
    test('should create default config when no preset specified', () => {
      const config = createConfig();
      
      expect(config).toEqual(defaultConfig);
    });

    test('should create production config', () => {
      const config = createConfig('production');
      
      expect(config.enableText).toBe(true);
      expect(config.enableCall).toBe(true);
      expect(config.logLevel).toBe('error');
    });

    test('should create development config', () => {
      const config = createConfig('development');
      
      expect(config.enableText).toBe(false);
      expect(config.enableCall).toBe(false);
      expect(config.logLevel).toBe('debug');
    });

    test('should apply overrides to preset config', () => {
      const config = createConfig('production', {
        phoneNumber: '+1234567890',
        enableCall: false,
        customSetting: 'test'
      });
      
      expect(config.phoneNumber).toBe('+1234567890');
      expect(config.enableText).toBe(true); // From production preset
      expect(config.enableCall).toBe(false); // Overridden
      expect(config.customSetting).toBe('test'); // Custom addition
    });

    test('should fallback to default for unknown preset', () => {
      const config = createConfig('unknown-preset');
      
      expect(config).toEqual(defaultConfig);
    });

    test('should handle overrides without preset', () => {
      const config = createConfig(undefined, {
        phoneNumber: '+1234567890',
        enableText: true
      });
      
      expect(config.phoneNumber).toBe('+1234567890');
      expect(config.enableText).toBe(true);
      expect(config.enableCall).toBe(false); // From default
    });
  });

  describe('Configuration Immutability', () => {
    test('should not modify original config when creating new config', () => {
      const originalDefault = { ...defaultConfig };
      
      createConfig('default', { phoneNumber: '+1234567890' });
      
      expect(defaultConfig).toEqual(originalDefault);
    });

    test('should create independent config objects', () => {
      const config1 = createConfig('default', { phoneNumber: '+1111111111' });
      const config2 = createConfig('default', { phoneNumber: '+2222222222' });
      
      expect(config1.phoneNumber).toBe('+1111111111');
      expect(config2.phoneNumber).toBe('+2222222222');
      expect(config1.phoneNumber).not.toBe(config2.phoneNumber);
    });
  });

  describe('Configuration Validation', () => {
    test('should handle empty overrides', () => {
      const config = createConfig('default', {});
      
      expect(config).toEqual(defaultConfig);
    });

    test('should handle null overrides', () => {
      const config = createConfig('default', null);
      
      expect(config).toEqual(defaultConfig);
    });

    test('should handle undefined overrides', () => {
      const config = createConfig('default', undefined);
      
      expect(config).toEqual(defaultConfig);
    });

    test('should preserve array references correctly', () => {
      const config = createConfig('default');
      
      expect(config.criticalKeywords).toEqual(defaultConfig.criticalKeywords);
      expect(config.criticalKeywords).not.toBe(defaultConfig.criticalKeywords); // Should be a copy
    });

    test('should handle config with no criticalKeywords', () => {
      const config = createConfig('default', { criticalKeywords: undefined });
      
      expect(config.criticalKeywords).toEqual(defaultConfig.criticalKeywords);
    });

    test('should preserve custom criticalKeywords array', () => {
      const customKeywords = ['custom', 'error'];
      const config = createConfig('default', { criticalKeywords: customKeywords });
      
      expect(config.criticalKeywords).toEqual(customKeywords);
      expect(config.criticalKeywords).not.toBe(customKeywords); // Should be a copy
    });
  });
});