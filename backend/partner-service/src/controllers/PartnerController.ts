import { Request, Response } from 'express';
import { PartnerService } from '../services/PartnerService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { 
  CreatePartnerRequest, UpdatePartnerRequest,
  CreateRestaurantRequest, UpdateRestaurantRequest,
  CreateMenuItemRequest, UpdateMenuItemRequest,
  CreatePromotionRequest, UpdatePromotionRequest,
  CreateInventoryRequest, UpdateInventoryRequest,
  PartnerFilters, RestaurantFilters, MenuItemFilters,
  PromotionFilters, InventoryFilters,
  RestaurantStatus, MenuItemStatus, PromotionStatus
} from '../models/Partner';

export class PartnerController {
  private partnerService: PartnerService;

  constructor() {
    this.partnerService = new PartnerService();
  }

  // ============= PARTNER MANAGEMENT =============

  createPartner = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const partnerData: CreatePartnerRequest = req.body;

      // Validate required fields
      if (!partnerData.business_name || !partnerData.business_type || 
          !partnerData.tax_id || !partnerData.contact_person || 
          !partnerData.contact_email || !partnerData.contact_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: business_name, business_type, tax_id, contact_person, contact_email, contact_phone'
        });
      }

      const partner = await this.partnerService.createPartner(userId, partnerData);
      
      return res.status(201).json({
        success: true,
        data: partner,
        message: 'Partner created successfully. Awaiting approval.'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create partner',
        message: error.message
      });
    }
  };

  getPartner = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const partner = await this.partnerService.getPartnerById(id, userId);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          error: 'Partner not found'
        });
      }

      return res.json({
        success: true,
        data: partner
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get partner',
        message: error.message
      });
    }
  };

  getUserPartners = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const filters: PartnerFilters = {
        status: req.query.status as any,
        business_type: req.query.business_type as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const partners = await this.partnerService.getPartnersByUser(userId, filters);
      
      res.json({
        success: true,
        data: partners,
        count: partners.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get partners',
        message: error.message
      });
    }
  };

  updatePartner = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData: UpdatePartnerRequest = req.body;

      const partner = await this.partnerService.updatePartner(id, userId, updateData);
      
      if (!partner) {
        return res.status(404).json({
          success: false,
          error: 'Partner not found'
        });
      }

      return res.json({
        success: true,
        data: partner,
        message: 'Partner updated successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update partner',
        message: error.message
      });
    }
  };

  // ============= RESTAURANT MANAGEMENT =============

  createRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { partnerId } = req.params;
      const userId = req.user!.userId;
      const restaurantData: CreateRestaurantRequest = req.body;

      // Validate required fields
      if (!restaurantData.name || !restaurantData.description || !restaurantData.type ||
          !restaurantData.phone || !restaurantData.email || !restaurantData.address ||
          !restaurantData.city || !restaurantData.latitude || !restaurantData.longitude) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, type, phone, email, address, city, latitude, longitude'
        });
      }

      const restaurant = await this.partnerService.createRestaurant(partnerId, userId, restaurantData);
      
      return res.status(201).json({
        success: true,
        data: restaurant,
        message: 'Restaurant created successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create restaurant',
        message: error.message
      });
    }
  };

  getRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const restaurant = await this.partnerService.getRestaurantById(id, userId);
      
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }

      return res.json({
        success: true,
        data: restaurant
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get restaurant',
        message: error.message
      });
    }
  };

  getPartnerRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { partnerId } = req.params;
      const userId = req.user!.userId;
      const filters: RestaurantFilters = {
        type: req.query.type as any,
        status: req.query.status as any,
        city: req.query.city as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const restaurants = await this.partnerService.getRestaurantsByPartner(partnerId, userId, filters);
      
      res.json({
        success: true,
        data: restaurants,
        count: restaurants.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get restaurants',
        message: error.message
      });
    }
  };

  searchRestaurants = async (req: Request, res: Response) => {
    try {
      const filters: RestaurantFilters = {
        type: req.query.type as any,
        city: req.query.city as string,
        district: req.query.district as string,
        min_rating: req.query.min_rating ? parseFloat(req.query.min_rating as string) : undefined,
        latitude: req.query.latitude ? parseFloat(req.query.latitude as string) : undefined,
        longitude: req.query.longitude ? parseFloat(req.query.longitude as string) : undefined,
        radius: req.query.radius ? parseFloat(req.query.radius as string) : undefined,
        search: req.query.search as string,
        features: req.query.features ? (req.query.features as string).split(',') : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const restaurants = await this.partnerService.searchRestaurants(filters);
      
      res.json({
        success: true,
        data: restaurants,
        count: restaurants.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to search restaurants',
        message: error.message
      });
    }
  };

  updateRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData: UpdateRestaurantRequest = req.body;

      const restaurant = await this.partnerService.updateRestaurant(id, userId, updateData);
      
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }

      return res.json({
        success: true,
        data: restaurant,
        message: 'Restaurant updated successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update restaurant',
        message: error.message
      });
    }
  };

  updateRestaurantStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;

      if (!Object.values(RestaurantStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid restaurant status'
        });
      }

      const restaurant = await this.partnerService.updateRestaurantStatus(id, userId, status);
      
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          error: 'Restaurant not found'
        });
      }

      return res.json({
        success: true,
        data: restaurant,
        message: `Restaurant status updated to ${status}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update restaurant status',
        message: error.message
      });
    }
  };

  // ============= MENU MANAGEMENT =============

  createMenuItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;
      const itemData: CreateMenuItemRequest = req.body;

      // Validate required fields
      if (!itemData.name || !itemData.description || !itemData.category || !itemData.base_price) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, category, base_price'
        });
      }

      const menuItem = await this.partnerService.createMenuItem(restaurantId, userId, itemData);
      
      return res.status(201).json({
        success: true,
        data: menuItem,
        message: 'Menu item created successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create menu item',
        message: error.message
      });
    }
  };

  getMenuItems = async (req: Request, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const filters: MenuItemFilters = {
        category: req.query.category as any,
        status: req.query.status as any,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        dietary_info: req.query.dietary_info ? (req.query.dietary_info as string).split(',') : undefined,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const menuItems = await this.partnerService.getMenuItems(restaurantId, filters);
      
      res.json({
        success: true,
        data: menuItems,
        count: menuItems.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get menu items',
        message: error.message
      });
    }
  };

  updateMenuItem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const updateData: UpdateMenuItemRequest = req.body;

      const menuItem = await this.partnerService.updateMenuItem(id, userId, updateData);
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      return res.json({
        success: true,
        data: menuItem,
        message: 'Menu item updated successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update menu item',
        message: error.message
      });
    }
  };

  updateMenuItemStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;

      if (!Object.values(MenuItemStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid menu item status'
        });
      }

      const menuItem = await this.partnerService.updateMenuItemStatus(id, userId, status);
      
      if (!menuItem) {
        return res.status(404).json({
          success: false,
          error: 'Menu item not found'
        });
      }

      return res.json({
        success: true,
        data: menuItem,
        message: `Menu item status updated to ${status}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update menu item status',
        message: error.message
      });
    }
  };

  // ============= PROMOTION MANAGEMENT =============

  createPromotion = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;
      const promotionData: CreatePromotionRequest = req.body;

      // Validate required fields
      if (!promotionData.name || !promotionData.description || !promotionData.type ||
          !promotionData.discount_value || !promotionData.start_date || !promotionData.end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, description, type, discount_value, start_date, end_date'
        });
      }

      const promotion = await this.partnerService.createPromotion(restaurantId, userId, promotionData);
      
      return res.status(201).json({
        success: true,
        data: promotion,
        message: 'Promotion created successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create promotion',
        message: error.message
      });
    }
  };

  getPromotions = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;
      const filters: PromotionFilters = {
        type: req.query.type as any,
        status: req.query.status as any,
        active_now: req.query.active_now === 'true',
        promo_code: req.query.promo_code as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const promotions = await this.partnerService.getPromotions(restaurantId, userId, filters);
      
      res.json({
        success: true,
        data: promotions,
        count: promotions.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get promotions',
        message: error.message
      });
    }
  };

  updatePromotionStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.userId;

      if (!Object.values(PromotionStatus).includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid promotion status'
        });
      }

      const updated = await this.partnerService.updatePromotionStatus(id, userId, status);
      
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Promotion not found'
        });
      }

      return res.json({
        success: true,
        message: `Promotion status updated to ${status}`
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update promotion status',
        message: error.message
      });
    }
  };

  // ============= INVENTORY MANAGEMENT =============

  createInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;
      const inventoryData: CreateInventoryRequest = req.body;

      // Validate required fields
      if (!inventoryData.menu_item_id || !inventoryData.ingredient_name ||
          inventoryData.current_stock === undefined || inventoryData.minimum_stock === undefined ||
          inventoryData.maximum_stock === undefined || !inventoryData.unit ||
          inventoryData.cost_per_unit === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: menu_item_id, ingredient_name, current_stock, minimum_stock, maximum_stock, unit, cost_per_unit'
        });
      }

      const inventory = await this.partnerService.createInventory(restaurantId, userId, inventoryData);
      
      return res.status(201).json({
        success: true,
        data: inventory,
        message: 'Inventory item created successfully'
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create inventory item',
        message: error.message
      });
    }
  };

  getInventory = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;
      const filters: InventoryFilters = {
        status: req.query.status as any,
        low_stock_only: req.query.low_stock_only === 'true',
        expiring_soon: req.query.expiring_soon === 'true',
        ingredient_name: req.query.ingredient_name as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const inventory = await this.partnerService.getInventory(restaurantId, userId, filters);
      
      res.json({
        success: true,
        data: inventory,
        count: inventory.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get inventory',
        message: error.message
      });
    }
  };

  checkLowStock = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;

      const lowStockItems = await this.partnerService.checkLowStock(restaurantId, userId);
      
      res.json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
        message: `Found ${lowStockItems.length} low stock items`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to check low stock',
        message: error.message
      });
    }
  };

  checkExpiringItems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { restaurantId } = req.params;
      const userId = req.user!.userId;

      const expiringItems = await this.partnerService.checkExpiringItems(restaurantId, userId);
      
      res.json({
        success: true,
        data: expiringItems,
        count: expiringItems.length,
        message: `Found ${expiringItems.length} expiring items`
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to check expiring items',
        message: error.message
      });
    }
  };

  // ============= ANALYTICS =============

  getPartnerAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const analytics = await this.partnerService.getPartnerAnalytics(userId, startDate, endDate);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get partner analytics',
        message: error.message
      });
    }
  };

  getRestaurantAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { partnerId } = req.params;
      const userId = req.user!.userId;

      const analytics = await this.partnerService.getRestaurantAnalytics(partnerId, userId);
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get restaurant analytics',
        message: error.message
      });
    }
  };

  // ============= ADMIN ENDPOINTS =============

  getAllPartners = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const filters: PartnerFilters = {
        status: req.query.status as any,
        business_type: req.query.business_type as string,
        search: req.query.search as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      // Get all partners (admin view) - would need to modify service method
      const partners = await this.partnerService.getPartnersByUser('', filters); // Empty userId for admin
      
      res.json({
        success: true,
        data: partners,
        count: partners.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get all partners',
        message: error.message
      });
    }
  };

  getGlobalAnalytics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // TODO: Add admin role check
      const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

      const analytics = await this.partnerService.getPartnerAnalytics(undefined, startDate, endDate); // No userId for global stats
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Failed to get global analytics',
        message: error.message
      });
    }
  };

  // ============= HEALTH CHECK =============

  healthCheck = async (req: Request, res: Response) => {
    res.json({
      service: 'partner-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        restaurant_management: 'available',
        menu_management: 'available',
        promotion_system: 'available',
        inventory_tracking: 'available',
        analytics: 'available'
      }
    });
  };
}