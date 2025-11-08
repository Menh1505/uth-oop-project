import axios from 'axios';
import { SystemInfo, ServiceHealth, AdminStats } from '../models/Admin';
import { serviceConfig } from '../config/config';

export class AdminService {
  static getSystemInfo(): SystemInfo {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      service: 'admin-service',
      version: '1.0.0',
      uptime,
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
      },
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
    };
  }

  static async checkServiceHealth(serviceName: string, url: string): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const response = await axios.get(`${url}/health`, { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        name: serviceName,
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: serviceName,
        status: 'unhealthy',
        lastChecked: new Date(),
      };
    }
  }

  static async getAllServiceHealth(): Promise<ServiceHealth[]> {
    const services = [
      { name: 'auth-service', url: serviceConfig.authServiceUrl },
      { name: 'user-service', url: serviceConfig.userServiceUrl },
      { name: 'admin-service', url: `http://localhost:${serviceConfig.port}` },
    ];

    const healthChecks = services.map(service =>
      this.checkServiceHealth(service.name, service.url)
    );

    return Promise.all(healthChecks);
  }

  static async getUsersFromUserService(token: string): Promise<any[]> {
    try {
      const response = await axios.get(`${serviceConfig.userServiceUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch users from user service:', error);
      return [];
    }
  }

  static async deleteUserFromUserService(userId: number, token: string): Promise<boolean> {
    try {
      await axios.delete(`${serviceConfig.userServiceUrl}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete user from user service:', error);
      return false;
    }
  }

  static async getAdminStats(token: string): Promise<AdminStats> {
    const users = await this.getUsersFromUserService(token);
    const systemHealth = await this.getAllServiceHealth();

    return {
      totalUsers: users.length,
      activeUsers: users.length, // Assuming all users are active for now
      systemHealth,
    };
  }
}
