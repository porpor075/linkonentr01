'use client';

import React, { useEffect, useState } from 'react';

export default function AdminInsurersPage() {
  const [insurers, setInsurers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, nameTh: '', nameEn: '', logoUrl: '', apiEndpoint: '', integrationType: 'MANUAL' });
  const [checkingId, setCheckingId] = useState<number | null>(null);
  const [apiStatuses, setApiStatuses] = useState<Record<number, { status: string, msg: string, lastChecked?: string }>>({});

  const checkConnection = async (insurer: any) => {
    setCheckingId(insurer.id);
    try {
      const res = await fetch('/api/admin/insurers/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ insurerId: insurer.id, insurerNameEn: insurer.nameEn })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setApiStatuses(prev => ({ ...prev, [insurer.id]: { status: data.status, msg: data.message, lastChecked: data.lastChecked } }));
    } catch (e) {
      console.error('Connection check failed:', e);
      setApiStatuses(prev => ({ ...prev, [insurer.id]: { status: 'offline', msg: 'การเชื่อมต่อขัดข้อง', lastChecked: new Date().toISOString() } }));
    } finally {
      setCheckingId(null);
    }
  };

  const fetchInsurers = async () => {
    try {
      const res = await fetch('/api/admin/insurers');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setInsurers(data);
    } catch (e) { 
      console.error('Failed to fetch insurers:', e); 
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInsurers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = formData.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/admin/insurers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert('บันทึกข้อมูลสำเร็จ');
      setShowForm(false);
      setFormData({ id: null, nameTh: '', nameEn: '', logoUrl: '', apiEndpoint: '', integrationType: 'MANUAL' });
      fetchInsurers();
    } else {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  const handleEdit = (insurer: any) => {
    setFormData({ 
      id: insurer.id, 
      nameTh: insurer.nameTh, 
      nameEn: insurer.nameEn, 
      logoUrl: insurer.logoUrl || '', 
      apiEndpoint: insurer.apiEndpoint || '', 
      integrationType: insurer.integrationType 
    });
    setShowForm(true);
  };

  if (loading) return <div>กำลังดึงข้อมูล...</div>;

  return (
    <main>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>จัดการบริษัทประกัน (Insurers)</h1>
          <p style={{ color: '#666' }}>ตั้งค่าการเชื่อมต่อ API และ Manual Process สำหรับแต่ละบริษัท</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); setFormData({ id: null, nameTh: '', nameEn: '', logoUrl: '', apiEndpoint: '', integrationType: 'MANUAL' }); }} 
          className="btn-accent"
          style={{ borderRadius: '50px', padding: '10px 24px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'all 0.3s ease' }}
        >
          {showForm ? '✕ ยกเลิก' : '+ เพิ่มบริษัทประกัน'}
        </button>
      </header>

      {showForm && (
        <section className="card" style={{ marginBottom: '2rem', padding: '2rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>{formData.id ? '📝 แก้ไขข้อมูลบริษัท' : '🏢 เพิ่มบริษัทใหม่'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* ... fields ... */}
            <div style={{ gridColumn: 'span 2' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%', borderRadius: '50px', padding: '12px', fontWeight: 'bold', fontSize: '1rem' }}>
                บันทึกข้อมูลบริษัท
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
            <tr>
              <th style={{ padding: '1rem' }}>โลโก้</th>
              <th style={{ padding: '1rem' }}>ชื่อบริษัท (TH/EN)</th>
              <th style={{ padding: '1rem' }}>ประเภท</th>
              <th style={{ padding: '1rem' }}>สถานะ API</th>
              <th style={{ padding: '1rem' }}>จำนวนแผน</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {insurers.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                    {item.logoUrl && <img src={item.logoUrl} alt={item.nameEn} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <p style={{ fontWeight: 'bold', margin: 0 }}>{item.nameTh}</p>
                  <small style={{ color: '#666' }}>{item.nameEn}</small>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${item.integrationType === 'API' ? 'badge-success' : 'badge-warning'}`}>
                    {item.integrationType}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {item.integrationType === 'API' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '10px', height: '10px', borderRadius: '50%', 
                        background: (apiStatuses[item.id]?.status || item.lastStatus) === 'online' ? '#2ecc71' : ((apiStatuses[item.id]?.status || item.lastStatus) === 'offline' ? '#e74c3c' : '#bdc3c7') 
                      }}></div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <small style={{ fontSize: '0.75rem', color: '#333', fontWeight: 'bold' }}>{apiStatuses[item.id]?.msg || item.lastStatusMsg || 'ยังไม่ได้ตรวจสอบ'}</small>
                        {(apiStatuses[item.id]?.lastChecked || item.lastChecked) && (
                          <small style={{ fontSize: '0.65rem', color: '#999' }}>เช็คล่าสุด: {new Date(apiStatuses[item.id]?.lastChecked || item.lastChecked).toLocaleString('th-TH')}</small>
                        )}
                      </div>
                      <button 
                        onClick={() => checkConnection(item)} 
                        disabled={checkingId === item.id}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1rem', padding: '5px', borderRadius: '50%', transition: 'background 0.2s' }}
                        title="รีเฟรชการเชื่อมต่อ"
                        onMouseOver={(e) => e.currentTarget.style.background = '#eee'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                      >
                        {checkingId === item.id ? '⌛' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <small style={{ color: '#999' }}>Manual Process</small>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>{item._count?.plans || 0} แผน</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => handleEdit(item)} style={{ color: 'var(--zoho-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    ⚙️ ตั้งค่า
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
