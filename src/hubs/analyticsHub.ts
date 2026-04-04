import { DataStore } from '../lib/store';
import { PolicyHub } from './policyHub';
import { prisma } from '../lib/prisma';

export class AnalyticsHub {
  static getAllCommissions() { return DataStore.read<any>('commissions.json'); }
  static saveCommissions(data: any[]) { DataStore.write('commissions.json', data); }
  
  static async getRate(productId: string, userId: string): Promise<number> {
    const comms = this.getAllCommissions();
    
    // 1. เช็คเรทเฉพาะบุคคล (Highest Priority)
    const individualOverride = comms.find((c: any) => c.productId === productId && c.userId === userId);
    if (individualOverride) return individualOverride.commissionRate;
    
    // 2. เช็คเรทตามกลุ่ม (Tier)
    if (prisma) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { tier: true } });
      if (user?.tier) {
        const tierOverride = comms.find((c: any) => c.productId === productId && c.tierId === user.tier);
        if (tierOverride) return tierOverride.commissionRate;
      }
    }
    
    // 3. ค่ามาตรฐาน (Default)
    const defaultRate = comms.find((c: any) => c.productId === productId && c.userId === 'default');
    return defaultRate ? defaultRate.commissionRate : 0;
  }

  // --- ฟังก์ชันสำหรับ Sales Analytics ---
  static getSalesAnalytics() {
    const policies = PolicyHub.getPolicies();
    
    // 1. สรุปยอดรวม (KPIs)
    const successPolicies = policies.filter((p: any) => p.status === 'SUCCESS' || p.status === 'success');
    const pendingPolicies = policies.filter((p: any) => p.status === 'PENDING_ADMIN');
    
    const totalVolume = successPolicies.reduce((acc: number, p: any) => acc + (p.premiumAmount || 0), 0);
    const totalCommission = successPolicies.reduce((acc: number, p: any) => acc + (p.commissionAmount || 0), 0);

    // 2. สัดส่วนยอดขายแบ่งตามบริษัทประกัน (Insurer Share)
    const salesByInsurer = successPolicies.reduce((acc: any, p: any) => {
      const insurerName = p.plan?.insurer?.nameTh || 'Unknown';
      if (!acc[insurerName]) acc[insurerName] = { count: 0, volume: 0 };
      acc[insurerName].count += 1;
      acc[insurerName].volume += (p.premiumAmount || 0);
      return acc;
    }, {});

    // 3. ยอดขายรายเดือน (Monthly Trend)
    const monthlyTrend = successPolicies.reduce((acc: any, p: any) => {
      const date = new Date(p.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthYear]) acc[monthYear] = { volume: 0, commission: 0, count: 0 };
      acc[monthYear].volume += (p.premiumAmount || 0);
      acc[monthYear].commission += (p.commissionAmount || 0);
      acc[monthYear].count += 1;
      return acc;
    }, {});

    return {
      kpis: {
        totalPolicies: policies.length,
        successPolicies: successPolicies.length,
        pendingPolicies: pendingPolicies.length,
        totalVolume,
        totalCommission,
        successRate: policies.length > 0 ? Math.round((successPolicies.length / policies.length) * 100) : 0
      },
      salesByInsurer: Object.entries(salesByInsurer).map(([name, data]: any) => ({ name, ...data })),
      monthlyTrend: Object.entries(monthlyTrend).map(([month, data]: any) => ({ month, ...data })).sort((a, b) => a.month.localeCompare(b.month))
    };
  }

  // --- ฟังก์ชันสำหรับ Financial & Agent Performance ---
  static getFinancialReporting() {
    const policies = PolicyHub.getPolicies().filter((p: any) => p.status === 'SUCCESS');
    
    // ผลงานรายบุคคล (Agent Performance)
    const agentPerformance = policies.reduce((acc: any, p: any) => {
      const agentName = p.quotation?.user?.fullName || 'Unknown Agent';
      if (!acc[agentName]) acc[agentName] = { count: 0, volume: 0, commission: 0 };
      acc[agentName].count += 1;
      acc[agentName].volume += (p.premiumAmount || 0);
      acc[agentName].commission += (p.commissionAmount || 0);
      return acc;
    }, {});

    return {
      agentPerformance: Object.entries(agentPerformance)
        .map(([name, data]: any) => ({ name, ...data }))
        .sort((a, b) => b.volume - a.volume) // เรียงลำดับคนยอดขายสูงสุด
    };
  }

  // --- ฟังก์ชันสำหรับ Agent Analytics (เจาะจงรายบุคคล) ---
  static getUserAnalytics(userId: string) {
    const allPolicies = PolicyHub.getPolicies();
    const policies = allPolicies.filter((p: any) => p.quotation?.user?.id === userId);
    
    const successPolicies = policies.filter((p: any) => p.status === 'SUCCESS' || p.status === 'success');
    const mtdVolume = successPolicies.reduce((acc: number, p: any) => {
      const date = new Date(p.createdAt);
      const now = new Date();
      if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return acc + (p.premiumAmount || 0);
      }
      return acc;
    }, 0);

    const totalCommission = successPolicies.reduce((acc: number, p: any) => acc + (p.commissionAmount || 0), 0);

    // ยอดขายรายวัน (Weekly Trend) - 7 วันล่าสุด
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const weeklySales = days.map((day, idx) => {
      // ตัวอย่างจำลองการดึงข้อมูลรายวัน (ในระบบจริงจะใช้ date-fns)
      return { day, sales: 0 }; 
    });

    // สัดส่วนตามบริษัทประกัน
    const insurerShare = successPolicies.reduce((acc: any, p: any) => {
      const name = p.plan?.insurer?.nameTh || 'อื่นๆ';
      if (!acc[name]) acc[name] = 0;
      acc[name] += 1;
      return acc;
    }, {});
    
    const totalCount = successPolicies.length;
    const insurerData = Object.entries(insurerShare).map(([name, count]: any) => ({
      name,
      percent: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
    })).sort((a, b) => b.percent - a.percent);

    return {
      mtdVolume,
      totalCommission,
      successCount: successPolicies.length,
      totalCount: policies.length,
      weeklySales, // ให้ UI จัดการ mock ต่อถ้าข้อมูลไม่พอ แต่เปลี่ยน KPI เป็นของจริง
      insurerData
    };
  }
}
