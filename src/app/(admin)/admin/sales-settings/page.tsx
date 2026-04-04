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

  const [rateInput, setRateInput] = useState('');
  const [selectedTierForRate, setSelectedTierForRate] = useState('Standard');

  const tiers = ['Standard', 'Bronze', 'Silver', 'Gold', 'Platinum'];

  const fetchData = async () => {
    const fetchWithCheck = (url: string) => fetch(url).then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    });

    try {
      const [insData, prodData, userData, commData] = await Promise.all([
        fetchWithCheck('/api/admin/insurers'),
        fetchWithCheck('/api/admin/products'),
        fetchWithCheck('/api/admin/users'),
        fetchWithCheck('/api/admin/commission')
      ]);
      setInsurers(insData);
      setAllProducts(prodData);
      setUsers(userData.filter((u: any) => u.role.includes('agent')));
      setCommissions(commData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateUserTier = async (userId: string, newTier: string) => {
    try {
      const user = users.find(u => u.id === userId);
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, tier: newTier, fullName: user.fullName, role: user.role })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
      }
    } catch (e) {
      alert('Update tier failed');
    }
  };

  const handleSaveCommission = async (target: { userId?: string, tierId?: string }) => {
    if (!selectedProductId || !rateInput) return alert('กรุณาระบุเปอร์เซ็นต์');
    
    try {
      const res = await fetch('/api/admin/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: selectedProductId, 
          commissionRate: rateInput,
          ...target
        })
      });

      if (res.ok) {
        setRateInput('');
        const freshRes = await fetch('/api/admin/commission');
        if (freshRes.ok) setCommissions(await freshRes.json());
        alert('บันทึกค่าคอมมิชชันสำเร็จ');
      }
    } catch (e) {
      alert('Save failed');
    }
  };

  const handleDeleteComm = async (id: string) => {
    if (!confirm('ยืนยันการลบ?')) return;
    const res = await fetch(`/api/admin/commission?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      const freshRes = await fetch('/api/admin/commission');
      if (freshRes.ok) setCommissions(await freshRes.json());
    }
  };

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;

  const insurerProducts = allProducts.filter(p => p.insurerId === selectedInsurerId);
  const currentProduct = allProducts.find(p => p.id === selectedProductId);
  const productComms = commissions.filter(c => c.productId === selectedProductId);

  // คำนวณเรทที่แต่ละคนได้รับจริง
  const getEffectiveRate = (user: any) => {
    if (!selectedProductId) return '-';
    // 1. Individual
    const ind = productComms.find(c => c.userId === user.id);
    if (ind) return `${ind.commissionRate}% (รายคน)`;
    // 2. Tier
    const tr = productComms.find(c => c.tierId === user.tier);
    if (tr) return `${tr.commissionRate}% (กลุ่ม ${user.tier})`;
    // 3. Default
    const df = productComms.find(c => c.userId === 'default');
    if (df) return `${df.commissionRate}% (ค่าเริ่มต้น)`;
    return '0%';
  };

  return (
    <main>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>จัดการ Tier และค่าคอมมิชชัน</h1>
        <p style={{ color: '#666' }}>กำหนดกลุ่มให้ตัวแทน และตั้งค่าส่วนแบ่งรายได้ตามโปรดักต์</p>
      </header>

      {/* STEP 1: เลือกโปรดักต์ */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label className="text-muted">1. เลือกบริษัทประกัน</label>
            <select 
              value={selectedInsurerId || ''} 
              onChange={(e) => { setSelectedInsurerId(Number(e.target.value)); setSelectedProductId(null); }}
              style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">-- เลือกบริษัท --</option>
              {insurers.map(i => <option key={i.id} value={i.id}>{i.nameTh}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="text-muted">2. เลือกแผนประกัน</label>
            <select 
              value={selectedProductId || ''} 
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={!selectedInsurerId}
              style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">-- เลือกแผน --</option>
              {insurerProducts.map(p => <option key={p.id} value={p.id}>{p.planName} ({p.planCode})</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedProductId && (
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
          
          {/* ส่วนตั้งค่ากลุ่ม (Tier Rates) */}
          <aside>
            <div className="card" style={{ position: 'sticky', top: '20px' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>⚙️ ตั้งค่าตามกลุ่ม (Tier)</h3>
              <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.5rem' }}>ค่าที่ตั้งตรงนี้จะใช้กับทุกคนที่อยู่ในกลุ่มนั้นๆ</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="label">เลือกกลุ่ม</label>
                  <select value={selectedTierForRate} onChange={e => setSelectedTierForRate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                    <option value="default">🌟 ค่าเริ่มต้น (ทุกคน)</option>
                    {tiers.map(t => <option key={t} value={t}>กลุ่ม {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">เปอร์เซ็นต์คอมมิชชัน (%)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={rateInput} 
                    onChange={e => setRateInput(e.target.value)} 
                    placeholder="เช่น 15" 
                  />
                </div>
                <button 
                  onClick={() => handleSaveCommission(selectedTierForRate === 'default' ? { userId: 'default' } : { tierId: selectedTierForRate })}
                  className="btn-primary" 
                  style={{ borderRadius: '8px', padding: '12px' }}
                >
                  บันทึกเรทกลุ่ม
                </button>
              </div>

              <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>รายการที่ตั้งไว้:</h4>
                {productComms.filter(c => c.tierId || c.userId === 'default').map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '0.85rem' }}>
                    <span>{c.userId === 'default' ? '🌟 Default' : `🏷️ ${c.tierId}`}</span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold' }}>{c.commissionRate}%</span>
                      <button onClick={() => handleDeleteComm(c.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ตารางจัดการรายคนและ Tier (Agent Directory) */}
          <section>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>👥 จัดการ Agent และเรทรายบุคคล</h3>
                <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#888' }}>
                  แผน: <strong>{currentProduct?.planName}</strong>
                </p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa', fontSize: '0.85rem' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>ชื่อตัวแทน / Username</th>
                    <th style={{ padding: '1rem' }}>กลุ่ม (Tier)</th>
                    <th style={{ padding: '1rem' }}>เรทที่จะได้รับจริง</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>ตั้งค่ารายคน</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const individualComm = productComms.find(c => c.userId === user.id);
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>@{user.username}</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select 
                            value={user.tier || 'Standard'} 
                            onChange={(e) => handleUpdateUserTier(user.id, e.target.value)}
                            style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                          >
                            {tiers.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: individualComm ? '#ff4d4f' : '#006aff',
                            fontSize: '1rem'
                          }}>
                            {getEffectiveRate(user)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                            <input 
                              type="number" 
                              placeholder="เรทเฉพาะตัว" 
                              style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.8rem' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setRateInput((e.target as HTMLInputElement).value);
                                  handleSaveCommission({ userId: user.id });
                                }
                              }}
                            />
                            {individualComm && (
                              <button 
                                onClick={() => handleDeleteComm(individualComm.id)}
                                style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                ลบเรทพิเศษ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      )}

      <style jsx>{`
        .label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; }
        .input-field { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd; outline: none; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; }
        .card { background: white; border-radius: 12px; border: 1px solid #eee; padding: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
        .text-muted { font-size: 0.85rem; color: #888; }
      `}</style>
    </main>
  );
}
