const winston = require('winston');

class WinstonConsoleExt {
    constructor(config = {}) {
        this.logger = winston.createLogger({
            level: config.logLevel || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ 
                    filename: config.errorLogFile || 'console-ext-error.log', 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: config.combinedLogFile || 'console-ext-combined.log' 
                }),
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                })
            ]
        });

        this.ConsoleExt = require('./console-ext');
        this.consoleExt = new this.ConsoleExt({
            ...config,
            onNotification: this.logNotification.bind(this)
        });

        this.overrideWinstonMethods();
    }

    overrideWinstonMethods() {
        const originalError = this.logger.error.bind(this.logger);
        const originalWarn = this.logger.warn.bind(this.logger);
        
        this.logger.error = (...args) => {
            originalError(...args);
            this.checkForCriticalError(args.join(' '));
        };

        this.logger.warn = (...args) => {
            originalWarn(...args);
            this.checkForCriticalError(args.join(' '));
        };
    }

    checkForCriticalError(message) {
        const isCritical = this.consoleExt.config.criticalKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (isCritical) {
            this.consoleExt.sendNotification('critical', message);
        }
    }

    logNotification(type, message, delivered) {
        this.logger.info('Console.ext Notification', {
            type,
            message: message.substring(0, 200),
            delivered,
            timestamp: new Date().toISOString(),
            source: 'console-ext'
        });
    }

    getLogger() {
        return this.logger;
    }

    getConsoleExt() {
        return this.consoleExt;
    }
}

module.exports = WinstonConsoleExt;