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

  const handleSaveCommission = async (target: { userId?: string, tierId?: string }, specificRate?: string) => {
    const finalRate = specificRate || rateInput;
    if (!selectedProductId || !finalRate) return alert('กรุณาระบุเปอร์เซ็นต์');
    
    try {
      const res = await fetch('/api/admin/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: selectedProductId, 
          commissionRate: finalRate,
          ...target
        })
      });

      if (res.ok) {
        if (!specificRate) setRateInput('');
        const freshRes = await fetch('/api/admin/commission');
        if (freshRes.ok) setCommissions(await freshRes.json());
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังโหลดข้อมูลระบบจัดการคอมมิชชัน...</div>;

  const insurerProducts = allProducts.filter(p => p.insurerId === selectedInsurerId);
  const currentProduct = allProducts.find(p => p.id === selectedProductId);
  const productComms = commissions.filter(c => c.productId === selectedProductId);

  const getEffectiveRate = (user: any) => {
    if (!selectedProductId) return '-';
    const ind = productComms.find(c => c.userId === user.id);
    if (ind) return `${ind.commissionRate}%`;
    const tr = productComms.find(c => c.tierId === user.tier);
    if (tr) return `${tr.commissionRate}%`;
    const df = productComms.find(c => c.userId === 'default');
    if (df) return `${df.commissionRate}%`;
    return '0%';
  };

  const getRateSource = (user: any) => {
    if (!selectedProductId) return '';
    if (productComms.find(c => c.userId === user.id)) return 'รายคน';
    if (productComms.find(c => c.tierId === user.tier)) return `กลุ่ม ${user.tier}`;
    if (productComms.find(c => c.userId === 'default')) return 'ค่าเริ่มต้น';
    return 'ยังไม่ตั้งค่า';
  };

  return (
    <main>
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#001F3F', marginBottom: '0.5rem' }}>Commission Management Journey</h1>
        <p style={{ color: '#666' }}>จัดการ Tier ตัวแทนและกำหนดค่าคอมมิชชันตามลำดับความสำคัญ</p>
      </header>

      {/* STEP 1: Manage Agent Tiers */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <span style={{ background: '#006aff', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>1</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>จัดการกลุ่มตัวแทน (Agent Tiers)</h2>
        </div>
        
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem' }}>ชื่อตัวแทน / Username</th>
                <th style={{ padding: '1rem 1.5rem' }}>กลุ่มปัจจุบัน (Tier)</th>
                <th style={{ padding: '1rem 1.5rem' }}>สถานะ</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>ปรับเปลี่ยนกลุ่ม</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{user.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>@{user.username}</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      background: user.tier === 'Gold' || user.tier === 'Platinum' ? '#fff9db' : '#f1f3f5',
                      color: user.tier === 'Gold' || user.tier === 'Platinum' ? '#f08c00' : '#495057',
                      border: `1px solid ${user.tier === 'Gold' || user.tier === 'Platinum' ? '#ffe066' : '#dee2e6'}`
                    }}>
                      {user.tier || 'Standard'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ color: user.isActive ? '#2f9e44' : '#e03131', fontSize: '0.85rem' }}>
                      ● {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <select 
                      className="select-tier"
                      value={user.tier || 'Standard'} 
                      onChange={(e) => handleUpdateUserTier(user.id, e.target.value)}
                    >
                      {tiers.map(t => <option key={t} value={t}>ย้ายไป {t}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr style={{ border: 'none', borderTop: '1px dashed #ddd', margin: '3rem 0' }} />

      {/* STEP 2: Select Product */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <span style={{ background: '#006aff', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>2</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>เลือกผลิตภัณฑ์ที่ต้องการตั้งค่า</h2>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">บริษัทประกัน</label>
              <select 
                className="input-field"
                value={selectedInsurerId || ''} 
                onChange={(e) => { setSelectedInsurerId(Number(e.target.value)); setSelectedProductId(null); }}
              >
                <option value="">-- เลือกบริษัทประกัน --</option>
                {insurers.map(i => <option key={i.id} value={i.id}>{i.nameTh}</option>)}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label className="label">แผนประกัน (Product)</label>
              <select 
                className="input-field"
                value={selectedProductId || ''} 
                onChange={(e) => setSelectedProductId(e.target.value)}
                disabled={!selectedInsurerId}
              >
                <option value="">-- เลือกแผนประกันเพื่อจัดการค่าคอมมิชชัน --</option>
                {insurerProducts.map(p => <option key={p.id} value={p.id}>{p.planName} ({p.planCode})</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 3: Manage Commissions */}
      {selectedProductId && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <span style={{ background: '#006aff', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>3</span>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>กำหนดอัตราคอมมิชชัน</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', alignItems: 'start' }}>
            
            {/* Tier Rates Panel */}
            <div className="card" style={{ border: '1px solid #006aff' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏷️</span> ตั้งค่าเรทตามกลุ่ม (Tier)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label className="label">เป้าหมาย</label>
                  <select className="input-field" value={selectedTierForRate} onChange={e => setSelectedTierForRate(e.target.value)}>
                    <option value="default">🌟 ค่าเริ่มต้น (ทุกคน)</option>
                    {tiers.map(t => <option key={t} value={t}>กลุ่ม {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">เรทคอมมิชชัน (%)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={rateInput} 
                      onChange={e => setRateInput(e.target.value)} 
                      placeholder="0.00" 
                    />
                    <button onClick={() => handleSaveCommission(selectedTierForRate === 'default' ? { userId: 'default' } : { tierId: selectedTierForRate })} className="btn-primary" style={{ padding: '0 20px', borderRadius: '8px' }}>บันทึก</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '1rem', textTransform: 'uppercase' }}>เรทปัจจุบันในระบบ:</p>
                {productComms.filter(c => c.tierId || c.userId === 'default').map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem', borderBottom: '1px solid #f9f9f9' }}>
                    <span style={{ fontWeight: '500' }}>{c.userId === 'default' ? '🌟 Default' : `🏷️ Tier: ${c.tierId}`}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontWeight: 'bold', color: '#006aff' }}>{c.commissionRate}%</span>
                      <button onClick={() => handleDeleteComm(c.id)} style={{ border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '0.8rem' }}>ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Overrides & Effective Rates */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>👥 สรุปเรทรายคน (Effective Rates)</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>
                  <tr style={{ borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '1rem 1.5rem' }}>ตัวแทน</th>
                    <th style={{ padding: '1rem 1.5rem' }}>เรทที่จะได้รับจริง</th>
                    <th style={{ padding: '1rem 1.5rem' }}>ที่มาของเรท</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>เรทพิเศษ (รายคน)</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const individual = productComms.find(c => c.userId === user.id);
                    return (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
                          <div style={{ fontSize: '0.7rem', color: '#aaa' }}>Tier: {user.tier}</div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontWeight: '800', color: individual ? '#ff4d4f' : '#006aff', fontSize: '1.1rem' }}>
                            {getEffectiveRate(user)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#666' }}>
                          {getRateSource(user)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <input 
                              type="number" 
                              placeholder="%" 
                              style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #eee', fontSize: '0.85rem', textAlign: 'center' }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveCommission({ userId: user.id }, (e.target as HTMLInputElement).value);
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            {individual && (
                              <button onClick={() => handleDeleteComm(individual.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>ลบ</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </section>
      )}

      <style jsx>{`
        .card { background: white; border-radius: 12px; border: 1px solid #eee; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .label { display: block; font-size: 0.85rem; color: #888; margin-bottom: 8px; font-weight: 500; }
        .input-field { width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none; transition: border 0.2s; }
        .input-field:focus { border-color: #006aff; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; }
        .select-tier { padding: 6px 12px; border-radius: 6px; border: 1px solid #e9ecef; background: #fff; font-size: 0.85rem; cursor: pointer; }
        .select-tier:hover { border-color: #ced4da; }
      `}</style>
    </main>
  );
}
