import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { metricsMiddleware } from '../middleware/metricsMiddleware';

const router = Router();
const catalogController = new CatalogController();

// Apply metrics middleware to all routes
router.use(metricsMiddleware);

// Public routes (no authentication required)
router.get('/health', catalogController.healthCheck);
router.get('/products', catalogController.getProducts);
router.get('/products/:id', catalogController.getProduct);
router.get('/categories', catalogController.getCategories);
router.get('/categories/:id', catalogController.getCategory);
router.get('/inventory/:productId', catalogController.getInventory);

// Protected routes (authentication required)
// Admin and manager can create/update/delete products and categories
router.post('/products', 
  authMiddleware, 
  requireRole(['admin', 'manager']), 
  catalogController.createProduct
);

router.put('/products/:id', 
  authMiddleware, 
  requireRole(['admin', 'manager']), 
  catalogController.updateProduct
);

router.delete('/products/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  catalogController.deleteProduct
);

router.post('/categories', 
  authMiddleware, 
  requireRole(['admin', 'manager']), 
  catalogController.createCategory
);

router.put('/categories/:id', 
  authMiddleware, 
  requireRole(['admin', 'manager']), 
  catalogController.updateCategory
);

router.delete('/categories/:id', 
  authMiddleware, 
  requireRole(['admin']), 
  catalogController.deleteCategory
);

// Inventory management routes
router.put('/inventory/:productId', 
  authMiddleware, 
  requireRole(['admin', 'manager', 'inventory']), 
  catalogController.updateInventory
);

router.post('/inventory/reserve', 
  authMiddleware, 
  requireRole(['admin', 'manager', 'order-service']), 
  catalogController.reserveInventory
);

export default router;