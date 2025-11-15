import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationEvent } from '../models/Notification';
import MockProviders from './MockProviders';

export class NotificationService {
	private store: Map<string, Notification> = new Map();

	async create(notification: Omit<Notification, 'id' | 'createdAt' | 'status' | 'attemptCount'>) {
		const id = uuidv4();
		const now = new Date().toISOString();
		const n: Notification = {
			id,
			type: notification.type,
			to: notification.to,
			subject: notification.subject,
			payload: notification.payload,
			status: 'pending',
			createdAt: now,
			attemptCount: 0,
			meta: notification.meta || {}
		};
		this.store.set(id, n);
		return n;
	}

	async list() {
		return Array.from(this.store.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
	}

	async get(id: string) {
		return this.store.get(id) || null;
	}

	async update(id: string, patch: Partial<Notification>) {
		const existing = this.store.get(id);
		if (!existing) return null;
		const merged = { ...existing, ...patch } as Notification;
		this.store.set(id, merged);
		return merged;
	}

	async remove(id: string) {
		const existed = this.store.delete(id);
		return existed;
	}

	async send(notificationId: string) {
		const n = this.store.get(notificationId);
		if (!n) throw new Error('Notification not found');

		n.attemptCount = (n.attemptCount || 0) + 1;
		try {
			if (n.type === 'email') await MockProviders.sendEmail(n);
			else if (n.type === 'sms') await MockProviders.sendSMS(n);
			else if (n.type === 'push') await MockProviders.sendPush(n);

			n.status = 'sent';
			n.sentAt = new Date().toISOString();
		} catch (err) {
			n.status = 'failed';
			n.meta = { ...(n.meta || {}), lastError: String(err) };
		}
		this.store.set(n.id, n);
		return n;
	}

	// Simple mapping from an event to a notification - can be extended
	async handleEvent(event: NotificationEvent) {
		// Example mappings
		if (event.eventType === 'order.created') {
			const n = await this.create({
				type: 'email',
				to: event.payload.customerEmail || event.payload.customer?.email || 'unknown@example.com',
				subject: `Order ${event.payload.orderId} received`,
				payload: {
					title: 'Order received',
					body: `We received your order ${event.payload.orderId}`,
					data: event.payload
				},
				meta: { sourceEvent: event.eventType }
			} as any);
			await this.send(n.id);
			return n;
		}

		if (event.eventType === 'delivery.assigned') {
			// send push to driver
			const n = await this.create({
				type: 'push',
				to: event.payload.driverDeviceToken || event.payload.driver?.deviceToken || 'driver-token',
				subject: 'New delivery assigned',
				payload: {
					title: 'New delivery',
					body: `You have been assigned delivery ${event.payload.deliveryId}`,
					data: event.payload
				},
				meta: { sourceEvent: event.eventType }
			} as any);
			await this.send(n.id);
			return n;
		}

		// Default: create an email to admin
		const n = await this.create({
			type: 'email',
			to: process.env.ADMIN_EMAIL || 'admin@example.com',
			subject: `Event ${event.eventType}`,
			payload: { title: event.eventType, body: JSON.stringify(event.payload), data: event.payload },
			meta: { sourceEvent: event.eventType }
		} as any);
		await this.send(n.id);
		return n;
	}
}

export default new NotificationService();
