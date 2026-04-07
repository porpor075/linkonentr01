'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FUEL_TYPES } from '@/lib/data/vehicles';

export default function CarInsuranceSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    category: 'VMI',
    brand: '',
    model: '',
    year: '',
    subModel: '',
    currentInsurer: '',
    startDate: new Date().toISOString().split('T')[0],
    province: 'กรุงเทพมหานคร',
    birthYear: '2538'
  });

  // Master Data
  const [master, setMaster] = useState<{ brands: any[], models: any, years: any[] }>({
    brands: [], models: {}, years: []
  });

  useEffect(() => {
    setMounted(true);
    fetch('/api/master/vehicles')
      .then(res => res.json())
      .then(data => {
        setMaster(data);
        setLoadingMaster(false);
      });
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = () => {
    localStorage.setItem('insuranceSearchData', JSON.stringify(formData));
    router.push('/user/products');
  };

  if (!mounted || loadingMaster) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>กำลังเตรียมข้อมูล...</div>;

  const currentModels = master.models[formData.brand] || [];

  return (
    <main style={{ background: '#f8f9fa', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Sarabun, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ 
              flex: 1, height: '6px', borderRadius: '10px', 
              background: step >= i ? '#008060' : '#e0e0e0',
              transition: '0.3s'
            }} />
          ))}
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.04)' }}>
          
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>เช็คเบี้ยประกันรถยนต์</h2>
              <p style={{ color: '#666', marginBottom: '32px' }}>ระบุข้อมูลรถยนต์เพื่อค้นหาแผนที่คุ้มค่าที่สุด</p>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>1. ประเภทรถยนต์</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {['VMI', 'CMI'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setFormData({...formData, category: c})}
                      style={{ 
                        padding: '16px', borderRadius: '12px', border: formData.category === c ? '2px solid #008060' : '1px solid #eee',
                        background: formData.category === c ? '#f0f9f6' : 'white',
                        fontWeight: '700', cursor: 'pointer', transition: '0.2s'
                      }}
                    >
                      {c === 'VMI' ? '🚗 ประกันภาคสมัครใจ' : '📋 พ.ร.บ. (ภาคบังคับ)'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>2. ยี่ห้อรถยนต์</label>
                <select 
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value, model: ''})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }}
                >
                  <option value="">เลือกยี่ห้อ</option>
                  {master.brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              {formData.brand && (
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>3. รุ่นรถยนต์</label>
                  <select 
                    value={formData.model}
                    onChange={e => setFormData({...formData, model: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }}
                  >
                    <option value="">เลือกรุ่น</option>
                    {currentModels.map((m: any) => <option key={m.code} value={m.code}>{m.name}</option>)}
                  </select>
                </div>
              )}

              <button 
                disabled={!formData.brand || !formData.model}
                onClick={handleNext}
                style={{ 
                  width: '100%', padding: '16px', borderRadius: '50px', border: 'none', 
                  background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer',
                  opacity: (!formData.brand || !formData.model) ? 0.5 : 1
                }}
              >
                ถัดไป
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px' }}>รายละเอียดรถยนต์</h3>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>4. ปีที่ผลิต</label>
                <select 
                  value={formData.year}
                  onChange={e => setFormData({...formData, year: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                >
                  <option value="">เลือกปี</option>
                  {master.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>5. รุ่นย่อย (Sub-model)</label>
                <select 
                  value={formData.subModel}
                  onChange={e => setFormData({...formData, subModel: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                >
                  <option value="">มาตรฐาน (Standard)</option>
                  <option value="high">รุ่นท็อป (High Spec)</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>บริษัทประกันที่ใช้อยู่</label>
                <select 
                  value={formData.currentInsurer}
                  onChange={e => setFormData({...formData, currentInsurer: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                >
                  <option value="">ไม่ระบุ / ไม่มี</option>
                  <option value="allianz">อลิอันซ์ อยุธยา</option>
                  <option value="viriyah">วิริยะประกันภัย</option>
                  <option value="bangkok">กรุงเทพประกันภัย</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBack} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #ddd', background: 'white', fontWeight: '700', cursor: 'pointer' }}>ย้อนกลับ</button>
                <button onClick={handleNext} style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer' }}>ถัดไป</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px' }}>ข้อมูลผู้ขับขี่และจังหวัด</h3>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>วันที่เริ่มคุ้มครอง</label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>จังหวัดที่จดทะเบียน</label>
                <select 
                  value={formData.province}
                  onChange={e => setFormData({...formData, province: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                >
                  <option>กรุงเทพมหานคร</option>
                  <option>นนทบุรี</option>
                  <option>ชลบุรี</option>
                  <option>เชียงใหม่</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>ปีเกิดของคุณ (พ.ศ.)</label>
                <input 
                  type="number"
                  placeholder="เช่น 2538"
                  value={formData.birthYear}
                  onChange={e => setFormData({...formData, birthYear: e.target.value})}
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #ddd' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleBack} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #ddd', background: 'white', fontWeight: '700', cursor: 'pointer' }}>ย้อนกลับ</button>
                <button onClick={handleSubmit} style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer' }}>ตรวจสอบเบี้ยประกัน</button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}
