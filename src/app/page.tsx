import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

async function getPolicies() {
  // ลองดึงจากฐานข้อมูลก่อน (Neon)
  if (prisma) {
    try {
      const dbPolicies = await prisma.policy.findMany({
        include: {
          quotation: {
            include: {
              user: true,
            },
          },
          plan: {
            include: {
              insurer: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      if (dbPolicies.length > 0) return dbPolicies;
    } catch (e) {
      console.log("Database not ready, falling back to JSON file");
    }
  }

  // ถ้าฐานข้อมูลไม่มีข้อมูล หรือยังไม่เชื่อมต่อ ให้ใช้ข้อมูลจาก policies.json เป็นตัวอย่าง
  try {
    const filePath = path.join(process.cwd(), "policies.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(jsonData);
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const policies = await getPolicies();

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LinkOne Agent Dashboard</h1>
          <p className="text-gray-600">จัดการรายการกรมธรรม์และข้อมูลประกันภัยของคุณ</p>
        </div>
        <div className="flex gap-4">
          <div className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium shadow-sm">
            Total Policies: {policies.length}
          </div>
        </div>
      </header>

      <main>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Policy ID / Number</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Insurance Plan</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {policies.length > 0 ? (
                policies.map((policy: any) => (
                  <tr key={policy.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{policy.policyNumber || policy.id}</div>
                      <div className="text-xs text-gray-500">{new Date(policy.createdAt).toLocaleDateString('th-TH')}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {policy.quotation?.customerName || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{policy.quotation?.vehicleBrand} {policy.quotation?.vehicleModel}</div>
                      <div className="text-xs text-gray-500">{policy.quotation?.vehicleYear}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-blue-600">{policy.plan?.insurer?.nameTh}</div>
                      <div className="text-xs text-gray-500">{policy.plan?.planName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">฿{Number(policy.premiumAmount).toLocaleString()}</div>
                      <div className="text-xs text-green-600 font-medium">Comm: ฿{Number(policy.commissionAmount).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        policy.status === 'SUCCESS' || policy.status === 'pending'
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {policy.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    ไม่พบข้อมูลกรมธรรม์ในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      
      <footer className="mt-12 text-center text-sm text-gray-400">
        &copy; 2026 LinkOne Agent System. Powered by Vercel & Neon Postgres.
      </footer>
    </div>
  );
}
