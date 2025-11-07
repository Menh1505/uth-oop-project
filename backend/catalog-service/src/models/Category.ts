export interface Category {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  imageUrl?: string;
  parentId?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}