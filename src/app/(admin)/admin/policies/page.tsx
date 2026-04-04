'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPoliciesPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [policyNum, setPolicyNum] = useState('');

  const fetchPolicies = async () => {
    try {
      const res = await fetch('/api/admin/policies');
      const data = await res.json();
      if (res.ok) setPolicies(data);
      else router.push('/login');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const handleUpdate = async (id: string) => {
    if (!policyNum) return alert('กรุณากรอกเลขที่กรมธรรม์');
    
    const res = await fetch('/api/admin/policies', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, policyNumber: policyNum, status: 'SUCCESS' })
    });

    if (res.ok) {
      alert('อัปเดตข้อมูลสำเร็จ');
      setEditingId(null);
      setPolicyNum('');
      fetchPolicies();
    } else {
      alert('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>กำลังดึงข้อมูล...</div>;

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ระบบจัดการกรมธรรม์ (Admin)</h1>
          <p style={{ color: '#666' }}>รวมงานทั้งหมดที่รอดำเนินการและรายการล่าสุด</p>
        </div>
        <button onClick={() => router.push('/')} className="btn-secondary">กลับหน้าหลัก</button>
      </header>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: '1rem' }}>วันที่/ตัวแทน</th>
              <th style={{ padding: '1rem' }}>ลูกค้า/แผนประกัน</th>
              <th style={{ padding: '1rem' }}>บริษัทประกัน/แบบ</th>
              <th style={{ padding: '1rem' }}>เลขที่กรมธรรม์</th>
              <th style={{ padding: '1rem' }}>สถานะ</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                   <p style={{ margin: 0 }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                   <small style={{ color: '#999' }}>โดย: {p.quotation?.user?.fullName}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                   <p style={{ fontWeight: 'bold', margin: 0 }}>{p.quotation?.customerName || 'ไม่ระบุชื่อ'}</p>
                   <small style={{ color: '#666' }}>{p.quotation?.vehicleBrand} {p.quotation?.vehicleModel}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                   <p style={{ margin: 0 }}>{p.plan?.insurer?.nameTh}</p>
                   <small style={{ color: 'blue' }}>{p.plan?.insurer?.integrationType}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                   {editingId === p.id ? (
                     <input 
                       type="text" 
                       value={policyNum} 
                       onChange={(e) => setPolicyNum(e.target.value)} 
                       placeholder="คีย์เลขกรมธรรม์"
                       style={{ padding: '4px', width: '150px' }}
                     />
                   ) : (
                     <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>
                       {p.policyNumber || 'รอดำเนินการ'}
                     </code>
                   )}
                </td>
                <td style={{ padding: '1rem' }}>
                   <span className={`badge ${p.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                     {p.status}
                   </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                   {p.status === 'PENDING_ADMIN' ? (
                     editingId === p.id ? (
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdate(p.id)} className="btn-accent" style={{ padding: '4px 10px' }}>บันทึก</button>
                          <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '4px 10px' }}>ยกเลิก</button>
                        </div>
                     ) : (
                        <button onClick={() => { setEditingId(p.id); setPolicyNum(''); }} className="btn-primary" style={{ padding: '4px 10px' }}>คีย์เลขงาน</button>
                     )
                   ) : (
                     <button className="btn-secondary" style={{ padding: '4px 10px', opacity: 0.5 }} disabled>เรียบร้อย</button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
