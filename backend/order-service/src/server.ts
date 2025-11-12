import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`order-service listening on ${config.port}`);
});
