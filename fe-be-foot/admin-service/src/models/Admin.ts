export interface SystemInfo {
  service: string;
  version: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage: number;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastChecked: Date;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  systemHealth: ServiceHealth[];
}
