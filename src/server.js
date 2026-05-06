require('dotenv').config();
const express = require('express');
const cors = require('cors');
const config = require('./config');

const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const checkoutRouter = require('./routes/checkout');

const app = express();

const allowedOrigins = [
  config.cors.origin,
  'https://famous-jalebi-490e12.netlify.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqué : ${origin}`));
  },
  credentials: true,
}));

// Le webhook Mollie envoie application/x-www-form-urlencoded, SumUp envoie JSON.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/checkout', checkoutRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: config.payment.provider,
    env: config.nodeEnv,
    time: new Date().toISOString(),
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: err.message || 'Erreur interne du serveur' });
});

app.listen(config.port, () => {
  console.log(`Cheirobom backend démarré sur le port ${config.port} (provider: ${config.payment.provider})`);
});

module.exports = app;
