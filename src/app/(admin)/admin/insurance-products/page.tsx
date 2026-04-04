'use client';

import React, { useEffect, useState } from 'react';

export default function AdminProductsPage() {
  const [insurers, setInsurers] = useState<any[]>([]);
  const [selectedInsurer, setSelectedInsurer] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    planName: '',
    planCode: '',
    planType: 'VMI1',
    repairType: 'DEALER',
    basePremium: 0,
    totalPremium: 0
  });

  const fetchProducts = async (insurerId: number, shouldSync: boolean = false) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/products?insurerId=${insurerId}${shouldSync ? '&sync=true' : ''}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch products:', e);
      setProducts([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/admin/insurers')
      .then(async res => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => { setInsurers(data); setLoading(false); })
      .catch(err => {
        console.error('Failed to fetch insurers:', err);
        alert(`Error: ${err.message}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedInsurer) {
      fetchProducts(selectedInsurer.id);
    }
  }, [selectedInsurer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInsurer) return;

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, insurerId: selectedInsurer.id })
    });

    if (res.ok) {
      alert('เพิ่มผลิตภัณฑ์สำเร็จ');
      setShowForm(false);
      setFormData({ planName: '', planCode: '', planType: 'VMI1', repairType: 'DEALER', basePremium: 0, totalPremium: 0 });
      // Refresh products
      fetch(`/api/admin/products?insurerId=${selectedInsurer.id}`).then(res => res.json()).then(setProducts);
    }
  };

  if (loading && insurers.length === 0) return <div>กำลังโหลดข้อมูล...</div>;

  return (
    <main>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>จัดการผลิตภัณฑ์ประกันภัย (Product Management)</h1>
        <p style={{ color: '#666' }}>แยกตามบริษัทประกันและการเชื่อมต่อ API/Manual</p>
      </header>

      {!selectedInsurer ? (
        /* Layer 1: เลือกบริษัทประกัน */
        <section className="grid grid-3">
          {insurers.map(insurer => (
            <div key={insurer.id} className="card" style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedInsurer(insurer)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', background: '#eee', borderRadius: '8px', overflow: 'hidden' }}>
                  {insurer.logoUrl && <img src={insurer.logoUrl} alt={insurer.nameEn} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{insurer.nameTh}</h3>
                  <span className={`badge ${insurer.integrationType === 'API' ? 'badge-success' : 'badge-warning'}`}>{insurer.integrationType}</span>
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--zoho-accent)', fontWeight: 'bold' }}>คลิกเพื่อจัดการแผนประกัน →</p>
            </div>
          ))}
        </section>
      ) : (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <button 
              onClick={() => setSelectedInsurer(null)} 
              className="btn-secondary"
              style={{ borderRadius: '50px', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              ← กลับไปเลือกบริษัท
            </button>
            <h2 style={{ margin: 0 }}>แผนประกันของ: {selectedInsurer.nameTh}</h2>
            
            {selectedInsurer.integrationType === 'API' && (
              <button 
                onClick={() => fetchProducts(selectedInsurer.id, true)} 
                disabled={refreshing}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '50px', padding: '8px 24px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                {refreshing ? '⌛ กำลังดึงข้อมูล...' : '🔄 ดึงแผนล่าสุดจาก API'}
              </button>
            )}

            {selectedInsurer.integrationType === 'MANUAL' && (
              <button 
                onClick={() => setShowForm(!showForm)} 
                className="btn-accent" 
                style={{ marginLeft: 'auto', borderRadius: '50px', padding: '8px 24px', fontWeight: 'bold' }}
              >
                {showForm ? '✕ ยกเลิก' : '+ เพิ่มแผนประกัน'}
              </button>
            )}
          </div>

          {showForm && (
            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
              <h3>เพิ่มแผนประกันใหม่ ({selectedInsurer.integrationType})</h3>
              <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label>ชื่อแผนประกัน</label>
                  <input type="text" value={formData.planName} onChange={(e) => setFormData({...formData, planName: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>รหัสแผน (Plan Code)</label>
                  <input type="text" value={formData.planCode} onChange={(e) => setFormData({...formData, planCode: e.target.value})} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>ประเภท (ชั้น)</label>
                  <select value={formData.planType} onChange={(e) => setFormData({...formData, planType: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                    <option value="VMI1">ชั้น 1</option>
                    <option value="VMI2+">ชั้น 2+</option>
                    <option value="VMI3+">ชั้น 3+</option>
                    <option value="CMI">พรบ. (CMI)</option>
                  </select>
                </div>
                <div>
                  <label>การซ่อม</label>
                  <select value={formData.repairType} onChange={(e) => setFormData({...formData, repairType: e.target.value})} style={{ width: '100%', padding: '8px' }}>
                    <option value="DEALER">ซ่อมห้าง</option>
                    <option value="COMPANY">ซ่อมอู่</option>
                  </select>
                </div>
                <div>
                  <label>เบี้ยพื้นฐาน (Base Premium)</label>
                  <input type="number" value={formData.basePremium} onChange={(e) => setFormData({...formData, basePremium: Number(e.target.value)})} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div>
                  <label>เบี้ยรวม (Total Premium)</label>
                  <input type="number" value={formData.totalPremium} onChange={(e) => setFormData({...formData, totalPremium: Number(e.target.value)})} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" className="btn-primary" style={{ width: '100%' }}>บันทึกแผนประกัน</button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>รหัสแผน</th>
                  <th style={{ padding: '1rem' }}>ชื่อแผนประกัน</th>
                  <th style={{ padding: '1rem' }}>ประเภท</th>
                  <th style={{ padding: '1rem' }}>การซ่อม</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>เบี้ยรวม</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>ยังไม่มีแผนประกันสำหรับบริษัทนี้</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '1rem' }}><code>{p.planCode}</code></td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.planName}</td>
                      <td style={{ padding: '1rem' }}>{p.planType}</td>
                      <td style={{ padding: '1rem' }}>{p.repairType === 'DEALER' ? 'ซ่อมห้าง' : 'ซ่อมอู่'}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--zoho-accent)' }}>฿{p.totalPremium?.toLocaleString() || '0'}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <span className="badge badge-success">เปิดใช้งาน</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
