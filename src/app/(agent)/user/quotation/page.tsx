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

    // Fetch Common Master Data
    fetch('/api/master/common').then(res => res.json()).then(setMaster);
    
    // Fetch Address Data
    fetch('/api/master/address').then(res => res.json()).then(data => {
      setAddressData(data);
      if (data && Object.keys(data).length > 0) {
        const firstProvId = Object.keys(data)[0];
        const firstDistId = Object.keys(data[firstProvId].districts)[0];
        const firstSubId = Object.keys(data[firstProvId].districts[firstDistId].subdistricts)[0];
        
        setSelectedProvinceId(firstProvId);
        setSelectedDistrictId(firstDistId);
        setSelectedSubDistrictId(firstSubId);
      }
    });
  }, []);

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
            engineNumber: result.data.engineNumber || prev.vehicle.engineNumber,
            brand: result.data.brand || selectedVehicle?.brandName || '',
            model: result.data.model || selectedVehicle?.modelName || '',
            year: result.data.year || selectedVehicle?.year || ''
          }
        }));
        alert('AI สแกนข้อมูลและกรอกให้เรียบร้อยแล้ว กรุณาตรวจสอบความถูกต้อง');
      } else {
        alert('AI ไม่สามารถอ่านข้อมูลได้: ' + result.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleProvinceChange = (id: string) => {
    setSelectedProvinceId(id);
    const districts = addressData[id].districts;
    const firstDistId = Object.keys(districts)[0];
    setSelectedDistrictId(firstDistId);
    const subdistricts = districts[firstDistId].subdistricts;
    setSelectedSubDistrictId(Object.keys(subdistricts)[0]);
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const subdistricts = addressData[selectedProvinceId].districts[id].subdistricts;
    setSelectedSubDistrictId(Object.keys(subdistricts)[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const sub = addressData[selectedProvinceId].districts[selectedDistrictId].subdistricts[selectedSubDistrictId];
      const res = await fetch('/api/products/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insured: { 
            ...formData.insured, 
            province: selectedProvinceId, 
            district: selectedDistrictId, 
            subDistrict: selectedSubDistrictId, 
            postalCode: sub.zipcode 
          },
          plan: selectedPlan,
          vehicle: { 
            ...selectedVehicle,
            make: selectedVehicle?.brand || "16", 
            model: selectedVehicle?.model || "1041", 
            yearOfManufacture: selectedVehicle?.year || "2024", 
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
      if (data.success) {
        setPolicyResult(data.policy);
        setStep(4);
      } else {
        alert('Error: ' + (data.error?.message || 'Submission failed'));
      }
    } catch (e: any) {
      alert('Network Error: ' + e.message);
    } finally { setLoading(false); }
  };

  if (!mounted || !selectedPlan || !addressData) return null;

  const provinces = Object.entries(addressData).map(([id, p]: any) => ({ id, name: p.name }));
  const districts = Object.entries(addressData[selectedProvinceId]?.districts || {}).map(([id, d]: any) => ({ id, name: d.name }));
  const subdistricts = Object.entries(addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts || {}).map(([id, s]: any) => ({ id, name: s.name, zipcode: s.zipcode }));
  const currentSub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];

  // Logic สำหรับตรวจสอบข้อมูลซ้ำ
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
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem', marginBottom: '0.5rem' }}>👤 ข้อมูลผู้เอาประกัน</h3>
              <div>
                <label className="label">คำนำหน้า (Title)</label>
                <select className="input-field" value={formData.insured.title} onChange={e => setFormData({...formData, insured: {...formData.insured, title: e.target.value}})}>
                  {master.title.map((t: any) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">สัญชาติ (Nationality)</label>
                <select className="input-field" value={formData.insured.nationality} onChange={e => setFormData({...formData, insured: {...formData.insured, nationality: e.target.value}})}>
                  {master.nationality.map((n: any) => <option key={n.code} value={n.code}>{n.name}</option>)}
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
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">อาชีพ (Occupation)</label>
                <select className="input-field" value={formData.insured.occupation} onChange={e => setFormData({...formData, insured: {...formData.insured, occupation: e.target.value}})}>
                  {master.occupation.map((o: any) => <option key={o.code} value={o.code}>{o.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">เลขบัตรประชาชน</label>
                <input className="input-field" placeholder="เลขประจำตัวประชาชน" value={formData.insured.idCard} onChange={e => setFormData({...formData, insured: {...formData.insured, idCard: e.target.value}})} />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem', borderRadius: '50px', padding: '14px', height: '50px' }}>ขั้นตอนถัดไป</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                🚗 ข้อมูลรถยนต์ที่จดทะเบียน
                <label style={{ fontSize: '0.8rem', background: '#f39c12', color: 'white', padding: '6px 12px', borderRadius: '50px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {ocrLoading ? '⏳ กำลังสแกน...' : '🤖 สแกนเล่มทะเบียน (OCR)'}
                  <input type="file" accept="image/*" onChange={handleOCR} hidden disabled={ocrLoading} />
                </label>
              </h3>
              <div>
                <label className="label">เลขทะเบียนรถ</label>
                <input className="input-field" placeholder="เช่น กข 1234" value={formData.vehicle.registrationNumber} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, registrationNumber: e.target.value}})} />
              </div>
              <div>
                <label className="label">เลขตัวถัง (VIN)</label>
                <input className="input-field" placeholder="17 หลัก" value={formData.vehicle.vin} onChange={e => setFormData({...formData, vehicle: {...formData.vehicle, vin: e.target.value}})} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
                <h3 style={{ fontSize: '1.1rem', marginTop: '1rem' }}>📍 ที่อยู่ตามทะเบียนบ้าน</h3>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">บ้านเลขที่ / หมู่บ้าน / อาคาร</label>
                <input className="input-field" value={formData.insured.addressLine1} onChange={e => setFormData({...formData, insured: {...formData.insured, addressLine1: e.target.value}})} />
              </div>
              <div>
                <label className="label">จังหวัด</label>
                <select className="input-field" value={selectedProvinceId} onChange={e => handleProvinceChange(e.target.value)}>
                  {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">อำเภอ / เขต</label>
                <select className="input-field" value={selectedDistrictId} onChange={e => handleDistrictChange(e.target.value)}>
                  {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ตำบล / แขวง</label>
                <select className="input-field" value={selectedSubDistrictId} onChange={e => setSelectedSubDistrictId(e.target.value)}>
                  {subdistricts.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">รหัสไปรษณีย์</label>
                <input className="input-field" value={currentSub?.zipcode || ''} readOnly style={{ background: '#f5f5f5' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', gridColumn: 'span 2' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px', padding: '14px', height: '50px' }}>ย้อนกลับ</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2, borderRadius: '50px', padding: '14px', height: '50px' }}>ตรวจสอบข้อมูล</button>
              </div>
            </div>
          )}

          {step === 3 && addressData && addressData[selectedProvinceId] && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>📋 ตรวจสอบข้อมูลและยืนยันการชำระเงิน</h3>
              
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
                <p style={{ marginBottom: '10px' }}><strong>ผู้เอาประกัน:</strong> {formData.insured.firstName} {formData.insured.lastName}</p>
                <p style={{ marginBottom: '10px' }}><strong>เลขบัตรประชาชน:</strong> {formData.insured.idCard}</p>
                <p style={{ marginBottom: '10px' }}><strong>เลขทะเบียนรถ:</strong> {formData.vehicle.registrationNumber || 'ยังไม่ได้ระบุ'}</p>
                <p style={{ marginBottom: '10px' }}><strong>เลขตัวถัง (VIN):</strong> {formData.vehicle.vin || 'ยังไม่ได้ระบุ'}</p>
                <p style={{ marginBottom: '0' }}><strong>ที่อยู่:</strong> {formData.insured.addressLine1} {currentSub?.name} {addressData[selectedProvinceId]?.districts[selectedDistrictId]?.name} {addressData[selectedProvinceId]?.name} {currentSub?.zipcode}</p>
              </div>

              {/* ส่วนการยืนยันรุ่นรถ/ปีรถซ้ำ (Double Check) */}
              <div style={{ background: '#fff9db', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffe066' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#856404', marginBottom: '1rem' }}>⚠️ ยืนยันข้อมูลรุ่นและปีรถเพื่อความถูกต้อง</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label className="label">ยืนยันรุ่นรถ (Model)</label>
                    <input 
                      className="input-field" 
                      placeholder="เช่น CAMRY" 
                      value={verifyModel} 
                      onChange={e => setVerifyModel(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="label">ยืนยันปีรถ (Year)</label>
                    <input 
                      className="input-field" 
                      placeholder="เช่น 2024" 
                      value={verifyYear} 
                      onChange={e => setVerifyYear(e.target.value)} 
                    />
                  </div>
                </div>
                {verifyModel && verifyYear && (
                  <p style={{ fontSize: '0.8rem', marginTop: '10px', color: isVehicleVerified ? '#2f9e44' : '#e03131' }}>
                    {isVehicleVerified ? '✅ ข้อมูลถูกต้องตรงกัน' : '❌ ข้อมูลไม่ตรงกับแผนที่เลือกไว้'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px', padding: '14px', height: '50px' }}>ย้อนกลับ</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !isVehicleVerified} 
                  className="btn-primary" 
                  style={{ flex: 2, borderRadius: '50px', padding: '14px', height: '50px', opacity: (loading || !isVehicleVerified) ? 0.5 : 1 }}
                >
                  {loading ? 'กำลังออกกรมธรรม์...' : 'ชำระเงินและออกกรมธรรม์'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontWeight: 'bold' }}>ออกกรมธรรม์สำเร็จ!</h2>
              <p style={{ color: '#666' }}>เลขที่กรมธรรม์: <strong>{policyResult?.policyNumber}</strong></p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '2rem' }}>
                <button className="btn-primary" style={{ borderRadius: '50px', padding: '10px 20px' }}>ดาวน์โหลด E-Policy</button>
                <Link href="/user"><button className="btn-secondary" style={{ borderRadius: '50px', padding: '10px 20px' }}>กลับหน้าหลัก</button></Link>
              </div>
            </div>
          )}
        </section>

        <section className="card" style={{ padding: '1.5rem', background: '#1a1a1a', color: 'white', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '1rem', color: 'white' }}>สรุปความคุ้มครอง</h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>บริษัทประกัน</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedPlan.name}</p>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>แผนประกัน</p>
            <p style={{ fontWeight: 'bold' }}>{selectedPlan.planName}</p>
          </div>
          
          {selectedPlan.coverages && selectedPlan.coverages.length > 0 && (
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid #333', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#006aff', fontWeight: 'bold', marginBottom: '10px' }}>รายละเอียดความคุ้มครอง</p>
              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedPlan.coverages.slice(0, 6).map((cov: any, cidx: number) => (
                  <div key={cidx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span style={{ color: '#bbb' }}>{cov.title}</span>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{cov.value}</span>
                  </div>
                ))}
                {selectedPlan.coverages.length > 6 && <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>+ และรายการอื่นๆ</p>}
              </div>
            </div>
          )}

          <div style={{ paddingTop: '1rem', borderTop: '1px solid #333' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>ยอดเบี้ยรวมสุทธิ</p>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#006aff' }}>฿{selectedPlan.price?.toLocaleString() || '0'}</p>
          </div>
        </section>

      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body { font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #ffffff; }
        .label { display: block; font-size: 0.85rem; color: #666; margin-bottom: 5px; }
        .input-field { width: 100%; padding: 10px 15px; border-radius: 8px; border: 1px solid #ddd; outline: none; font-size: 0.9rem; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; }
        .btn-secondary { background: #f0f0f0; color: #333; border: none; cursor: pointer; font-weight: bold; }
        .card { box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      `}</style>
    </main>
  );
}
