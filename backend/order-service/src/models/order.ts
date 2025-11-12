import { z } from 'zod';

export const OrderStatus = z.enum([
  'pending', 'confirmed', 'preparing', 'delivering', 'completed', 'canceled'
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const CreateOrderSchema = z.object({
  restaurant_id: z.number().int().positive(),
  items: z.array(
    z.object({
      product_id: z.number().int().positive(),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative() // đơn giá tại thời điểm đặt
    })
  ).min(1),
  note: z.string().max(255).optional()
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateStatusSchema = z.object({
  status: OrderStatus
});
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
