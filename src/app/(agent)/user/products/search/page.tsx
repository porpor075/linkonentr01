'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CAR_TYPES = [
  { id: '1', name: 'รถเก๋ง / SUV', icon: '🚗' },
  { id: '2', name: 'รถกระบะ 2 ประตู', icon: '🛻' },
  { id: '3', name: 'รถกระบะ 4 ประตู', icon: '🚙' },
  { id: '4', name: 'รถตู้', icon: '🚐' },
];

const COMMON_BRANDS = [
  { code: '39', name: 'TOYOTA' },
  { code: '16', name: 'HONDA' },
  { code: '18', name: 'ISUZU' },
  { code: '27', name: 'NISSAN' },
  { code: '24', name: 'MAZDA' },
  { code: '26', name: 'MITSUBISHI' },
  { code: '13', name: 'FORD' },
  { code: '25', name: 'MG' },
];

export default function InteractiveSearch() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);

  // Data State
  const [master, setMaster] = useState<{ brands: any[], models: any, years: any[] }>({
    brands: [], models: {}, years: []
  });

  // Form State
  const [selection, setStepData] = useState({
    type: '1',
    brand: '',
    model: '',
    year: '',
    subModel: '',
    currentInsurer: '',
    startDate: new Date().toISOString().split('T')[0],
    province: 'กรุงเทพมหานคร',
    birthYear: '2538'
  });

  useEffect(() => {
    setMounted(true);
    fetch('/api/master/vehicles')
      .then(res => res.json())
      .then(data => {
        setMaster(data);
        setLoading(false);
      });
  }, []);

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const finish = () => {
    localStorage.setItem('insuranceSearchData', JSON.stringify({
      ...selection,
      category: selection.type === '1' ? 'VMI' : 'VMI', // Simplified for demo
    }));
    router.push('/user/products');
  };

  if (!mounted || loading) return null;

  const currentModels = master.models[selection.brand] || [];

  return (
    <main style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'Sarabun, sans-serif' }}>
      {/* Header */}
      <nav style={{ background: 'white', padding: '15px 40px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: '700', color: '#008060' }}>เช็คเบี้ยประกันรถยนต์</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        
        {/* Progress Bar */}
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '10px' }}>ขั้นตอนที่ {step} จาก 5</p>
          <div style={{ display: 'flex', gap: '5px', height: '4px', background: '#e0e0e0', borderRadius: '10px', overflow: 'hidden' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ flex: 1, background: step >= i ? '#008060' : 'transparent', transition: '0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          
          {/* STEP 1: ประเภทรถ */}
          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>1. คุณใช้รถประเภทไหนครับ?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {CAR_TYPES.map(t => (
                  <button 
                    key={t.id}
                    onClick={() => { setStepData({...selection, type: t.id}); next(); }}
                    style={{ 
                      padding: '30px', borderRadius: '20px', border: selection.type === t.id ? '2px solid #008060' : '1px solid #eee',
                      background: selection.type === t.id ? '#f0f9f6' : 'white', cursor: 'pointer', transition: '0.2s'
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{t.icon}</div>
                    <div style={{ fontWeight: '700', color: '#333' }}>{t.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: ยี่ห้อรถ */}
          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>2. เลือกระบุยี่ห้อรถยนต์</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                {COMMON_BRANDS.map(b => (
                  <button 
                    key={b.code}
                    onClick={() => { setStepData({...selection, brand: b.code}); next(); }}
                    style={{ 
                      padding: '20px 10px', borderRadius: '16px', border: selection.brand === b.code ? '2px solid #008060' : '1px solid #eee',
                      background: 'white', cursor: 'pointer', transition: '0.2s', textAlign: 'center'
                    }}
                  >
                    <div style={{ fontWeight: '700', color: '#333', fontSize: '0.9rem' }}>{b.name}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <select 
                  onChange={(e) => { if(e.target.value) { setStepData({...selection, brand: e.target.value}); next(); } }}
                  style={{ padding: '10px', borderRadius: '10px', border: '1px solid #eee', color: '#888' }}
                >
                  <option value="">ยี่ห้ออื่นๆ</option>
                  {master.brands.filter(b => !COMMON_BRANDS.find(cb => cb.code === b.code)).map(b => (
                    <option key={b.code} value={b.code}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={back} style={{ marginTop: '30px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>ย้อนกลับ</button>
            </div>
          )}

          {/* STEP 3: รุ่นรถ และ ปี */}
          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px', textAlign: 'center' }}>3. เลือกโฉมและปีรถยนต์</h2>
              <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>{master.brands.find(b => b.code === selection.brand)?.name}</p>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>รุ่นรถ (Model)</label>
                  <select 
                    value={selection.model}
                    onChange={e => setStepData({...selection, model: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  >
                    <option value="">กรุณาเลือกรุ่น</option>
                    {currentModels.map((m: any) => <option key={m.code} value={m.code}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>ปีที่ผลิต (Year)</label>
                  <select 
                    value={selection.year}
                    onChange={e => setStepData({...selection, year: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem' }}
                  >
                    <option value="">กรุณาเลือกปี</option>
                    {master.years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                <button onClick={back} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #ddd', background: 'white', fontWeight: '700', cursor: 'pointer' }}>ย้อนกลับ</button>
                <button disabled={!selection.model || !selection.year} onClick={next} style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer', opacity: (!selection.model || !selection.year) ? 0.5 : 1 }}>ถัดไป</button>
              </div>
            </div>
          )}

          {/* STEP 4: รุ่นย่อย และ ประกันเดิม */}
          {step === 4 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>4. รายละเอียดเพิ่มเติม</h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>รุ่นย่อย (Sub-model)</label>
                  <select 
                    value={selection.subModel}
                    onChange={e => setStepData({...selection, subModel: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}
                  >
                    <option value="">ทุกรุ่นย่อย (Standard)</option>
                    <option value="high">รุ่นท็อป / เครื่องยนต์สูงกว่า</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>บริษัทประกันรถยนต์ที่ใช้อยู่</label>
                  <select 
                    value={selection.currentInsurer}
                    onChange={e => setStepData({...selection, currentInsurer: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}
                  >
                    <option value="">ไม่ระบุ / ไม่มี</option>
                    <option value="allianz">อลิอันซ์ อยุธยา</option>
                    <option value="viriyah">วิริยะประกันภัย</option>
                    <option value="bangkok">กรุงเทพประกันภัย</option>
                    <option value="other">อื่นๆ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                <button onClick={back} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #ddd', background: 'white', fontWeight: '700', cursor: 'pointer' }}>ย้อนกลับ</button>
                <button onClick={next} style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer' }}>ถัดไป</button>
              </div>
            </div>
          )}

          {/* STEP 5: วันคุ้มครอง, จังหวัด, ปีเกิด */}
          {step === 5 && (
            <div className="fade-in">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center' }}>5. ขั้นตอนสุดท้ายครับ</h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>วันที่ต้องการให้เริ่มคุ้มครอง</label>
                  <input 
                    type="date"
                    value={selection.startDate}
                    onChange={e => setStepData({...selection, startDate: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>จังหวัดที่จดทะเบียนรถ</label>
                  <select 
                    value={selection.province}
                    onChange={e => setStepData({...selection, province: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}
                  >
                    <option>กรุงเทพมหานคร</option>
                    <option>นนทบุรี</option>
                    <option>ปทุมธานี</option>
                    <option>ชลบุรี</option>
                    <option>อื่นๆ</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: '700', marginBottom: '10px' }}>ปีเกิดของคุณ (พ.ศ.)</label>
                  <input 
                    type="number"
                    placeholder="เช่น 2538"
                    value={selection.birthYear}
                    onChange={e => setStepData({...selection, birthYear: e.target.value})}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ddd' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                <button onClick={back} style={{ flex: 1, padding: '16px', borderRadius: '50px', border: '1px solid #ddd', background: 'white', fontWeight: '700', cursor: 'pointer' }}>ย้อนกลับ</button>
                <button onClick={finish} style={{ flex: 2, padding: '16px', borderRadius: '50px', border: 'none', background: '#008060', color: 'white', fontWeight: '800', cursor: 'pointer' }}>ตรวจสอบเบี้ยประกัน</button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        button:hover { transform: translateY(-2px); filter: brightness(0.98); }
        button:active { transform: translateY(0); }
      `}</style>
    </main>
  );
}
