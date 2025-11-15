import { Router } from 'express';
import { PartnerController } from '../controllers/PartnerController';
import { authenticateToken, requireAdmin, requirePartner } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/errorHandler';

const router = Router();
const partnerController = new PartnerController();

// ============= HEALTH CHECK =============
router.get('/health', partnerController.healthCheck);

// ============= PARTNER ROUTES =============
router.post('/partners', 
  authenticateToken,
  validateRequest(['business_name', 'business_type', 'tax_id', 'contact_person', 'contact_email', 'contact_phone']),
  partnerController.createPartner
);

router.get('/partners', authenticateToken, partnerController.getUserPartners);
router.get('/partners/:id', authenticateToken, partnerController.getPartner);
router.put('/partners/:id', authenticateToken, partnerController.updatePartner);

// ============= RESTAURANT ROUTES =============
router.post('/partners/:partnerId/restaurants',
  authenticateToken,
  requirePartner,
  validateRequest(['name', 'description', 'type', 'phone', 'email', 'address', 'city', 'latitude', 'longitude']),
  partnerController.createRestaurant
);

router.get('/partners/:partnerId/restaurants', authenticateToken, requirePartner, partnerController.getPartnerRestaurants);
router.get('/restaurants/search', partnerController.searchRestaurants); // Public endpoint
router.get('/restaurants/:id', authenticateToken, partnerController.getRestaurant);
router.put('/restaurants/:id', authenticateToken, requirePartner, partnerController.updateRestaurant);
router.patch('/restaurants/:id/status', authenticateToken, requirePartner, partnerController.updateRestaurantStatus);

// ============= MENU ROUTES =============  
router.post('/restaurants/:restaurantId/menu',
  authenticateToken,
  requirePartner,
  validateRequest(['name', 'description', 'category', 'base_price']),
  partnerController.createMenuItem
);

router.get('/restaurants/:restaurantId/menu', partnerController.getMenuItems); // Public endpoint
router.put('/menu/:id', authenticateToken, requirePartner, partnerController.updateMenuItem);
router.patch('/menu/:id/status', authenticateToken, requirePartner, partnerController.updateMenuItemStatus);

// ============= PROMOTION ROUTES =============
router.post('/restaurants/:restaurantId/promotions',
  authenticateToken,
  requirePartner,
  validateRequest(['name', 'description', 'type', 'discount_value', 'start_date', 'end_date']),
  partnerController.createPromotion
);

router.get('/restaurants/:restaurantId/promotions', authenticateToken, requirePartner, partnerController.getPromotions);
router.patch('/promotions/:id/status', authenticateToken, requirePartner, partnerController.updatePromotionStatus);

// ============= INVENTORY ROUTES =============
router.post('/restaurants/:restaurantId/inventory',
  authenticateToken,
  requirePartner,
  validateRequest(['menu_item_id', 'ingredient_name', 'current_stock', 'minimum_stock', 'maximum_stock', 'unit', 'cost_per_unit']),
  partnerController.createInventory
);

router.get('/restaurants/:restaurantId/inventory', authenticateToken, requirePartner, partnerController.getInventory);
router.get('/restaurants/:restaurantId/inventory/low-stock', authenticateToken, requirePartner, partnerController.checkLowStock);
router.get('/restaurants/:restaurantId/inventory/expiring', authenticateToken, requirePartner, partnerController.checkExpiringItems);

// ============= ANALYTICS ROUTES =============
router.get('/analytics/partners', authenticateToken, requirePartner, partnerController.getPartnerAnalytics);
router.get('/analytics/restaurants/:partnerId', authenticateToken, requirePartner, partnerController.getRestaurantAnalytics);

// ============= ADMIN ROUTES =============
router.get('/admin/partners', authenticateToken, requireAdmin, partnerController.getAllPartners);
router.get('/admin/analytics', authenticateToken, requireAdmin, partnerController.getGlobalAnalytics);

export default router;