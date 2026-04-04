'use client';

import React, { useEffect, useState } from 'react';

export default function AdvancedSalesSettings() {
  const [insurers, setInsurers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedInsurerId, setSelectedInsurerId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const [overrideUserId, setOverrideUserId] = useState('default');
  const [rateInput, setRateInput] = useState('');

  useEffect(() => {
    const fetchWithCheck = (url: string) => fetch(url).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });

    Promise.all([
      fetchWithCheck('/api/admin/insurers'),
      fetchWithCheck('/api/admin/products'),
      fetchWithCheck('/api/admin/users'),
      fetchWithCheck('/api/admin/commission')
    ]).then(([insData, prodData, userData, commData]) => {
      setInsurers(insData);
      setAllProducts(prodData);
      setUsers(userData.filter((u: any) => u.role === 'agent'));
      setCommissions(commData);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to initial fetch:', err);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!selectedProductId || !rateInput) return alert('กรุณาระบุข้อมูลให้ครบ');
    
    try {
      const res = await fetch('/api/admin/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: selectedProductId, 
          userId: overrideUserId, 
          commissionRate: rateInput 
        })
      });

      if (res.ok) {
        alert('บันทึกสำเร็จ');
        setRateInput('');
        setOverrideUserId('default');
        // Refresh
        const freshRes = await fetch('/api/admin/commission');
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setCommissions(freshData);
        }
      } else {
        const errorData = await res.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error || 'ไม่สามารถบันทึกได้'}`);
      }
    } catch (e) {
      console.error('Save failed:', e);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ยืนยันการลบค่าคอมมิชชันนี้?')) return;
    try {
      const res = await fetch(`/api/admin/commission?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const freshRes = await fetch('/api/admin/commission');
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setCommissions(freshData);
        }
      }
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  const insurerProducts = allProducts.filter(p => p.insurerId === selectedInsurerId);
  const productComms = commissions.filter(c => c.productId === selectedProductId);

  return (
    <main>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ตั้งค่าคอมมิชชันรายโปรดักต์และรายบุคคล</h1>
        <p style={{ color: '#666' }}>จัดการส่วนแบ่งรายได้ให้ Agent อย่างละเอียด</p>
      </header>

      <div className="grid grid-2">
        {/* ส่วนที่ 1: เลือกโปรดักต์ */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>1. เลือกแผนประกัน</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="text-muted">บริษัทประกัน</label>
              <select 
                value={selectedInsurerId || ''} 
                onChange={(e) => { setSelectedInsurerId(Number(e.target.value)); setSelectedProductId(null); }}
                style={{ width: '100%', padding: '10px', marginTop: '5px' }}
              >
                <option value="">-- เลือกบริษัท --</option>
                {insurers.map(i => <option key={i.id} value={i.id}>{i.nameTh}</option>)}
              </select>
            </div>

            {selectedInsurerId && (
              <div>
                <label className="text-muted">ผลิตภัณฑ์ (Product)</label>
                <select 
                  value={selectedProductId || ''} 
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                >
                  <option value="">-- เลือกโปรดักต์ --</option>
                  {insurerProducts.map(p => <option key={p.id} value={p.id}>{p.planName} ({p.planCode})</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ส่วนที่ 2: ตั้งค่าคอมมิชชัน */}
        {selectedProductId && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>2. กำหนดค่าคอมมิชชัน (%)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="text-muted">สำหรับใคร?</label>
                <select 
                  value={overrideUserId} 
                  onChange={(e) => setOverrideUserId(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                >
                  <option value="default">ค่ามาตรฐาน (Default - ทุกคน)</option>
                  {users.map(u => <option key={u.id} value={u.id}>เฉพาะ: {u.fullName} (@{u.username})</option>)}
                </select>
              </div>
              <div>
                <label className="text-muted">อัตราคอมมิชชัน (เปอร์เซ็นต์)</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <input 
                    type="number" 
                    value={rateInput} 
                    onChange={(e) => setRateInput(e.target.value)} 
                    placeholder="เช่น 15.5"
                    style={{ flex: 1, padding: '10px' }}
                  />
                  <button onClick={handleSave} className="btn-primary" style={{ borderRadius: '8px' }}>บันทึก</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ตารางแสดงผลที่ตั้งไว้ */}
      {selectedProductId && (
        <div className="card" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
            <h3 style={{ margin: 0 }}>รายการคอมมิชชันที่ตั้งไว้สำหรับโปรดักต์นี้</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '1rem' }}>กลุ่มเป้าหมาย / Agent</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>คอมมิชชัน</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>อัปเดตล่าสุด</th>
                <th style={{ padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {productComms.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>ยังไม่ได้กำหนดค่าคอมมิชชัน</td></tr>
              ) : (
                productComms.sort((a,b) => a.userId === 'default' ? -1 : 1).map(c => {
                  const user = users.find(u => u.id === c.userId);
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '1rem' }}>
                        {c.userId === 'default' ? (
                          <span style={{ fontWeight: 'bold', color: 'var(--zoho-accent)' }}>🌟 ค่ามาตรฐาน (ทุกคน)</span>
                        ) : (
                          <span>👤 {user?.fullName || 'ไม่พบข้อมูล User'}</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{c.commissionRate}%</td>
                      <td style={{ padding: '1rem', textAlign: 'right', color: '#999', fontSize: '0.85rem' }}>
                        {new Date(c.updatedAt).toLocaleString('th-TH')}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button onClick={() => handleDelete(c.id)} style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer' }}>ลบ</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
