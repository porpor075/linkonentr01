'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ConsistentAdaptiveAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(result => {
        if (result.success) setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch admin analytics:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังดึงข้อมูล...</div>;
  if (!data) return null;

  const { sales, financial } = data;
  const kpis = sales.kpis;

  return (
    <main style={{ padding: '20px' }}>
      {/* 
          --- SHARED HEADER (สไตล์เดียวกับหน้า Insurers) --- 
      */}
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Dashboard (Executive Summary)</h1>
          <p style={{ color: '#666', margin: 0 }}>วิเคราะห์ภาพรวมยอดขายและผลงานตัวแทนในสไตล์มาตรฐาน</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="btn-secondary"
          style={{ borderRadius: '50px', padding: '10px 24px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
        >
          🖨️ พิมพ์รายงาน
        </button>
      </header>

      {/* 
          --- KPI CARDS (สไตล์เดียวกับหน้า Insurers - Adaptive) --- 
      */}
      <div className="kpi-grid" style={{ display: 'grid', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'ยอดขายสุทธิรวม', value: `฿${(kpis.totalVolume || 0).toLocaleString()}`, color: '#3498db' },
          { label: 'คอมมิชชันสะสม', value: `฿${(kpis.totalCommission || 0).toLocaleString()}`, color: '#2ecc71' },
          { label: 'งานค้างดำเนินการ', value: `${kpis.pendingPolicies} งาน`, color: '#f39c12' },
          { label: 'อัตราปิดการขาย', value: `${kpis.successRate}%`, color: '#9b59b6' },
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

      <div className="main-grid" style={{ display: 'grid', gap: '2rem' }}>
        
        {/* Market Share Table - สไตล์เดียวกับหน้า Insurers */}
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--zoho-primary)', fontWeight: 'bold' }}>🏢 สัดส่วนยอดขายตามบริษัทประกัน</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>บริษัทประกัน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>จำนวนงาน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>ยอดเบี้ยรวม</th>
                </tr>
              </thead>
              <tbody>
                {sales.salesByInsurer.map((ins: any) => (
                  <tr key={ins.name} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{ins.name}</td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{ins.count}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--zoho-accent)' }}>
                      ฿{(ins.volume || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Agent Performance Table - สไตล์เดียวกับหน้า Insurers */}
        <section>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--zoho-primary)', fontWeight: 'bold' }}>🏆 อันดับตัวแทนยอดเยี่ยม</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid #eee', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>ตัวแทน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>จำนวนงาน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>คอมมิชชัน</th>
                </tr>
              </thead>
              <tbody>
                {financial.agentPerformance.map((agent: any, idx: number) => (
                  <tr key={agent.name} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ color: '#ccc', marginRight: '8px', fontSize: '0.8rem' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 'bold' }}>{agent.name}</span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>{agent.count}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                      ฿{(agent.commission || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body {
          font-family: 'IBM Plex Sans Thai', sans-serif;
          background-color: #ffffff;
        }
        
        /* ADAPTIVE LAYOUT LOGIC */
        .kpi-grid { grid-template-columns: repeat(4, 1fr); }
        .main-grid { grid-template-columns: 1fr 1fr; }

        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .main-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 640px) {
          .kpi-grid { grid-template-columns: 1fr; }
          header { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          header button { width: 100%; }
        }
      `}</style>
    </main>
  );
}
