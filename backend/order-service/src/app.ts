// src/app.ts
import express from 'express';
import pinoHttpModule from 'pino-http'; // pino-http có d.ts kiểu `export =`
                                         // nên trong NodeNext đôi khi TS không coi là callable

const pinoHttp = (pinoHttpModule as unknown as (opts?: unknown) => any);

const app = express();
app.use(express.json());
app.use(pinoHttp()); // middleware chạy được, yên tâm

app.get('/health', (_req, res) => res.send('ok'));
export default app;
