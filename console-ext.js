class ConsoleExt {
    constructor(config = {}) {
        this.config = {
            phoneNumber: config.phoneNumber || null,
            webhookUrl: config.webhookUrl || null,
            criticalKeywords: config.criticalKeywords || ['error', 'fatal', 'critical', 'exception'],
            enableText: config.enableText || false,
            enableCall: config.enableCall || false,
            rateLimitWindow: config.rateLimitWindow || 60000,
            rateLimitMax: config.rateLimitMax || 5,
            dataDogApiKey: config.dataDogApiKey || null,
            ...config
        };
        
        this.originalConsole = { ...console };
        this.rateLimitTracker = new Map();
        this.undeliveredNotifications = [];
        this.sentNotifications = [];
        this.overrideConsole();
    }

    overrideConsole() {
        const self = this;
        
        console.log = function(...args) {
            self.originalConsole.log(...args);
            self.processMessage('log', args);
        };
        
        console.error = function(...args) {
            self.originalConsole.error(...args);
            self.processMessage('error', args);
        };
        
        console.warn = function(...args) {
            self.originalConsole.warn(...args);
            self.processMessage('warn', args);
        };
        
        console.text = function(...args) {
            self.originalConsole.log('[TEXT]', ...args);
            self.sendNotification('text', args.join(' '));
        };
    }

    processMessage(level, args) {
        const message = args.join(' ').toLowerCase();
        const isCritical = this.config.criticalKeywords.some(keyword => 
            message.includes(keyword.toLowerCase())
        );
        
        if (isCritical && (level === 'error' || level === 'warn')) {
            this.sendNotification('critical', args.join(' '));
        }
    }

    async sendNotification(type, message) {
        const timestamp = new Date().toISOString();
        const payload = {
            type,
            message,
            timestamp,
            source: 'Console.ext',
            id: this.generateId()
        };

        if (!this.shouldSendNotification(type)) {
            this.undeliveredNotifications.push({
                ...payload,
                reason: 'rate_limited',
                blockedAt: timestamp
            });
            return;
        }

        this.sentNotifications.push(payload);
        this.updateRateLimit(type);

        if (this.config.enableText && this.config.phoneNumber) {
            await this.sendTextMessage(payload);
        }
        
        if (this.config.enableCall && (type === 'critical' || type === 'urgent')) {
            await this.makeCall(payload);
        }
        
        if (this.config.webhookUrl) {
            await this.sendWebhook(payload);
        }

        if (this.config.dataDogApiKey) {
            await this.sendToDataDog(payload);
        }
    }

    async sendTextMessage(payload) {
        if (!this.config.webhookUrl) {
            console.warn('Console.ext: No webhook URL configured for text notifications');
            return;
        }
        
        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    action: 'send_text',
                    to: this.config.phoneNumber
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.originalConsole.error('Console.ext: Failed to send text notification:', error);
        }
    }

    async makeCall(payload) {
        if (!this.config.webhookUrl) {
            console.warn('Console.ext: No webhook URL configured for call notifications');
            return;
        }
        
        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...payload,
                    action: 'make_call',
                    to: this.config.phoneNumber
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.originalConsole.error('Console.ext: Failed to make call notification:', error);
        }
    }

    async sendWebhook(payload) {
        try {
            const response = await fetch(this.config.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            this.originalConsole.error('Console.ext: Failed to send webhook:', error);
        }
    }

    shouldSendNotification(type) {
        const now = Date.now();
        const key = `${type}_${this.config.phoneNumber}`;
        
        if (!this.rateLimitTracker.has(key)) {
            this.rateLimitTracker.set(key, []);
        }
        
        const timestamps = this.rateLimitTracker.get(key);
        const windowStart = now - this.config.rateLimitWindow;
        
        const recentNotifications = timestamps.filter(ts => ts > windowStart);
        this.rateLimitTracker.set(key, recentNotifications);
        
        return recentNotifications.length < this.config.rateLimitMax;
    }

    updateRateLimit(type) {
        const now = Date.now();
        const key = `${type}_${this.config.phoneNumber}`;
        const timestamps = this.rateLimitTracker.get(key) || [];
        timestamps.push(now);
        this.rateLimitTracker.set(key, timestamps);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async sendToDataDog(payload) {
        if (!this.config.dataDogApiKey) return;
        
        try {
            const response = await fetch('https://api.datadoghq.com/api/v1/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'DD-API-KEY': this.config.dataDogApiKey
                },
                body: JSON.stringify({
                    message: payload.message,
                    level: payload.type === 'critical' ? 'error' : 'info',
                    timestamp: payload.timestamp,
                    source: 'console-ext',
                    tags: [`type:${payload.type}`, 'source:console-ext']
                })
            });
            
            if (!response.ok) {
                throw new Error(`DataDog API error: ${response.status}`);
            }
        } catch (error) {
            this.originalConsole.error('Console.ext: Failed to send to DataDog:', error);
        }
    }

    getNotificationStats() {
        return {
            sent: this.sentNotifications.length,
            undelivered: this.undeliveredNotifications.length,
            sentNotifications: [...this.sentNotifications],
            undeliveredNotifications: [...this.undeliveredNotifications]
        };
    }

    clearStats() {
        this.sentNotifications = [];
        this.undeliveredNotifications = [];
        this.rateLimitTracker.clear();
    }

    restore() {
        Object.assign(console, this.originalConsole);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsoleExt;
}

if (typeof window !== 'undefined') {
    window.ConsoleExt = ConsoleExt;
}