const http = require('http');
const fs = require('fs');
const path = require('path');

class DashboardServer {
    constructor(consoleExtInstance, port = 3000) {
        this.consoleExt = consoleExtInstance;
        this.port = port;
        this.server = null;
    }

    start() {
        this.server = http.createServer((req, res) => {
            const url = req.url;
            
            if (url === '/' || url === '/dashboard') {
                this.serveDashboard(res);
            } else if (url === '/api/stats') {
                this.serveStats(res);
            } else if (url === '/api/config' && req.method === 'POST') {
                this.updateConfig(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });

        this.server.listen(this.port, () => {
            console.log(`Console.ext Dashboard running at http://localhost:${this.port}`);
        });
    }

    serveDashboard(res) {
        const dashboardPath = path.join(__dirname, 'dashboard.html');
        fs.readFile(dashboardPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading dashboard');
                return;
            }
            
            const modifiedData = data.replace(
                'let consoleExt = null;',
                `let consoleExt = ${JSON.stringify(this.getSerializableConfig())};
                 window.consoleExtInstance = {
                     config: consoleExt,
                     getNotificationStats: () => (${JSON.stringify(this.consoleExt.getNotificationStats())}),
                     clearStats: () => fetch('/api/clear-stats', {method: 'POST'})
                 };`
            );
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(modifiedData);
        });
    }

    serveStats(res) {
        const stats = this.consoleExt.getNotificationStats();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    }

    updateConfig(req, res) {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const config = JSON.parse(body);
                Object.assign(this.consoleExt.config, config);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }

    getSerializableConfig() {
        return {
            phoneNumber: this.consoleExt.config.phoneNumber,
            webhookUrl: this.consoleExt.config.webhookUrl,
            rateLimitMax: this.consoleExt.config.rateLimitMax,
            enableText: this.consoleExt.config.enableText,
            enableCall: this.consoleExt.config.enableCall
        };
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log('Dashboard server stopped');
        }
    }
}

module.exports = DashboardServer;