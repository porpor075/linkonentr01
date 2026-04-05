'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuotationJourney() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [policyResult, setPolicyResult] = useState<any>(null);
  const [verifyModel, setVerifyModel] = useState('');
  const [verifyYear, setVerifyYear] = useState('');
  const router = useRouter();

  // Master Data State
  const [master, setMaster] = useState<any>({
    nationality: [], title: [], occupation: [], vehicleColor: []
  });
  const [addressData, setAddressData] = useState<any>(null);

  // Selection States
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedSubDistrictId, setSelectedSubDistrictId] = useState('');

  const [formData, setFormData] = useState({
    insured: {
      title: 'MR', firstName: '', lastName: '', idCard: '', birthDate: '1995-01-01',
      gender: 'MALE', phone: '', email: '', addressLine1: '', nationality: 'TH', occupation: '1'
    },
    vehicle: {
      registrationNumber: '', vin: '', engineNumber: '', brand: '', model: '', year: ''
    }
  });

  useEffect(() => {
    setMounted(true);
    const plan = localStorage.getItem('selectedPlan');
    const vehicle = localStorage.getItem('selectedVehicle');
    if (plan) setSelectedPlan(JSON.parse(plan));
    if (vehicle) setSelectedVehicle(JSON.parse(vehicle));

    fetch('/api/master/common').then(res => res.json()).then(setMaster);
    
    fetch('/api/master/address').then(res => res.json()).then(data => {
      if (data && Object.keys(data).length > 0) {
        setAddressData(data);
        const firstProvId = Object.keys(data)[0];
        setSelectedProvinceId(firstProvId);
        
        const districts = data[firstProvId]?.districts;
        if (districts && Object.keys(districts).length > 0) {
          const firstDistId = Object.keys(districts)[0];
          setSelectedDistrictId(firstDistId);
          
          const subs = districts[firstDistId]?.subdistricts;
          if (subs && Object.keys(subs).length > 0) {
            setSelectedSubDistrictId(Object.keys(subs)[0]);
          }
        }
      }
    }).catch(err => console.error('Address load failed', err));
  }, []);

  const handleProvinceChange = (id: string) => {
    setSelectedProvinceId(id);
    const districts = addressData[id]?.districts || {};
    const districtIds = Object.keys(districts);
    if (districtIds.length > 0) {
      const firstDistId = districtIds[0];
      setSelectedDistrictId(firstDistId);
      const subs = districts[firstDistId]?.subdistricts || {};
      const subIds = Object.keys(subs);
      setSelectedSubDistrictId(subIds.length > 0 ? subIds[0] : '');
    } else {
      setSelectedDistrictId('');
      setSelectedSubDistrictId('');
    }
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const subs = addressData[selectedProvinceId]?.districts[id]?.subdistricts || {};
    const subIds = Object.keys(subs);
    setSelectedSubDistrictId(subIds.length > 0 ? subIds[0] : '');
  };

  const handleOCR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/ai/ocr', { method: 'POST', body });
      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          vehicle: {
            ...prev.vehicle,
            registrationNumber: result.data.registrationNumber || prev.vehicle.registrationNumber,
            vin: result.data.vin || prev.vehicle.vin,
            brand: result.data.brand || selectedVehicle?.brandName || '',
            model: result.data.model || selectedVehicle?.modelName || '',
            year: result.data.year || selectedVehicle?.year || ''
          }
        }));
      }
    } catch (err) { console.error('OCR failed', err); }
    finally { setOcrLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const sub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];
      const res = await fetch('/api/products/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insured: { 
            ...formData.insured, 
            province: selectedProvinceId, 
            district: selectedDistrictId, 
            subDistrict: selectedSubDistrictId, 
            postalCode: sub?.zipcode || '' 
          },
          plan: selectedPlan,
          vehicle: { 
            ...selectedVehicle,
            registrationNumber: formData.vehicle.registrationNumber,
            vin: formData.vehicle.vin || ("KNDJA" + Date.now()) 
          },
          premiumAmount: selectedPlan.price,
          planName: selectedPlan.planName,
          planId: selectedPlan.id,
          quotationId: "Q-" + Date.now()
        })
      });
      const data = await res.json();
      if (data.success) { setPolicyResult(data.policy); setStep(4); }
      else { alert('Error: ' + (data.error?.message || 'Submission failed')); }
    } catch (e: any) { alert('Network Error: ' + e.message); }
    finally { setLoading(false); }
  };

  if (!mounted || !selectedPlan || !addressData) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังเตรียมหน้าจอออกกรมธรรม์...</div>;

  const provinceList = Object.entries(addressData).map(([id, p]: any) => ({ id, name: p.name }));
  const districtList = Object.entries(addressData[selectedProvinceId]?.districts || {}).map(([id, d]: any) => ({ id, name: d.name }));
  const subDistrictList = Object.entries(addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts || {}).map(([id, s]: any) => ({ id, name: s.name, zipcode: s.zipcode }));
  const currentSub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];

  const isVehicleVerified = 
    (verifyModel.toUpperCase() === selectedVehicle?.modelName?.toUpperCase() || verifyModel === selectedVehicle?.model) && 
    verifyYear === String(selectedVehicle?.year);

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>ออกกรมธรรม์ (UAT Mapping)</h1>
        <p style={{ color: '#666' }}>ระบุข้อมูลผู้เอาประกันภัยด้วยรหัสมาตรฐาน Allianz Q1/2026</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['1. ข้อมูลผู้เอาประกัน', '2. ข้อมูลรถ & ที่อยู่', '3. ตรวจสอบข้อมูล', '4. สำเร็จ'].map((label, idx) => (
          <div key={idx} style={{ flex: 1, padding: '10px', textAlign: 'center', borderBottom: `4px solid ${step >= idx + 1 ? '#006aff' : '#eee'}`, color: step >= idx + 1 ? '#333' : '#999', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        <section className="card" style={{ padding: '2rem', borderRadius: '16px', background: 'white', border: '1px solid #eee' }}>
          
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem' }}>👤 ข้อมูลผู้เอาประกัน</h3>
              <div>
                <label className="label">คำนำหน้า (Title)</label>
                <select className="input-field" value={formData.insured.title} onChange={e => setFormData({...formData, insured: {...formData.insured, title: e.target.value}})}>
                  {master.title.map((t: any) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ชื่อ</label>
                <input className="input-field" placeholder="ชื่อ" value={formData.insured.firstName} onChange={e => setFormData({...formData, insured: {...formData.insured, firstName: e.target.value}})} />
              </div>
              <div>
                <label className="label">นามสกุล</label>
                <input className="input-field" placeholder="นามสกุล" value={formData.insured.lastName} onChange={e => setFormData({...formData, insured: {...formData.insured, lastName: e.target.value}})} />
              </div>
              <div>
                <label className="label">เลขบัตรประชาชน</label>
                <input className="input-field" placeholder="13 หลัก" value={formData.insured.idCard} onChange={e => setFormData({...formData, insured: {...formData.insured, idCard: e.target.value}})} />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem', borderRadius: '50px', padding: '14px' }}>ขั้นตอนถัดไป</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                🚗 ข้อมูลรถ & ที่อยู่
                <label style={{ fontSize: '0.8rem', background: '#f39c12', color: 'white', padding: '6px 12px', borderRadius: '50px', cursor: 'pointer' }}>
                  {ocrLoading ? '⏳ กำลังสแกน...' : '🤖 สแกนทะเบียน (OCR)'}
                  <input type="file" accept="image/*" onChange={handleOCR} hidden disabled={ocrLoading} />
                </label>
              </h3>
              <div>
                <label className="label">เลขทะเบียน</label>
                <input className="input-field" value={formData.vehicle.registrationNumber} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, registrationNumber: e.target.value}})} />
              </div>
              <div>
                <label className="label">เลขตัวถัง (VIN)</label>
                <input className="input-field" value={formData.vehicle.vin} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, vin: e.target.value}})} />
              </div>

              <div style={{ gridColumn: 'span 2' }}><hr style={{ border: 'none', borderTop: '1px solid #eee' }} /></div>

              <div>
                <label className="label">จังหวัด</label>
                <select className="input-field" value={selectedProvinceId} onChange={e => handleProvinceChange(e.target.value)}>
                  {provinceList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">อำเภอ / เขต</label>
                <select className="input-field" value={selectedDistrictId} onChange={e => handleDistrictChange(e.target.value)}>
                  {districtList.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ตำบล / แขวง</label>
                <select className="input-field" value={selectedSubDistrictId} onChange={e => setSelectedSubDistrictId(e.target.value)}>
                  {subDistrictList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">รหัสไปรษณีย์</label>
                <input className="input-field" value={currentSub?.zipcode || ''} readOnly style={{ background: '#f5f5f5' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2, borderRadius: '50px' }}>ตรวจสอบข้อมูล</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>📋 ยืนยันข้อมูลสุดท้าย</h3>
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px' }}>
                <p><strong>ผู้เอาประกัน:</strong> {formData.insured.firstName} {formData.insured.lastName}</p>
                <p><strong>เลขทะเบียน:</strong> {formData.vehicle.registrationNumber}</p>
                <p><strong>ที่อยู่:</strong> {addressData[selectedProvinceId]?.name} {addressData[selectedProvinceId]?.districts[selectedDistrictId]?.name} {currentSub?.name}</p>
              </div>
              <div style={{ background: '#fff9db', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffe066' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>⚠️ กรุณายืนยัน รุ่นรถ และ ปีรถ อีกครั้ง</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="input-field" placeholder="รุ่นรถ" value={verifyModel} onChange={e => setVerifyModel(e.target.value)} />
                  <input className="input-field" placeholder="ปีรถ (ค.ศ.)" value={verifyYear} onChange={e => setVerifyYear(e.target.value)} />
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '10px', color: isVehicleVerified ? 'green' : 'red' }}>
                  {isVehicleVerified ? '✅ ข้อมูลตรงกัน' : '❌ ข้อมูลไม่ตรงกับที่เลือกไว้'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button onClick={handleSubmit} disabled={loading || !isVehicleVerified} className="btn-primary" style={{ flex: 2, borderRadius: '50px', opacity: (loading || !isVehicleVerified) ? 0.5 : 1 }}>ยืนยันและออกกรมธรรม์</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2>ออกกรมธรรม์สำเร็จ!</h2>
              <p>เลขที่กรมธรรม์: <strong>{policyResult?.policyNumber}</strong></p>
              <Link href="/user"><button className="btn-primary" style={{ marginTop: '2rem', borderRadius: '50px', padding: '10px 30px' }}>กลับหน้าหลัก</button></Link>
            </div>
          )}
        </section>

        {/* Sidebar Summary */}
        <section className="card" style={{ padding: '1.5rem', background: '#1a1a1a', color: 'white', borderRadius: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '1rem' }}>สรุปความคุ้มครอง</h3>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>บริษัทประกัน</p>
          <p style={{ fontWeight: 'bold' }}>{selectedPlan.name}</p>
          <p style={{ fontSize: '0.8rem', color: '#888', margin: 0, marginTop: '1rem' }}>แผนประกัน</p>
          <p style={{ fontWeight: 'bold' }}>{selectedPlan.planName}</p>
          <div style={{ paddingTop: '1rem', borderTop: '1px solid #333', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>ยอดเบี้ยรวมสุทธิ</p>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#006aff' }}>฿{selectedPlan.price?.toLocaleString()}</p>
          </div>
        </section>
      </div>

      <style jsx global>{`
        body { font-family: sans-serif; background-color: #f8f9fa; }
        .label { display: block; font-size: 0.8rem; color: #666; margin-bottom: 4px; }
        .input-field { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd; outline: none; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; padding: 12px; }
        .btn-secondary { background: #eee; color: #333; border: none; cursor: pointer; font-weight: bold; padding: 12px; }
        .card { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      `}</style>
    </main>
  );
}
