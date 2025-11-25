const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3008;

const demoBalances = {
  default: { amount: 250000, currency: 'VND' },
  premium: { amount: 640000, currency: 'VND' },
  vip: { amount: 1120000, currency: 'VND' },
};

app.get('/health', (_req, res) => {
  res.json({
    service: 'payment-service',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get('/balance', (req, res) => {
  const userId = String(req.query.userId || 'default');
  const tier = (req.query.tier && String(req.query.tier)) || undefined;

  const base =
    demoBalances[tier || userId] ||
    (tier === 'premium'
      ? demoBalances.premium
      : tier === 'vip'
      ? demoBalances.vip
      : demoBalances.default);

  res.json({
    balance: {
      userId,
      amount: base.amount,
      currency: base.currency,
      lastUpdated: new Date().toISOString(),
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: 'Not Found',
    path: req.path,
  });
});

app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
