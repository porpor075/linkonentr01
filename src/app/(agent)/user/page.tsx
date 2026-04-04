'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ConsistentUserDashboard() {
  const [session, setSession] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentPolicies, setRecentPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, analyticsRes, historyRes] = await Promise.all([
          fetch('/api/auth/session'),
          fetch('/api/user/analytics'),
          fetch('/api/products/contracts/history')
        ]);

        if (sessionRes.ok) setSession(await sessionRes.json());
        if (analyticsRes.ok) {
          const result = await analyticsRes.json();
          if (result.success) setAnalytics(result.data);
        }
        if (historyRes.ok) {
          const data = await historyRes.json();
          if (Array.isArray(data)) setRecentPolicies(data.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังดึงข้อมูล...</div>;

  return (
    <main style={{ padding: '20px' }}>
      {/* 
          --- HEADER (Synced with Insurers Style) --- 
      */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>สวัสดีคุณ {session?.name?.split(' ')[0] || 'ตัวแทน'}</h1>
          <p style={{ color: '#666', margin: 0 }}>ภาพรวมผลงานการขายและสถานะล่าสุดของคุณ</p>
        </div>
        <Link href="/user/products">
          <button 
            className="btn-accent"
            style={{ borderRadius: '50px', padding: '10px 24px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            + สร้างใบเสนอราคาใหม่
          </button>
        </Link>
      </header>

      {/* 
          --- KPI CARDS (Synced with Insurers Style - Adaptive) --- 
      */}
      <div className="kpi-grid" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'ยอดขายเดือนนี้ (MTD)', value: `฿${(analytics?.mtdVolume || 0).toLocaleString()}`, color: '#3498db' },
          { label: 'ค่าคอมมิชชันสะสม', value: `฿${(analytics?.totalCommission || 0).toLocaleString()}`, color: '#2ecc71' },
          { label: 'งานรอดำเนินการ', value: `${analytics?.totalCount - analytics?.successCount || 0} งาน`, color: '#f39c12' },
          { label: 'อัตราความสำเร็จ', value: `${analytics?.totalCount > 0 ? Math.round((analytics.successCount / analytics.totalCount) * 100) : 0}%`, color: '#9b59b6' },
        ].map((kpi, idx) => (
          <div key={idx} className="card" style={{ 
            padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee', borderLeft: `4px solid ${kpi.color}`,
            background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{kpi.label}</p>
            <h2 style={{ fontSize: '1.6rem', margin: 0, fontWeight: '800' }}>{kpi.value}</h2>
          </div>
        ))}
      </div>

      {/* 
          --- RECENT WORK TABLE (Synced with Insurers Style) --- 
      */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--zoho-primary)', fontWeight: 'bold' }}>รายการงานล่าสุด</h3>
          <Link href="/user/history" style={{ fontSize: '0.85rem', color: 'var(--zoho-accent)', textDecoration: 'none', fontWeight: 'bold' }}>ดูประวัติทั้งหมด →</Link>
        </div>
        
        {/* Desktop Table View */}
        <div className="card desktop-view" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
              <tr>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>วันที่</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>ชื่อลูกค้า</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>แผนประกัน</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>ยอดเบี้ย</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>สถานะ</th>
                <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {recentPolicies.map((policy) => (
                <tr key={policy.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(policy.createdAt).toLocaleDateString('th-TH')}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{policy.quotation?.customerName || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{policy.plan?.planName}</p>
                    <small style={{ color: '#888' }}>{policy.plan?.insurer?.nameEn}</small>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--zoho-accent)' }}>฿{(policy.premiumAmount || 0).toLocaleString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span className={`badge ${policy.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`}>
                      {policy.status === 'SUCCESS' ? 'สำเร็จ' : 'รอดำเนินการ'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <Link href={`/user/contracts/${policy.id}`} style={{ color: 'var(--zoho-accent)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>
                      จัดการ →
                    </Link>
                  </td>
                </tr>
              ))}
              {recentPolicies.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>ยังไม่มีรายการงานล่าสุด</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="mobile-view space-y-4" style={{ display: 'none' }}>
          {recentPolicies.map((policy) => (
            <div key={policy.id} className="card" style={{ padding: '1.2rem', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(policy.createdAt).toLocaleDateString('th-TH')}</span>
                <span className={`badge ${policy.status === 'SUCCESS' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.65rem' }}>
                  {policy.status === 'SUCCESS' ? 'สำเร็จ' : 'รอดำเนินการ'}
                </span>
              </div>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{policy.quotation?.customerName || 'N/A'}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{policy.plan?.planName}</p>
              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', color: 'var(--zoho-accent)' }}>฿{(policy.premiumAmount || 0).toLocaleString()}</span>
                <Link href={`/user/contracts/${policy.id}`} style={{ color: 'var(--zoho-primary)', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.85rem' }}>จัดการรายละเอียด →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'IBM Plex Sans Thai', sans-serif;
          background-color: #ffffff;
        }
        
        .kpi-grid { grid-template-columns: repeat(4, 1fr); }

        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; }
          .kpi-grid { grid-template-columns: 1fr; gap: 1rem; }
          header { flex-direction: column; align-items: flex-start !important; }
          header a, header button { width: 100%; }
        }
      `}</style>
    </main>
  );
}
