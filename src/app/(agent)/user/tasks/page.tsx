'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TaskTracking() {
  const [filter, setFilter] = useState('all');

  const tasks = [
    { id: 'T001', customer: 'คุณวิชัย เจริญยนต์', brand: 'Toyota Camry', status: 'issued', date: 'วันนี้ 09:15', premium: 18500, policyNo: 'POL-12345678' },
    { id: 'T002', customer: 'คุณสมชาย รักไทย', brand: 'Honda Civic', status: 'pending', date: 'วันนี้ 11:30', premium: 15900 },
    { id: 'T003', customer: 'คุณมาลี มีสุข', brand: 'Mazda 2', status: 'rejected', date: 'วานนี้ 14:00', reason: 'รูปภาพเลขเครื่องไม่ชัดเจน' },
  ];

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
        // ในระบบจริงควรโหลดข้อมูลใหม่: window.location.reload();
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
    <main>
      <div className="mobile-only">
        <div className="mobile-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'white', fontSize: '1.5rem', textDecoration: 'none' }}>←</Link>
          <h1 style={{ fontSize: '1.25rem', color: 'white', margin: 0 }}>ติดตามสถานะงาน</h1>
        </div>
      </div>

      <div className="desktop-only" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem' }}>รายการงานที่รอดำเนินการ</h2>
        <p className="text-muted">ตรวจสอบสถานะการพิจารณาและออกกรมธรรม์</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        {/* Filter Tabs */}
        <div className="card" style={{ display: 'flex', padding: '0.4rem', gap: '0.25rem', background: '#e9ecef', borderRadius: '4px', marginBottom: '1.5rem', border: 'none' }}>
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
                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                background: filter === f.id ? 'white' : 'transparent',
                boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                color: filter === f.id ? 'var(--zoho-primary)' : 'var(--zoho-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Task List / Table */}
        <div className="desktop-only">
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid var(--zoho-border)' }}>
                <tr>
                  <th style={{ padding: '1rem' }}>ID / วันที่</th>
                  <th style={{ padding: '1rem' }}>ลูกค้า / ข้อมูลรถ</th>
                  <th style={{ padding: '1rem' }}>สถานะ</th>
                  <th style={{ padding: '1rem' }}>เบี้ยประกัน</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '1.25rem' }}>
                      <p style={{ fontWeight: 'bold' }}>{task.id}</p>
                      <p className="text-muted" style={{ fontSize: '0.75rem' }}>{task.date}</p>
                    </td>
                    <td style={{ padding: '1.25rem' }}>
                      <p style={{ fontWeight: '600' }}>{task.customer}</p>
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>{task.brand}</p>
                    </td>
                    <td style={{ padding: '1.25rem' }}>{getStatusBadge(task.status)}</td>
                    <td style={{ padding: '1.25rem', fontWeight: 'bold', color: 'var(--zoho-accent)' }}>฿{task.premium?.toLocaleString()}</td>
                    <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                       {task.status === 'issued' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-primary" style={{ fontSize: '0.75rem' }}>ส่ง E-Policy</button>
                            <button 
                              className="btn" 
                              style={{ fontSize: '0.75rem', background: '#e03131', color: 'white' }}
                              onClick={() => handleCancel(task.id, task.policyNo || "")}
                            >
                              ยกเลิก
                            </button>
                          </div>
                       ) :
 task.status === 'rejected' ? (
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem', background: 'var(--zoho-danger)' }}>แก้ไขข้อมูล</button>
                       ) : (
                          <button className="btn btn-outline" style={{ fontSize: '0.75rem' }}>แชทสอบถาม</button>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile List */}
        <div className="mobile-only">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card" style={{ padding: '1.25rem', borderLeft: `5px solid ${task.status === 'issued' ? 'var(--zoho-success)' : task.status === 'pending' ? 'var(--zoho-warning)' : 'var(--zoho-danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{task.id} | {task.date}</p>
                  <h3 style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{task.customer}</h3>
                  <p style={{ fontSize: '0.9rem' }}>{task.brand}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {getStatusBadge(task.status)}
                  <p style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.75rem', color: 'var(--zoho-accent)' }}>฿{task.premium?.toLocaleString()}</p>
                </div>
              </div>

              {task.status === 'rejected' && (
                <div style={{ padding: '0.75rem', background: '#fff5f5', borderRadius: '4px', border: '1px solid #ffc9c9', marginBottom: '1rem' }}>
                   <p style={{ fontSize: '0.8rem', color: 'var(--zoho-danger)' }}><strong>สาเหตุ:</strong> {task.reason}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                 {task.status === 'issued' ? (
                    <>
                       <button className="btn btn-primary" style={{ flex: 2, fontSize: '0.8rem' }}>📦 ส่ง E-Policy</button>
                       <button 
                         className="btn" 
                         style={{ flex: 1.5, fontSize: '0.8rem', background: '#e03131', color: 'white' }}
                         onClick={() => handleCancel(task.id, task.policyNo || "")}
                       >
                         ยกเลิก
                       </button>
                    </>
                 ) :
 task.status === 'rejected' ? (
                    <button className="btn btn-primary" style={{ width: '100%', background: 'var(--zoho-danger)', fontSize: '0.8rem' }}>แก้ไขข้อมูลและส่งใหม่</button>
                 ) : (
                    <button className="btn btn-outline" style={{ width: '100%', fontSize: '0.8rem' }}>💬 สอบถาม (LINE)</button>
                 )}
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <p className="text-muted">ไม่พบรายการงานในหมวดหมู่นี้</p>
          </div>
        )}
      </div>
    </main>
  );
}
