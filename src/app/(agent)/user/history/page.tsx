'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ConsistentHistoryPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/products/contracts/history')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setPolicies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch policy history:', err);
        setLoading(false);
      });
  }, []);

  const filteredPolicies = policies.filter(p => 
    p.quotation?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังดึงข้อมูลประวัติ...</div>;

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>ประวัติการทำรายการ</h1>
          <p style={{ color: '#666', margin: 0 }}>ตรวจสอบสถานะกรมธรรม์และใบเสนอราคาทั้งหมด</p>
        </div>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="🔍 ค้นหาชื่อลูกค้า หรือเลขกรมธรรม์..." 
            style={{ width: '100%', padding: '12px 20px', borderRadius: '50px', border: '1px solid #ddd', outline: 'none', fontSize: '0.9rem' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* Desktop Table View */}
      <div className="card desktop-view" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
            <tr>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>วันที่</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>เลขที่กรมธรรม์</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>ชื่อลูกค้า</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>บริษัท / แผน</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>ทุนประกัน</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>เบี้ยประกัน</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>สถานะ</th>
              <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((policy) => (
              <tr key={policy.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(policy.createdAt).toLocaleDateString('th-TH')}</td>
                <td style={{ padding: '1rem' }}><code style={{ background: '#f8f9fa', padding: '2px 6px', borderRadius: '4px' }}>{policy.policyNumber || 'QUO-'+policy.id.slice(-6)}</code></td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{policy.quotation?.customerName || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem' }}>{policy.plan?.insurer?.nameTh || 'Allianz'}</p>
                  <small style={{ color: '#888' }}>{policy.plan?.planName}</small>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', color: '#666' }}>
                  ฿{Number(policy.quotation?.sumInsured || 0).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#006aff' }}>
                  ฿{Number(policy.premiumAmount || 0).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <span className={`badge ${policy.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                    {policy.status === 'SUCCESS' ? 'สำเร็จ' : 'รอดำเนินการ'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <Link href={`/user/contracts/${policy.id}`} style={{ color: 'var(--zoho-accent)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>จัดการ →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="mobile-view space-y-4" style={{ display: 'none' }}>
        {filteredPolicies.map((policy) => (
          <div key={policy.id} className="card" style={{ padding: '1.2rem', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(policy.createdAt).toLocaleDateString('th-TH')}</span>
              <span className={`badge ${policy.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                {policy.status === 'SUCCESS' ? 'สำเร็จ' : 'รอดำเนินการ'}
              </span>
            </div>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{policy.quotation?.customerName || 'ไม่ระบุ'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#666' }}>
              <span>{policy.plan?.planName}</span>
              <span>ทุน: ฿{Number(policy.quotation?.sumInsured || 0).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '800', color: '#006aff' }}>เบี้ย: ฿{Number(policy.premiumAmount || 0).toLocaleString()}</span>
              <Link href={`/user/contracts/${policy.id}`} style={{ color: 'var(--zoho-primary)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>รายละเอียด →</Link>
            </div>
          </div>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#999' }}>ไม่พบข้อมูลรายการ</div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body { font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #ffffff; }
        @media (max-width: 768px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; }
        }
      `}</style>
    </main>
  );
}
