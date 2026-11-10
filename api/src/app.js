const express = require('express');
const cors = require('cors');
const client = require('@prometheus-io/client');
const Product = require('./models/Product');

const app = express();
const metrics = new client.Registry();

client.collectDefaultMetrics({ register: metrics });

const requestCounter = new client.Counter({
  name: 'shopeasy_http_requests_total',
  help: 'Total number of HTTP requests handled by ShopEasy.',
  labelNames: ['method', 'route', 'status'],
  registers: [metrics]
});

const requestDuration = new client.Histogram({
  name: 'shopeasy_http_request_duration_seconds',
  help: 'Duration of HTTP requests handled by ShopEasy in seconds.',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metrics]
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (req.path === '/api/metrics') return next();

  const endTimer = requestDuration.startTimer();
  res.on('finish', () => {
    const labels = {
      method: req.method,
      route: req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched',
      status: String(res.statusCode)
    };

    requestCounter.inc(labels);
    endTimer(labels);
  });

  next();
});

app.get('/api/metrics', async (_req, res) => {
  res.set('Content-Type', metrics.contentType);
  res.end(await metrics.metrics());
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

module.exports = app;
