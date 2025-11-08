export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  restockDate?: Date;
  updatedAt: Date;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
  restockDate?: Date;
}

export interface InventoryReservation {
  productId: string;
  quantity: number;
  reservationId: string;
}

export interface InventoryAlert {
  productId: string;
  currentQuantity: number;
  threshold: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
}