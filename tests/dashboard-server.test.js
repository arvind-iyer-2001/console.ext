const request = require('supertest');
const DashboardServer = require('../dashboard-server');
const ConsoleExt = require('../console-ext');

describe('DashboardServer', () => {
  let consoleExt;
  let dashboardServer;
  let server;

  beforeEach(() => {
    consoleExt = new ConsoleExt({
      phoneNumber: '+1234567890',
      webhookUrl: 'https://test-webhook.com',
      enableText: true
    });
    
    dashboardServer = new DashboardServer(consoleExt, 0); // Use port 0 for random available port
    dashboardServer.start();
    server = dashboardServer.server;
  });

  afterEach(() => {
    if (dashboardServer) {
      dashboardServer.stop();
    }
    if (consoleExt) {
      consoleExt.restore();
    }
  });

  describe('Dashboard Routes', () => {
    test('should serve dashboard at root path', async () => {
      const response = await request(server).get('/');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Console.ext Dashboard');
    });

    test('should serve dashboard at /dashboard path', async () => {
      const response = await request(server).get('/dashboard');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Console.ext Dashboard');
    });

    test('should return 404 for unknown routes', async () => {
      const response = await request(server).get('/unknown-route');
      
      expect(response.status).toBe(404);
      expect(response.text).toBe('Not Found');
    });
  });

  describe('API Routes', () => {
    test('should serve stats via API', async () => {
      // Generate some notifications
      console.error('Test error for stats');
      
      const response = await request(server).get('/api/stats');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('sent');
      expect(response.body).toHaveProperty('undelivered');
      expect(response.body).toHaveProperty('sentNotifications');
      expect(response.body).toHaveProperty('undeliveredNotifications');
    });

    test('should update configuration via POST', async () => {
      const newConfig = {
        phoneNumber: '+9876543210',
        enableText: false,
        rateLimitMax: 10
      };

      const response = await request(server)
        .post('/api/config')
        .send(newConfig);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
      
      // Verify configuration was updated
      expect(consoleExt.config.phoneNumber).toBe('+9876543210');
      expect(consoleExt.config.enableText).toBe(false);
      expect(consoleExt.config.rateLimitMax).toBe(10);
    });

    test('should handle invalid JSON in config update', async () => {
      const response = await request(server)
        .post('/api/config')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Invalid JSON' });
    });
  });

  describe('Dashboard Data Injection', () => {
    test('should inject console ext instance data into dashboard', async () => {
      const response = await request(server).get('/');
      
      expect(response.text).toContain('window.consoleExtInstance');
      expect(response.text).toContain('+1234567890');
      expect(response.text).toContain('https://test-webhook.com');
    });
  });

  describe('Configuration Serialization', () => {
    test('should return serializable configuration', () => {
      const config = dashboardServer.getSerializableConfig();
      
      expect(config).toHaveProperty('phoneNumber');
      expect(config).toHaveProperty('webhookUrl');
      expect(config).toHaveProperty('rateLimitMax');
      expect(config).toHaveProperty('enableText');
      expect(config).toHaveProperty('enableCall');
      
      // Should not contain functions or complex objects
      expect(typeof config.phoneNumber).toBe('string');
      expect(typeof config.enableText).toBe('boolean');
    });
  });
});