jest.mock('./models/Product', () => ({
  find: jest.fn()
}));

const request = require('supertest');
const Product = require('./models/Product');
const app = require('./app');

describe('ShopEasy API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('reports healthy status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('exposes Prometheus metrics without recording the scrape itself', async () => {
    await request(app).get('/api/health');

    const response = await request(app).get('/api/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/plain/);
    expect(response.text).toContain('# HELP shopeasy_http_requests_total');
    expect(response.text).toMatch(/shopeasy_http_requests_total\{method="GET",route="\/api\/health",status="200"\} [1-9]\d*/);
    expect(response.text).not.toContain('route="/api/metrics"');
  });

  test('returns products from the catalog', async () => {
    const products = [{ name: 'Everyday Backpack', price: 39.99 }];
    Product.find.mockResolvedValue(products);

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(products);
  });

  test('reports a database failure as a server error', async () => {
    Product.find.mockRejectedValue(new Error('database unavailable'));
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'An unexpected server error occurred.' });
    errorLog.mockRestore();
  });
});
