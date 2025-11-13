export type NotificationType = 'email' | 'sms' | 'push';

export type NotificationStatus = 'pending' | 'sent' | 'failed';

export interface NotificationPayload {
	title?: string;
	body?: string;
	data?: Record<string, any>;
}

export interface Notification {
	id: string;
	type: NotificationType;
	to: string; // email address, phone number, or device token
	subject?: string; // for email / push
	payload: NotificationPayload;
	status: NotificationStatus;
	createdAt: string;
	sentAt?: string | null;
	attemptCount: number;
	meta?: Record<string, any>;
}

export interface NotificationEvent {
	eventType: string;
	payload: Record<string, any>;
}
