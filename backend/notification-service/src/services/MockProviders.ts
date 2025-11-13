import { Notification } from '../models/Notification';
import fs from 'fs';
import path from 'path';

const LOG_FILE = process.env.MOCK_PROVIDER_LOG_FILE || path.join(process.cwd(), 'notifications.log');

function logToFile(entry: any) {
	try {
		fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
	} catch (err) {
		// ignore file write errors in mock
		// console.error('MockProviders log error', err);
	}
}

export async function sendEmail(notification: Notification): Promise<void> {
	const entry = {
		channel: 'email',
		to: notification.to,
		subject: notification.subject,
		payload: notification.payload,
		time: new Date().toISOString()
	};
	console.log('[MockProviders] Sending EMAIL', entry);
	logToFile(entry);
	// simulate async delay
	await new Promise((res) => setTimeout(res, 200));
}

export async function sendSMS(notification: Notification): Promise<void> {
	const entry = {
		channel: 'sms',
		to: notification.to,
		payload: notification.payload,
		time: new Date().toISOString()
	};
	console.log('[MockProviders] Sending SMS', entry);
	logToFile(entry);
	await new Promise((res) => setTimeout(res, 150));
}

export async function sendPush(notification: Notification): Promise<void> {
	const entry = {
		channel: 'push',
		to: notification.to,
		subject: notification.subject,
		payload: notification.payload,
		time: new Date().toISOString()
	};
	console.log('[MockProviders] Sending PUSH', entry);
	logToFile(entry);
	await new Promise((res) => setTimeout(res, 100));
}

export default {
	sendEmail,
	sendSMS,
	sendPush
};
