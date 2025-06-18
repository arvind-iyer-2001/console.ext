const defaultConfig = {
    phoneNumber: null,
    webhookUrl: null,
    criticalKeywords: [
        'error',
        'fatal',
        'critical',
        'exception',
        'crash',
        'fail',
        'timeout',
        'unauthorized',
        'forbidden',
        'server error',
        'database error',
        'connection lost'
    ],
    enableText: false,
    enableCall: false,
    logLevel: 'info',
    maxRetries: 3,
    retryDelay: 1000
};

const productionConfig = {
    ...defaultConfig,
    enableText: true,
    enableCall: true,
    logLevel: 'error'
};

const developmentConfig = {
    ...defaultConfig,
    enableText: false,
    enableCall: false,
    logLevel: 'debug'
};

const configPresets = {
    default: defaultConfig,
    production: productionConfig,
    development: developmentConfig
};

function createConfig(preset = 'default', overrides = {}) {
    const baseConfig = configPresets[preset] || configPresets.default;
    return { 
        ...baseConfig, 
        ...(overrides || {}),
        criticalKeywords: [...(baseConfig.criticalKeywords || [])]
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        defaultConfig,
        productionConfig,
        developmentConfig,
        configPresets,
        createConfig
    };
}

if (typeof window !== 'undefined') {
    window.ConsoleExtConfig = {
        defaultConfig,
        productionConfig,
        developmentConfig,
        configPresets,
        createConfig
    };
}