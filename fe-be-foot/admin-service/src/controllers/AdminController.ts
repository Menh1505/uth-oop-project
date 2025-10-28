import { Response } from 'express';
import { AdminService } from '../services/AdminService';
import { AdminRequest } from '../middleware/adminMiddleware';

export class AdminController {
  static async getSystemInfo(req: AdminRequest, res: Response): Promise<void> {
    try {
      const systemInfo = AdminService.getSystemInfo();
      res.json(systemInfo);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get system info' });
    }
  }

  static async getServiceHealth(req: AdminRequest, res: Response): Promise<void> {
    try {
      const healthData = await AdminService.getAllServiceHealth();
      res.json(healthData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to check service health' });
    }
  }

  static async getUsers(req: AdminRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      const users = await AdminService.getUsersFromUserService(token);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }

  static async deleteUser(req: AdminRequest, res: Response): Promise<void> {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      const deleted = await AdminService.deleteUserFromUserService(userId, token);
      if (!deleted) {
        res.status(404).json({ message: 'User not found or failed to delete' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }

  static async getAdminStats(req: AdminRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      const stats = await AdminService.getAdminStats(token);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get admin stats' });
    }
  }

  static async getDashboard(req: AdminRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).send('<h1>Unauthorized</h1><p>No token provided</p>');
        return;
      }

      // Get data for dashboard
      const [systemInfo, healthData, users, stats] = await Promise.all([
        AdminService.getSystemInfo(),
        AdminService.getAllServiceHealth(),
        AdminService.getUsersFromUserService(token).catch(() => []),
        AdminService.getAdminStats(token).catch(() => ({}))
      ]);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - FitFood</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-card h3 { color: #2c3e50; margin-bottom: 10px; }
        .stat-value { font-size: 2em; font-weight: bold; color: #e74c3c; }
        .section { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .section h2 { color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ecf0f1; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-healthy { color: #27ae60; }
        .status-unhealthy { color: #e74c3c; }
        .btn { background: #3498db; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .btn:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .actions { display: flex; gap: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏋️ FitFood Admin Dashboard</h1>
            <p>Welcome back, Admin!</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 Total Users</h3>
                <div class="stat-value">${(stats as any).totalUsers || 'N/A'}</div>
            </div>
            <div class="stat-card">
                <h3>🟢 Healthy Services</h3>
                <div class="stat-value">${Object.values(healthData).filter((h: any) => h.status === 'healthy').length}/${Object.keys(healthData).length}</div>
            </div>
            <div class="stat-card">
                <h3>⚡ System Load</h3>
                <div class="stat-value">${systemInfo.cpuUsage ? Math.round(systemInfo.cpuUsage * 100) / 100 + '%' : 'N/A'}</div>
            </div>
            <div class="stat-card">
                <h3>💾 Memory Usage</h3>
                <div class="stat-value">${systemInfo.memoryUsage ? Math.round(systemInfo.memoryUsage.heapUsed / 1024 / 1024) + 'MB' : 'N/A'}</div>
            </div>
        </div>

        <div class="section">
            <h2>🔍 Service Health</h2>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Response Time</th>
                        <th>Last Check</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(healthData).map(([service, health]: [string, any]) => `
                        <tr>
                            <td>${service}</td>
                            <td class="${health.status === 'healthy' ? 'status-healthy' : 'status-unhealthy'}">${health.status}</td>
                            <td>${health.responseTime || 'N/A'}ms</td>
                            <td>${new Date(health.lastCheck).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>👥 User Management</h2>
            <div style="margin-bottom: 15px;">
                <a href="#refresh" class="btn" onclick="location.reload()">🔄 Refresh</a>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map((user: any) => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role || 'user'}</td>
                            <td class="actions">
                                <button class="btn btn-danger" onclick="deleteUser(${user.id})">🗑️ Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>⚙️ System Information</h2>
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(systemInfo, null, 2)}</pre>
        </div>
    </div>

    <script>
        async function deleteUser(userId) {
            if (!confirm('Are you sure you want to delete this user?')) return;

            try {
                const response = await fetch('/admin/users/' + userId, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': '${req.headers.authorization}'
                    }
                });

                if (response.ok) {
                    alert('User deleted successfully');
                    location.reload();
                } else {
                    alert('Failed to delete user');
                }
            } catch (error) {
                alert('Error deleting user');
            }
        }
    </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      res.status(500).send('<h1>Server Error</h1><p>Failed to load dashboard</p>');
    }
  }
}
