import { AddressRepository } from '../repositories/AddressRepository';
import { PreferencesRepository } from '../repositories/PreferencesRepository';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { Profile, UpdateProfilePayload } from '../models/User';

export class UserService {
  static async getProfile(userId: string) {
    const [p, prefs, addrs] = await Promise.all([
      ProfileRepository.getById(userId),
      PreferencesRepository.get(userId),
      AddressRepository.list(userId),
    ]);
    if (!p) return null;
    return { profile: p, preferences: prefs, addresses: addrs };
  }

  static async updateProfile(userId: string, data: UpdateProfilePayload) {
    const updated = await ProfileRepository.update(userId, data);
    return updated;
  }

  // Admin helpers (có thể thêm paging/filter tuỳ nhu cầu)
  static async listProfiles(limit = 50, offset = 0) {
    // đơn giản: chỉ trả id + name + created_at
    const q = await (await import('../config/database')).default.query(
      `SELECT id, full_name, created_at, updated_at FROM profiles ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return q.rows;
  }
}
