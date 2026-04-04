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
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
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
    
    // Fetch Master Data
    fetch('/api/master/vehicles')
      .then(res => res.json())
      .then(data => {
        setMaster(data);
        if (data.brands.length > 0) {
          const firstBrand = data.brands[0].code;
          const firstYear = data.years[0];
          const firstModel = data.models[firstBrand]?.[0]?.code || '';
          setVehicle(prev => ({ 
            ...prev, 
            brand: firstBrand, 
            year: firstYear,
            model: firstModel
          }));
        }
      });

    // Fetch Plan Types (จากทุกบริษัท)
    fetch('/api/admin/products')
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const activePlans = data.filter(p => p.isActive);
          setAvailablePlanTypes(activePlans);
          if (activePlans.length > 0) {
            // ล็อกค่า VMI1 เป็นค่าเริ่มต้นถ้ามี
            const defaultPlan = activePlans.find(p => p.planCode === 'VMI1') || activePlans[0];
            setVehicle(prev => ({ ...prev, planType: defaultPlan.planCode }));
          }
        }
      })
      .catch(err => console.error('Failed to fetch available plans:', err));
  }, []);

  // 2. Fetch Sum Insured Range when Vehicle selection changes
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
    setExpandedIdx(null);
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
      console.log('--- API RESPONSE DEBUG ---');
      console.log('Status:', data.status);
      console.log('Plans Count:', data.plans?.length);
      console.log('Plans Data:', data.plans);
      
      const formattedPlans = (data.plans || []).map((p: any) => {
        // หาค่าทุนประกัน: ลองหาจาก coverages (API) หรือใช้ confirmedSumInsured (Manual)
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

  const currentModels = master.models[vehicle.brand] || [];

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>เช็คเบี้ยประกันภัย (UAT Master Data)</h1>
        <p style={{ color: '#666' }}>ระบบเปรียบเทียบเบี้ยประกันภัยออนไลน์พร้อมข้อมูลจริง Q1/2026</p>
      </header>

      <div className="adaptive-grid" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        <section className="card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'white', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setSearchMode('single')} 
              style={{ 
                flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: searchMode === 'single' ? '3px solid #006aff' : 'none',
                color: searchMode === 'single' ? '#006aff' : '#999', fontWeight: 'bold'
              }}
            >
              เช็คแผนเดียว
            </button>
            <button 
              onClick={() => setSearchMode('multiple')} 
              style={{ 
                flex: 1, padding: '10px', border: 'none', background: 'none', cursor: 'pointer',
                borderBottom: searchMode === 'multiple' ? '3px solid #006aff' : 'none',
                color: searchMode === 'multiple' ? '#006aff' : '#999', fontWeight: 'bold'
              }}
            >
              เช็คหลายแผน
            </button>
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>🚗 ข้อมูลรถยนต์</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <button onClick={() => setInsuranceCategory('VMI')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: insuranceCategory === 'VMI' ? '#006aff' : 'white', color: insuranceCategory === 'VMI' ? 'white' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>VMI</button>
            <button onClick={() => setInsuranceCategory('CMI')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: insuranceCategory === 'CMI' ? '#006aff' : 'white', color: insuranceCategory === 'CMI' ? 'white' : '#333', fontWeight: 'bold', cursor: 'pointer' }}>CMI</button>
          </div>

          <div style={{ display: 'grid', gap: '1.2rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '5px' }}>ยี่ห้อรถยนต์</label>
              <select 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} 
                value={vehicle.brand} 
                onChange={e => {
                  const newBrand = e.target.value;
                  const firstModel = master.models[newBrand]?.[0]?.code || '';
                  setVehicle({...vehicle, brand: newBrand, model: firstModel});
                }}
              >
                {master.brands.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '5px' }}>รุ่นรถยนต์</label>
              <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} value={vehicle.model} onChange={e => setVehicle({...vehicle, model: e.target.value})}>
                {currentModels.map((m: any) => <option key={m.code} value={m.code}>{m.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '5px' }}>ปีจดทะเบียน</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} value={vehicle.year} onChange={e => setVehicle({...vehicle, year: e.target.value})}>
                  {master.years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '5px' }}>เชื้อเพลิง</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eee' }} value={vehicle.fuelType} onChange={e => setVehicle({...vehicle, fuelType: e.target.value})}>
                  {FUEL_TYPES.map(f => <option key={f.code} value={f.code}>{f.name}</option>)}
                </select>
              </div>
            </div>

            {insuranceCategory === 'VMI' && searchMode === 'single' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', marginBottom: '5px' }}>
                  ทุนประกัน: ฿{vehicle.sumInsured?.toLocaleString() || '0'}
                </label>
                <input 
                  type="range" 
                  min={siRange.min} 
                  max={siRange.max} 
                  step="10000" 
                  style={{ width: '100%' }} 
                  value={vehicle.sumInsured} 
                  onChange={e => setVehicle({...vehicle, sumInsured: Number(e.target.value)})} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999' }}>
                  <span>Min: ฿{siRange.min.toLocaleString()}</span>
                  <span>Max: ฿{siRange.max.toLocaleString()}</span>
                </div>
              </div>
            )}

            {searchMode === 'multiple' && (
              <div style={{ background: '#f0f7ff', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', color: '#006aff' }}>
                💡 ระบบจะดึงข้อมูลเบี้ยประกันของทุกแผนที่มี (1, 2+, 3+) มาแสดงเปรียบเทียบกันโดยอัตโนมัติ
              </div>
            )}

            <button onClick={handleSearch} disabled={loading} className="btn-primary" style={{ marginTop: '1rem', padding: '14px', borderRadius: '50px', fontWeight: 'bold' }}>
              {loading ? 'กำลังค้นหาเบี้ย...' : '🔍 ค้นหาเบี้ยประกัน'}
            </button>
            {debugMsg && <p style={{ color: 'red', fontSize: '0.8rem', textAlign: 'center' }}>{debugMsg}</p>}
          </div>
        </section>

        <section>
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px', background: 'white', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.85rem' }}>แผนประกัน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem' }}>ทุนประกัน</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>เบี้ยสุทธิ</th>
                  <th style={{ padding: '1rem', fontSize: '0.85rem', textAlign: 'right' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan, idx) => (
                  <React.Fragment key={idx}>
                    <tr style={{ borderBottom: expandedIdx === idx ? 'none' : '1px solid #f5f5f5' }}>
                      <td style={{ padding: '1rem' }}>
                        <p style={{ fontWeight: 'bold', margin: 0, color: '#006aff' }}>{plan.planName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <small style={{ color: '#888' }}>Allianz Ayudhya • {plan.repairType || 'ซ่อมตามแผน'}</small>
                           <button onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)} style={{ background: 'none', border: 'none', color: '#006aff', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
                             {expandedIdx === idx ? '▲ ปิดรายละเอียด' : '▼ ดูความคุ้มครอง'}
                           </button>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>฿{plan.confirmedSumInsured?.toLocaleString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ff4d4f', margin: 0 }}>฿{plan.price?.toLocaleString() || '0'}</p>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { 
                            localStorage.setItem('selectedPlan', JSON.stringify(plan)); 
                            localStorage.setItem('selectedVehicle', JSON.stringify(vehicle)); 
                            router.push('/user/quotation'); 
                          }} 
                          className="btn-primary" 
                          style={{ padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem' }}
                        >
                          เลือกแผน
                        </button>
                      </td>
                    </tr>
                    {expandedIdx === idx && (
                      <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td colSpan={4} style={{ padding: '0 1rem 1.5rem 1rem', background: '#fcfcfc' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0', background: 'white' }}>
                            {plan.coverages?.map((cov: any, cidx: number) => (
                              <div key={cidx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#666' }}>{cov.title}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#333' }}>{cov.value === 'N/A' ? 'คุ้มครอง' : `฿${cov.value}`}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {plans.length === 0 && !loading && (
                  <tr><td colSpan={4} style={{ padding: '5rem', textAlign: 'center', color: '#999' }}>กรอกข้อมูลด้านซ้ายเพื่อเช็คเบี้ย</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body { font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #ffffff; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-primary:disabled { background: #ccc; cursor: not-allowed; }
        .card { box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        @media (max-width: 1024px) {
          .adaptive-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
