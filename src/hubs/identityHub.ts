import { prisma } from '../lib/prisma';

export class IdentityHub {
  static async getUsers() { 
    if (!prisma) return [];
    const users = await prisma.user.findMany({
      where: { deletedAt: null }
    });
    
    // แปลง role จาก string ("admin,agent") เป็น array (["admin", "agent"])
    return users.map(user => ({
      ...user,
      role: user.role.split(',')
    }));
  }
  
  static async saveUser(data: any) { 
    if (!prisma) return null;
    
    // จัดการข้อมูล Role: ถ้าส่งมาเป็น Array ให้เชื่อมด้วยคอมม่า ถ้าเป็น String ให้ใช้ค่านั้นเลย
    const rolesString = Array.isArray(data.role) ? data.role.join(',') : data.role;

    // ถ้ามี ID มาด้วย ให้ทำการค้นหาและอัปเดตผ่าน ID
    if (data.id) {
      return await prisma.user.update({
        where: { id: data.id },
        data: {
          fullName: data.fullName,
          role: rolesString,
          tier: data.tier || undefined, // อัปเดตเฉพาะที่มีค่าส่งมา
          isActive: data.isActive !== undefined ? data.isActive : undefined
        }
      });
    }

    // กรณีไม่มี ID (เช่น การสร้าง User ใหม่) ให้ใช้ Upsert ผ่าน Username เหมือนเดิม
    return await prisma.user.upsert({
      where: { username: data.username },
      update: {
        fullName: data.fullName,
        role: rolesString,
        tier: data.tier || 'Standard',
        isActive: data.isActive !== undefined ? data.isActive : true
      },
      create: {
        username: data.username,
        fullName: data.fullName,
        password: data.password || 'password123',
        role: rolesString,
        tier: data.tier || 'Standard'
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
