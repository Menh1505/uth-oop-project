import { Request, Response } from 'express';
import { CatalogService } from '../services/CatalogService';
import { CreateProductRequest, UpdateProductRequest, ProductSearchFilters } from '../models/Product';
import { CreateCategoryRequest, UpdateCategoryRequest } from '../models/Category';
import { UpdateInventoryRequest, InventoryReservation } from '../models/Inventory';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../middleware/errorHandler';

export class CatalogController {
  private catalogService: CatalogService;

  constructor() {
    this.catalogService = new CatalogService();
  }

  // Product endpoints
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    const filters: ProductSearchFilters = {
      categoryId: req.query.categoryId as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      search: req.query.search as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const products = await this.catalogService.getAllProducts(filters);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        count: products.length
      }
    });
  });

  getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const product = await this.catalogService.getProductById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: product
    });
  });

  createProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const productData: CreateProductRequest = req.body;
    
    // Validation
    if (!productData.name || !productData.description || !productData.price || !productData.categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description, price, categoryId',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (productData.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0',
        code: 'INVALID_PRICE'
      });
    }
    
    const product = await this.catalogService.createProduct(productData);
    
    return res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  });

  updateProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateProductRequest = req.body;
    
    if (updateData.price !== undefined && updateData.price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0',
        code: 'INVALID_PRICE'
      });
    }
    
    const product = await this.catalogService.updateProduct(id, updateData);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  });

  deleteProduct = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const deleted = await this.catalogService.deleteProduct(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  });

  // Category endpoints
  getCategories = asyncHandler(async (req: Request, res: Response) => {
    const categories = await this.catalogService.getAllCategories();
    
    res.json({
      success: true,
      data: categories
    });
  });

  getCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const category = await this.catalogService.getCategoryById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: category
    });
  });

  createCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const categoryData: CreateCategoryRequest = req.body;
    
    if (!categoryData.name || !categoryData.description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    const category = await this.catalogService.createCategory(categoryData);
    
    return res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  });

  updateCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updateData: UpdateCategoryRequest = req.body;
    
    const category = await this.catalogService.updateCategory(id, updateData);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  });

  deleteCategory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    const deleted = await this.catalogService.deleteCategory(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  });

  // Inventory endpoints
  getInventory = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    
    const inventory = await this.catalogService.getProductInventory(productId);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found for this product',
        code: 'INVENTORY_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: inventory
    });
  });

  updateInventory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { productId } = req.params;
    const updateData: UpdateInventoryRequest = req.body;
    
    if (updateData.quantity !== undefined && updateData.quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantity cannot be negative',
        code: 'INVALID_QUANTITY'
      });
    }

    if (updateData.reservedQuantity !== undefined && updateData.reservedQuantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Reserved quantity cannot be negative',
        code: 'INVALID_RESERVED_QUANTITY'
      });
    }
    
    const inventory = await this.catalogService.updateProductInventory(productId, updateData);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found for this product',
        code: 'INVENTORY_NOT_FOUND'
      });
    }
    
    return res.json({
      success: true,
      data: inventory,
      message: 'Inventory updated successfully'
    });
  });

  reserveInventory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const reservations: InventoryReservation[] = req.body.reservations;
    
    if (!Array.isArray(reservations) || reservations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Reservations array is required',
        code: 'MISSING_RESERVATIONS'
      });
    }

    // Validate each reservation
    for (const reservation of reservations) {
      if (!reservation.productId || !reservation.quantity || !reservation.reservationId) {
        return res.status(400).json({
          success: false,
          error: 'Each reservation must have productId, quantity, and reservationId',
          code: 'INVALID_RESERVATION_DATA'
        });
      }

      if (reservation.quantity <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Reservation quantity must be greater than 0',
          code: 'INVALID_RESERVATION_QUANTITY'
        });
      }
    }
    
    const success = await this.catalogService.reserveInventory(reservations);
    
    if (!success) {
      return res.status(409).json({
        success: false,
        error: 'Insufficient inventory for one or more products',
        code: 'INSUFFICIENT_INVENTORY'
      });
    }
    
    return res.json({
      success: true,
      message: 'Inventory reserved successfully',
      data: { reservations }
    });
  });

  // Health check endpoint
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'catalog-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });
}