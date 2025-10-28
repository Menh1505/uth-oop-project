import { User, CreateUserRequest, UpdateUserRequest } from '../models/User';

// Mock database - in production, replace with real database
let users: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com' },
];

export class UserService {
  static getAllUsers(): User[] {
    return users;
  }

  static getUserById(id: number): User | null {
    return users.find(user => user.id === id) || null;
  }

  static getUserByUsername(username: string): User | null {
    return users.find(user => user.username === username) || null;
  }

  static createUser(userData: CreateUserRequest): User {
    const newUser: User = {
      id: users.length + 1,
      ...userData,
    };
    users.push(newUser);
    return newUser;
  }

  static updateUser(id: number, updateData: UpdateUserRequest): User | null {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
    };
    return users[userIndex];
  }

  static deleteUser(id: number): boolean {
    const initialLength = users.length;
    users = users.filter(user => user.id !== id);
    return users.length < initialLength;
  }
}
