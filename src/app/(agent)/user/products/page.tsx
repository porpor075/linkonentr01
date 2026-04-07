'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FUEL_TYPES } from '@/lib/data/vehicles';

export default function ConsistentProductSearch() {
  const [mounted, setMounted] = useState(false);
  const [insuranceCategory, setInsuranceCategory] = useState<'VMI' | 'CMI'>('VMI');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [availablePlanTypes, setAvailablePlanTypes] = useState<any[]>([]);
  const [debugMsg, setDebugMsg] = useState('');
  const [searchMode, setSearchMode] = useState<'single' | 'multiple'>('single');
  
  // Master Data State
  const [master, setMaster] = useState<{ brands: any[], models: any, years: any[] }>({
    brands: [], models: {}, years: []
  });
  const [siRange, setSiRange] = useState({ min: 100000, max: 2000000 });
  
  const router = useRouter();

  const [vehicle, setVehicle] = useState({
    brand: '', model: '', year: '', fuelType: 'PETROL',
    sumInsured: 500000, listSumInsured: 500000, planType: 'VMI1', registrationNumber: ''
  });

  // 1. Initial Load: Master Data & Plan Types
  useEffect(() => {
    setMounted(true);
    
    // Check for saved search data
    const savedData = localStorage.getItem('insuranceSearchData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setVehicle(prev => ({
        ...prev,
        brand: parsed.brand,
        model: parsed.model,
        year: parsed.year,
        insuranceCategory: parsed.category
      }));
      setInsuranceCategory(parsed.category);
    }

    // Fetch Master Data
    fetch('/api/master/vehicles')
      .then(res => res.json())
      .then(data => {
        setMaster(data);
      });

    // Fetch Plan Types
    fetch('/api/admin/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const activePlans = data.filter(p => p.isActive);
          setAvailablePlanTypes(activePlans);
          if (activePlans.length > 0) {
            const defaultPlan = activePlans.find(p => p.planCode === 'VMI1') || activePlans[0];
            setVehicle(prev => ({ ...prev, planType: defaultPlan.planCode }));
          }
        }
      })
      .catch(err => console.error('Failed to fetch available plans:', err));
  }, []);

  // 3. Auto-search if data is present
  useEffect(() => {
    if (mounted && vehicle.brand && vehicle.model && vehicle.year) {
      handleSearch();
    }
  }, [mounted]);

  // 2. Fetch Sum Insured Range
  useEffect(() => {
    if (vehicle.brand && vehicle.model && vehicle.year) {
      fetch(`/api/master/sum-insured?brand=${vehicle.brand}&model=${vehicle.model}&year=${vehicle.year}`)
        .then(res => res.json())
        .then(data => {
          setSiRange({ min: data.min, max: data.max });
          if (vehicle.sumInsured < data.min) setVehicle(v => ({ ...v, sumInsured: data.min }));
          if (vehicle.sumInsured > data.max) setVehicle(v => ({ ...v, sumInsured: data.max }));
        });
    }
  }, [vehicle.brand, vehicle.model, vehicle.year]);

  const handleSearch = async () => {
    setLoading(true);
    setPlans([]);
    setDebugMsg('');
    try {
      const res = await fetch('/api/products/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...vehicle, 
          searchMode: searchMode === 'single' ? 'quick' : 'list', 
          insuranceCategory,
          managedPlans: searchMode === 'multiple' ? availablePlanTypes : []
        })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      
      const formattedPlans = (data.plans || []).map((p: any) => {
        let sumInsuredVal = p.confirmedSumInsured || 'N/A';
        const odCoverage = p.coverages?.find((c: any) => c.code === 'OD' || c.title?.includes('ทุน'));
        if (odCoverage) sumInsuredVal = odCoverage.value;

        return { 
          ...p, 
          confirmedSumInsured: sumInsuredVal 
        };
      });
      setPlans(formattedPlans);
      if (formattedPlans.length === 0) setDebugMsg('ไม่พบแผนประกันที่ตรงตามเงื่อนไข');
    } catch (error: any) {
      setDebugMsg(error.message);
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <main style={{ background: '#f8f9fa', minHeight: '100vh', padding: '24px', fontFamily: 'Sarabun, sans-serif' }}>
      {/* 1. Vehicle Summary Header */}
      <header style={{ 
        background: 'white', padding: '16px 24px', borderRadius: '16px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🚗</span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, color: '#333' }}>
              {master.brands.find(b => b.code === vehicle.brand)?.name || 'Toyota'} {master.models[vehicle.brand]?.find((m: any) => m.code === vehicle.model)?.name || 'Camry'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#666', margin: 0 }}>ปี {vehicle.year || '2024'} • {FUEL_TYPES.find(f => f.code === vehicle.fuelType)?.name || 'Hybrid'}</p>
          </div>
        </div>
        <button onClick={() => router.push('/user/dashboard')} style={{ 
          padding: '8px 20px', borderRadius: '10px', border: '1px solid #eee', background: 'white', 
          fontWeight: '600', cursor: 'pointer', transition: '0.2s'
        }}>
          ✏️ แก้ไขข้อมูล
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        
        {/* 2. Filters Sidebar */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              ตัวกรอง 
              <span onClick={() => window.location.reload()} style={{ color: '#008060', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '500' }}>ล้างค่า</span>
            </h3>
            
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: '#444' }}>ประเภทการซ่อม</label>
              <div style={{ display: 'grid', gap: '12px' }}>
                {['ซ่อมศูนย์ (ห้าง)', 'ซ่อมอู่'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', cursor: 'pointer', color: '#555' }}>
                    <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px', accentColor: '#008060', cursor: 'pointer' }} /> {type}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: '#444' }}>ค่าเสียหายส่วนแรก</label>
              <div style={{ display: 'grid', gap: '12px' }}>
                {['ไม่มีค่าเสียหายส่วนแรก', '3,000 บาท', '5,000 บาท'].map(val => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', cursor: 'pointer', color: '#555' }}>
                    <input type="checkbox" style={{ width: '20px', height: '20px', accentColor: '#008060', cursor: 'pointer' }} /> {val}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', marginBottom: '16px', color: '#444' }}>ทุนประกัน</label>
              <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none', fontSize: '0.9rem' }}>
                <option>ทั้งหมด</option>
                <option>300,000 - 500,000</option>
                <option>500,000 - 700,000</option>
                <option>700,000 ขึ้นไป</option>
              </select>
            </div>
          </div>
        </aside>

        {/* 3. Main Results Area */}
        <section>
          {/* Plan Tabs */}
          <div style={{ 
            background: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #eee', 
            display: 'flex', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
          }}>
            {['VMI1', 'VMI2+', 'VMI2', 'VMI3+', 'VMI3'].map(p => (
              <button 
                key={p}
                onClick={() => {
                  setVehicle({...vehicle, planType: p});
                  handleSearch();
                }}
                style={{ 
                  flex: 1, padding: '14px', 
                  background: vehicle.planType === p ? '#E6F2ED' : 'transparent',
                  borderRadius: '12px', color: vehicle.planType === p ? '#008060' : '#777', 
                  fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: vehicle.planType === p ? '1.5px solid #008060' : '1.5px solid transparent'
                }}
              >
                {p === 'VMI1' ? 'ชั้น 1' : p === 'VMI2+' ? 'ชั้น 2+' : p === 'VMI2' ? 'ชั้น 2' : p === 'VMI3+' ? 'ชั้น 3+' : 'ชั้น 3'}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '120px', background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #008060', borderRadius: '50%', margin: '0 auto 20px auto', animation: 'spin 1s linear infinite' }}></div>
                <p style={{ color: '#666', fontWeight: '500' }}>กำลังคำนวณเบี้ยประกันที่ดีที่สุดสำหรับคุณ...</p>
              </div>
            ) : plans.length > 0 ? (
              plans.map((plan, idx) => (
                <div key={idx} style={{ 
                  background: 'white', borderRadius: '24px', border: '1px solid #eee', overflow: 'hidden',
                  display: 'grid', gridTemplateColumns: '1.3fr 1fr', boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s', cursor: 'default'
                }}>
                  {/* Left: Info */}
                  <div style={{ padding: '32px', borderRight: '1px solid #f8f8f8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1a1a1a' }}>{plan.name}</h4>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#f0f0f0', fontSize: '0.7rem', fontWeight: '700', color: '#666' }}>{plan.planType}</span>
                        </div>
                        <span style={{ fontSize: '0.95rem', color: '#008060', fontWeight: '600' }}>{plan.planName}</span>
                      </div>
                      {plan.logoUrl && <img src={plan.logoUrl} alt="" style={{ height: '40px', maxWidth: '100px', objectFit: 'contain' }} />}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px', padding: '20px', background: '#f9fbf9', borderRadius: '16px', border: '1px solid #edf2ef' }}>
                      <div>
                        <small style={{ color: '#888', display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>ทุนประกัน</small>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#333' }}>{typeof plan.confirmedSumInsured === 'number' ? plan.confirmedSumInsured.toLocaleString() : plan.confirmedSumInsured} <small style={{ fontSize: '0.8rem', fontWeight: '500' }}>บาท</small></span>
                      </div>
                      <div>
                        <small style={{ color: '#888', display: 'block', marginBottom: '4px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase' }}>ค่าเสียหายส่วนแรก</small>
                        <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#333' }}>ไม่มี</span>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#008060', fontWeight: '600' }}>
                        🛡️ ช่วยเหลือฉุกเฉิน 24 ชม.
                      </span>
                      {plan.isApi && <span style={{ padding: '4px 12px', borderRadius: '20px', background: '#E6F2ED', color: '#008060', fontSize: '0.75rem', fontWeight: '700' }}>⚡️ ดึงราคาจาก API</span>}
                    </div>
                  </div>

                  {/* Right: Price & Action */}
                  <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#fafafa' }}>
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#888', fontWeight: '600' }}>เบี้ยประกันรวมภาษี</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '2.4rem', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-1px' }}>{Number(plan.price).toLocaleString()}</span>
                        <span style={{ fontSize: '1rem', color: '#666', fontWeight: '700' }}>บาท</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#008060', background: '#E6F2ED', padding: '2px 10px', borderRadius: '10px', fontWeight: '700' }}>ประหยัดกว่า 15%</span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', width: '100%' }}>
                      <button style={{ 
                        padding: '14px', borderRadius: '14px', border: '1px solid #ddd', background: 'white', 
                        fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', transition: '0.2s'
                      }}>
                        รายละเอียด
                      </button>
                      <button 
                        onClick={() => {
                          localStorage.setItem('selectedPlan', JSON.stringify(plan));
                          router.push('/user/quotation');
                        }}
                        style={{ 
                          padding: '14px', borderRadius: '14px', border: 'none', background: '#008060', 
                          color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem',
                          boxShadow: '0 4px 12px rgba(0,128,96,0.2)', transition: '0.2s'
                        }}
                      >
                        เลือกแผนนี้
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '24px', border: '2px dashed #eee' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                <h3 style={{ color: '#333', marginBottom: '8px' }}>ยังไม่ได้เลือกข้อมูลการเช็คเบี้ย</h3>
                <p style={{ color: '#999', maxWidth: '300px', margin: '0 auto 24px auto' }}>กรุณากดปุ่มด้านล่างเพื่อเริ่มค้นหาแผนประกันภัยที่คุ้มค่าที่สุด</p>
                <button onClick={handleSearch} style={{ 
                  padding: '16px 48px', borderRadius: '50px', background: '#008060', color: 'white', 
                  border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '1rem',
                  boxShadow: '0 10px 20px rgba(0,128,96,0.15)'
                }}>
                  เริ่มค้นหาเบี้ยประกัน
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        button:hover { filter: brightness(0.95); transform: translateY(-1px); }
        button:active { transform: translateY(0); }
      `}</style>
    </main>
  );
}
