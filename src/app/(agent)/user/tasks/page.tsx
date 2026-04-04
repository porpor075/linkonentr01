'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TaskTracking() {
  const [filter, setFilter] = useState('all');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products/contracts/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mappedTasks = data.map((p: any) => ({
            id: p.id.slice(-6).toUpperCase(),
            dbId: p.id,
            customer: p.quotation?.customerName || 'N/A',
            brand: `${p.quotation?.vehicleBrand} ${p.quotation?.vehicleModel}`,
            status: p.status === 'SUCCESS' ? 'issued' : p.status === 'rejected' ? 'rejected' : 'pending',
            date: new Date(p.createdAt).toLocaleDateString('th-TH'),
            premium: Number(p.premiumAmount),
            policyNo: p.policyNumber,
            planName: p.plan?.planName,
            step: p.step,
            reason: p.remark
          }));
          setTasks(mappedTasks);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch tasks failed:', err);
        setLoading(false);
      });
  }, []);

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const handleCancel = async (taskId: string, policyNo: string) => {
    if(!confirm(`ต้องการยกเลิกกรมธรรม์ ${policyNo} ใช่หรือไม่?`)) return;
    
    try {
      const res = await fetch(`/api/products/contracts/${taskId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Agent requested cancellation via portal' })
      });
      const data = await res.json();
      if (data.success) {
        alert('ส่งคำขอยกเลิกไปที่ Allianz สำเร็จ');
      } else {
        alert('ไม่สามารถยกเลิกได้: ' + (data.error?.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + e.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'issued': return <span className="badge badge-success">อนุมัติแล้ว</span>;
      case 'pending': return <span className="badge badge-warning">รอพิจารณา</span>;
      case 'rejected': return <span className="badge badge-danger">ติดปัญหา</span>;
      default: return null;
    }
  };

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>รายการงานที่รอดำเนินการ</h2>
        <p style={{ color: '#666' }}>ตรวจสอบสถานะการพิจารณาและออกกรมธรรม์</p>
      </header>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>กำลังโหลดข้อมูลรายการงาน...</div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          {/* Filter Tabs */}
          <div className="card" style={{ display: 'flex', padding: '0.4rem', gap: '0.25rem', background: '#f1f3f5', borderRadius: '8px', marginBottom: '1.5rem', border: 'none' }}>
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'pending', label: 'รอดำเนินการ' },
              { id: 'issued', label: 'อนุมัติ' },
              { id: 'rejected', label: 'ติดปัญหา' }
            ].map((f) => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold',
                  background: filter === f.id ? 'white' : 'transparent',
                  boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  color: filter === f.id ? '#006aff' : '#666',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Desktop View */}
          <div className="desktop-view">
            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #eee', background: 'white', borderRadius: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                  <tr>
                    <th style={{ padding: '1rem' }}>ID / วันที่</th>
                    <th style={{ padding: '1rem' }}>ลูกค้า / ข้อมูลรถ</th>
                    <th style={{ padding: '1rem' }}>สถานะ</th>
                    <th style={{ padding: '1rem' }}>เบี้ยประกัน</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>ไม่พบรายการงาน</td></tr>
                  ) : (
                    filteredTasks.map((task) => (
                      <tr key={task.dbId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '1.25rem' }}>
                          <p style={{ fontWeight: 'bold', margin: 0 }}>{task.id}</p>
                          <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>{task.date}</p>
                        </td>
                        <td style={{ padding: '1.25rem' }}>
                          <p style={{ fontWeight: '600', marginBottom: '2px', margin: 0 }}>{task.customer}</p>
                          <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>{task.brand} • <span style={{ color: '#006aff' }}>{task.planName}</span></p>
                          {task.status === 'pending' && <p style={{ fontSize: '0.75rem', color: '#f39c12', marginTop: '4px', margin: 0 }}>⏳ {task.step}</p>}
                          {task.status === 'rejected' && <p style={{ fontSize: '0.75rem', color: '#ff4d4f', marginTop: '4px', margin: 0 }}>❌ {task.reason}</p>}
                        </td>
                        <td style={{ padding: '1.25rem' }}>{getStatusBadge(task.status)}</td>
                        <td style={{ padding: '1.25rem', fontWeight: 'bold', color: '#333' }}>฿{task.premium?.toLocaleString()}</td>
                        <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                           {task.status === 'issued' ? (
                              <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '4px' }}>E-Policy</button>
                           ) : (
                              <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '4px' }}>รายละเอียด</button>
                           )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="mobile-view" style={{ display: 'none' }}>
            {filteredTasks.map((task) => (
              <div key={task.dbId} className="card" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: `5px solid ${task.status === 'issued' ? '#2f9e44' : task.status === 'pending' ? '#f39c12' : '#e03131'}`, background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>{task.id} | {task.date}</p>
                    <h3 style={{ fontSize: '1.1rem', marginTop: '0.25rem', marginBottom: '4px' }}>{task.customer}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>{task.brand}</p>
                    <p style={{ fontSize: '0.8rem', color: '#006aff', fontWeight: '500', margin: 0 }}>{task.planName}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {getStatusBadge(task.status)}
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.75rem', color: '#333', margin: 0 }}>฿{task.premium?.toLocaleString()}</p>
                  </div>
                </div>
                {task.status === 'pending' && (
                  <p style={{ fontSize: '0.75rem', color: '#f39c12', marginTop: '8px', background: '#fff9db', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>⏳ {task.step}</p>
                )}
                {task.status === 'rejected' && (
                  <div style={{ padding: '0.75rem', background: '#fff5f5', borderRadius: '4px', border: '1px solid #ffc9c9', marginTop: '1rem' }}>
                     <p style={{ fontSize: '0.8rem', color: '#e03131', margin: 0 }}><strong>สาเหตุ:</strong> {task.reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; }
        .btn-secondary { background: #f8f9fa; color: #333; border: 1px solid #ddd; cursor: pointer; }
        .card { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        @media (max-width: 768px) {
          .desktop-view { display: none !important; }
          .mobile-view { display: block !important; }
        }
      `}</style>
    </main>
  );
}
