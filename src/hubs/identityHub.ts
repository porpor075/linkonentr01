import { prisma } from '../lib/prisma';

export class IdentityHub {
  static async getUsers() { 
    if (!prisma) return [];
    return await prisma.user.findMany({
      where: { deletedAt: null }
    });
  }
  
  static async saveUser(data: any) { 
    if (!prisma) return null;
    return await prisma.user.upsert({
      where: { username: data.username },
      update: {
        fullName: data.fullName,
        role: Array.isArray(data.role) ? data.role[0] : data.role,
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      create: {
        username: data.username,
        fullName: data.fullName,
        password: data.password || 'password123',
        role: Array.isArray(data.role) ? data.role[0] : data.role
      }
    });
  }

  static async deleteUser(id: string) {
    if (!prisma) return null;
    return await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
}
