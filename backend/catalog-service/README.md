# Catalog Service

Product catalog management service for FitFood e-commerce platform.

## Features

- Product management (CRUD operations)
- Category management
- Inventory tracking
- Price management
- OpenTelemetry distributed tracing
- Prometheus metrics
- Grafana monitoring dashboards

## API Endpoints

### Products
- `GET /api/catalog/products` - Get all products
- `GET /api/catalog/products/:id` - Get product by ID
- `POST /api/catalog/products` - Create new product
- `PUT /api/catalog/products/:id` - Update product
- `DELETE /api/catalog/products/:id` - Delete product

### Categories
- `GET /api/catalog/categories` - Get all categories
- `GET /api/catalog/categories/:id` - Get category by ID
- `POST /api/catalog/categories` - Create new category
- `PUT /api/catalog/categories/:id` - Update category
- `DELETE /api/catalog/categories/:id` - Delete category

### Inventory
- `GET /api/catalog/inventory/:productId` - Get product inventory
- `PUT /api/catalog/inventory/:productId` - Update product inventory

## Environment Variables

```
PORT=3003
DATABASE_URL=postgresql://username:password@localhost:5432/catalog_db
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=your_jwt_secret
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
PROMETHEUS_PORT=9464
```

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```