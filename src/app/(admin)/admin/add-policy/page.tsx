'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AddPolicyManual() {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    carPlate: '',
    brand: 'Toyota',
    model: '',
    year: '2024',
    insurer: 'วิริยะประกันภัย',
    premium: '',
    status: 'pending'
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving Policy:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <main>
      <div className="mobile-only">
        <header className="mobile-header" style={{ background: '#001F3F' }}>
           <Link href="/admin" style={{ color: 'var(--zoho-warning)', textDecoration: 'none', display: 'block', marginBottom: '1rem' }}>← กลับ</Link>
           <h1 style={{ fontSize: '1.5rem', color: 'white' }}>คีย์กรมธรรม์มือ</h1>
        </header>
      </div>

      <div className="desktop-only" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>คีย์กรมธรรม์มือ (Manual Entry)</h2>
        <p className="text-muted">สำหรับแอดมินใช้เพิ่มข้อมูลกรมธรรม์เข้าระบบโดยตรง</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} className="card">
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--zoho-border)', paddingBottom: '1rem' }}>
             ข้อมูลลูกค้าและรถยนต์
          </h3>
          
          <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>ชื่อ-นามสกุล ลูกค้า</label>
              <input 
                type="text" required
                value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                placeholder="ระบุชื่อจริง-นามสกุล" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }} 
              />
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>เบอร์โทรศัพท์</label>
              <input 
                type="tel" required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="08X-XXX-XXXX" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }} 
              />
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>ทะเบียนรถ</label>
              <input 
                type="text" required
                value={formData.carPlate}
                onChange={(e) => setFormData({...formData, carPlate: e.target.value})}
                placeholder="กข 1234 กทม" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }} 
              />
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>ปีรถ</label>
              <select 
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }}
              >
                {[2024, 2023, 2022, 2021, 2020].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--zoho-border)', paddingBottom: '1rem', marginTop: '2.5rem' }}>
             ข้อมูลกรมธรรม์
          </h3>

          <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>บริษัทประกันภัย</label>
              <select 
                value={formData.insurer}
                onChange={(e) => setFormData({...formData, insurer: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }}
              >
                <option value="วิริยะประกันภัย">วิริยะประกันภัย</option>
                <option value="ธนชาตประกันภัย">ธนชาตประกันภัย</option>
                <option value="กรุงเทพประกันภัย">กรุงเทพประกันภัย</option>
                <option value="สินมั่นคง">สินมั่นคง</option>
              </select>
            </div>
            <div>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>เบี้ยประกันสุทธิ (บาท)</label>
              <input 
                type="number" required
                value={formData.premium}
                onChange={(e) => setFormData({...formData, premium: e.target.value})}
                placeholder="0.00" 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }} 
              />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>สถานะเริ่มต้น</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--zoho-border)', background: 'white' }}
              >
                <option value="pending">รอตรวจสอบ</option>
                <option value="issued">ออกกรมธรรม์แล้ว</option>
                <option value="rejected">มีปัญหา/แก้ไข</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--zoho-border)', paddingTop: '1.5rem' }}>
             <button type="button" className="btn btn-outline" style={{ flex: 1 }}>ล้าง</button>
             <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>บันทึกข้อมูล</button>
          </div>

          {submitted && (
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--zoho-success)', color: 'white', borderRadius: '12px', textAlign: 'center', fontWeight: 'bold' }}>
               ✓ บันทึกข้อมูลสำเร็จ!
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
