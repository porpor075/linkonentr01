'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuotationJourney() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showOcrReview, setShowOcrReview] = useState(false);
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [policyResult, setPolicyResult] = useState<any>(null);
  
  // Verification & Financial States
  const [verifyModel, setVerifyModel] = useState('');
  const [verifyYear, setVerifyYear] = useState('');
  const [paymentTarget, setPaymentTarget] = useState<'NTR' | 'INSURER'>('NTR');
  const [paymentMode, setPaymentMode] = useState<'NET' | 'GROSS'>('NET');
  const [commissionRate, setCommissionRate] = useState(15);
  const [session, setSession] = useState<any>(null);

  const router = useRouter();

  // Master Data
  const [master, setMaster] = useState<any>({ nationality: [], title: [], occupation: [] });
  const [addressData, setAddressData] = useState<any>(null);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedSubDistrictId, setSelectedSubDistrictId] = useState('');

  const [formData, setFormData] = useState({
    insured: { title: 'MR', firstName: '', lastName: '', idCard: '', birthDate: '1995-01-01', gender: 'MALE', phone: '', email: '', addressLine1: '', nationality: 'TH', occupation: '1' },
    vehicle: { registrationNumber: '', vin: '', engineNumber: '', brand: '', model: '', year: '' }
  });

  useEffect(() => {
    setMounted(true);
    const plan = localStorage.getItem('selectedPlan');
    const vehicle = localStorage.getItem('selectedVehicle');
    if (plan) setSelectedPlan(JSON.parse(plan));
    if (vehicle) setSelectedVehicle(JSON.parse(vehicle));

    fetch('/api/auth/session').then(res => res.json()).then(setSession);
    fetch('/api/master/common').then(res => res.json()).then(setMaster);
    fetch('/api/master/address').then(res => res.json()).then(data => {
      setAddressData(data);
      if (data && Object.keys(data).length > 0) {
        const pId = Object.keys(data)[0];
        setSelectedProvinceId(pId);
        const dId = Object.keys(data[pId].districts)[0];
        setSelectedDistrictId(dId);
        setSelectedSubDistrictId(Object.keys(data[pId].districts[dId].subdistricts)[0]);
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
        setOcrResult(result.data);
        setShowOcrReview(true);
      }
    } catch (err) { alert('AI Scan Failed'); }
    finally { setOcrLoading(false); }
  };

  const applyOcrData = () => {
    setFormData(prev => ({
      ...prev,
      vehicle: {
        ...prev.vehicle,
        registrationNumber: ocrResult.registrationNumber || prev.vehicle.registrationNumber,
        vin: ocrResult.vin || prev.vehicle.vin,
        engineNumber: ocrResult.engineNumber || prev.vehicle.engineNumber,
        brand: ocrResult.brand || selectedVehicle?.brandName || '',
        model: ocrResult.model || selectedVehicle?.modelName || '',
        year: ocrResult.year || selectedVehicle?.year || ''
      }
    }));
    setShowOcrReview(false);
  };

  const handleProvinceChange = (id: string) => {
    setSelectedProvinceId(id);
    const dIds = Object.keys(addressData[id]?.districts || {});
    if (dIds.length > 0) {
      setSelectedDistrictId(dIds[0]);
      const sIds = Object.keys(addressData[id].districts[dIds[0]].subdistricts || {});
      setSelectedSubDistrictId(sIds.length > 0 ? sIds[0] : '');
    }
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const sIds = Object.keys(addressData[selectedProvinceId].districts[id].subdistricts || {});
    setSelectedSubDistrictId(sIds.length > 0 ? sIds[0] : '');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const sub = addressData[selectedProvinceId].districts[selectedDistrictId].subdistricts[selectedSubDistrictId];
      const res = await fetch('/api/products/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insured: { ...formData.insured, province: selectedProvinceId, district: selectedDistrictId, subDistrict: selectedSubDistrictId, postalCode: sub?.zipcode || '' },
          plan: selectedPlan,
          vehicle: { ...selectedVehicle, registrationNumber: formData.vehicle.registrationNumber, vin: formData.vehicle.vin, engineNumber: formData.vehicle.engineNumber || formData.vehicle.vin },
          premiumAmount: selectedPlan.price,
          planId: selectedPlan.id,
          quotationId: "Q-" + Date.now(),
          paymentTarget, paymentMode,
          netAmount: finalAmount
        })
      });
      const data = await res.json();
      if (data.success) { setPolicyResult(data.policy); setStep(4); }
      else { alert('Submission Error'); }
    } catch (e) { alert('Network Error'); }
    finally { setLoading(false); }
  };

  if (!mounted || !selectedPlan || !addressData) return null;

  const currentSub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];
  const commAmount = (selectedPlan.price * commissionRate) / 100;
  const finalAmount = paymentMode === 'NET' ? (selectedPlan.price - commAmount) : selectedPlan.price;
  const isVerified = (verifyModel.toUpperCase() === selectedVehicle?.modelName?.toUpperCase() || verifyModel === selectedVehicle?.model) && verifyYear === String(selectedVehicle?.year);

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>ออกกรมธรรม์ (Full Agent Journey)</h1>
        <p style={{ color: '#666' }}>ระบบจัดทำกรมธรรม์ พร้อมระบบตรวจสอบ OCR และการจัดการเงิน</p>
      </header>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['1. ผู้เอาประกัน', '2. รถ & ที่อยู่', '3. การเงิน & ยืนยัน', '4. สำเร็จ'].map((l, i) => (
          <div key={i} style={{ flex: 1, padding: '10px', textAlign: 'center', borderBottom: `4px solid ${step >= i+1 ? '#006aff' : '#eee'}`, fontWeight: 'bold', fontSize: '0.8rem' }}>{l}</div>
        ))}
      </div>

      {/* OCR Review Panel */}
      {showOcrReview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ maxWidth: '800px', width: '100%', background: 'white', borderRadius: '20px', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>🤖 ตรวจสอบผลการสแกนเล่มทะเบียน</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem' }}>รายการ</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem' }}>ค่าที่เลือกไว้</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem' }}>AI อ่านได้</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'ยี่ห้อรถ', system: selectedVehicle?.brandName, ai: ocrResult.brand },
                  { label: 'รุ่นรถ', system: selectedVehicle?.modelName, ai: ocrResult.model },
                  { label: 'ปีรถ', system: selectedVehicle?.year, ai: ocrResult.year },
                  { label: 'ทะเบียน', system: '-', ai: ocrResult.registrationNumber },
                  { label: 'เลขตัวถัง', system: '-', ai: ocrResult.vin },
                ].map((item, idx) => {
                  const isMatch = item.system === '-' || String(item.system).toUpperCase() === String(item.ai).toUpperCase();
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.label}</td>
                      <td style={{ padding: '12px' }}>{item.system}</td>
                      <td style={{ padding: '12px', color: isMatch ? '#2ecc71' : '#ff4d4f', fontWeight: 'bold' }}>{item.ai || 'ไม่พบ'}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{isMatch ? '✅' : '⚠️'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowOcrReview(false)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ยกเลิก</button>
              <button onClick={applyOcrData} className="btn-primary" style={{ flex: 2, borderRadius: '50px' }}>นำข้อมูลเข้าฟอร์ม</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        <section className="card" style={{ padding: '2rem', borderRadius: '16px', background: 'white', border: '1px solid #eee' }}>
          
          {step === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem' }}>👤 ข้อมูลผู้เอาประกัน</h3>
              <div>
                <label className="label">ชื่อ</label>
                <input className="input-field" value={formData.insured.firstName} onChange={e => setFormData({...formData, insured: {...formData.insured, firstName: e.target.value}})} />
              </div>
              <div>
                <label className="label">นามสกุล</label>
                <input className="input-field" value={formData.insured.lastName} onChange={e => setFormData({...formData, insured: {...formData.insured, lastName: e.target.value}})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">เลขบัตรประชาชน</label>
                <input className="input-field" value={formData.insured.idCard} onChange={e => setFormData({...formData, insured: {...formData.insured, idCard: e.target.value}})} />
              </div>
              <button onClick={() => setStep(2)} className="btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem', borderRadius: '50px' }}>ขั้นตอนถัดไป</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <h3 style={{ gridColumn: 'span 2', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                🚗 ข้อมูลรถ & ที่อยู่
                <label style={{ fontSize: '0.8rem', background: '#f39c12', color: 'white', padding: '6px 12px', borderRadius: '50px', cursor: 'pointer' }}>
                  {ocrLoading ? '⏳ กำลังสแกน...' : '🤖 สแกนเล่มทะเบียน (OCR)'}
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
              <div>
                <label className="label">จังหวัด</label>
                <select className="input-field" value={selectedProvinceId} onChange={e => handleProvinceChange(e.target.value)}>
                  {Object.entries(addressData).map(([id, p]: any) => <option key={id} value={id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">อำเภอ / เขต</label>
                <select className="input-field" value={selectedDistrictId} onChange={e => handleDistrictChange(e.target.value)}>
                  {Object.entries(addressData[selectedProvinceId]?.districts || {}).map(([id, d]: any) => <option key={id} value={id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2, borderRadius: '50px' }}>ตรวจสอบข้อมูล</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>📋 สรุปรายการและวิธีชำระเงิน</h3>
              
              <div className="sub-step-card">
                <h4 className="sub-step-title">3.1 เลือกปลายทางรับเงิน</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentTarget('NTR')} className={`choice-btn \${paymentTarget === 'NTR' ? 'active' : ''}\`}>โอนเข้า NTR Broker</button>
                  <button onClick={() => setPaymentTarget('INSURER')} className={`choice-btn \${paymentTarget === 'INSURER' ? 'active' : ''}\`}>โอนตรงบริษัทประกัน</button>
                </div>
              </div>

              <div className="sub-step-card">
                <h4 className="sub-step-title">3.2 เลือกรูปแบบยอดชำระ</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentMode('NET')} className={`choice-btn \${paymentMode === 'NET' ? 'active' : ''}\`}>จ่ายยอด NET (หักค่าคอมฯ)</button>
                  <button onClick={() => setPaymentMode('GROSS')} className={`choice-btn \${paymentMode === 'GROSS' ? 'active' : ''}\`}>จ่ายยอดเต็ม (ไม่หักคอมฯ)</button>
                </div>
              </div>

              <div style={{ background: '#fff9db', padding: '1rem', borderRadius: '12px', border: '1px solid #ffe066' }}>
                <p style={{ fontSize: '0.85rem' }}>⚠️ ยืนยัน <strong>{selectedVehicle?.modelName}</strong> ปี <strong>{selectedVehicle?.year}</strong></p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <input className="input-field" placeholder="ยืนยันรุ่นรถ" value={verifyModel} onChange={e => setVerifyModel(e.target.value)} />
                  <input className="input-field" placeholder="ยืนยันปีรถ" value={verifyYear} onChange={e => setVerifyYear(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button onClick={handleSubmit} disabled={loading || !isVerified} className="btn-primary" style={{ flex: 2, borderRadius: '50px', opacity: isVerified ? 1 : 0.5 }}>ยืนยันและออกกรมธรรม์</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '4rem' }}>✅</div>
              <h2>ออกกรมธรรม์สำเร็จ!</h2>
              <p>ยอดชำระ: <strong>฿{finalAmount.toLocaleString()}</strong> ({paymentMode})</p>
              <Link href="/user"><button className="btn-primary" style={{ marginTop: '2rem', borderRadius: '50px' }}>กลับหน้าหลัก</button></Link>
            </div>
          )}
        </section>

        {/* Sidebar Summary */}
        <section className="card" style={{ padding: '1.5rem', background: '#1a1a1a', color: 'white', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1rem', color: 'white', marginBottom: '1.5rem' }}>สรุปยอดเงิน</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
            <span style={{ color: '#888' }}>ยอดเบี้ยเต็ม:</span>
            <span>฿{selectedPlan.price?.toLocaleString()}</span>
          </div>
          {paymentMode === 'NET' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2ecc71', fontSize: '0.9rem' }}>
              <span>หักค่าคอมมิชชัน ({commissionRate}%):</span>
              <span>- ฿{commAmount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #333' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>ยอดโอนจริง ({paymentTarget})</p>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#006aff' }}>฿{finalAmount.toLocaleString()}</p>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .input-field { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; padding: 14px; }
        .btn-secondary { background: #eee; color: #333; border: none; cursor: pointer; padding: 14px; }
        .choice-btn { flex: 1; padding: 10px; border: 1px solid #ddd; background: white; cursor: pointer; borderRadius: 8px; fontSize: 0.8rem; }
        .choice-btn.active { border-color: #006aff; background: #006aff; color: white; fontWeight: bold; }
        .sub-step-card { padding: 1rem; background: #f1f7ff; borderRadius: 12px; border: 1px solid #d0e3ff; }
        .sub-step-title { margin: 0 0 10px 0; fontSize: 0.85rem; color: #004ba0; fontWeight: bold; }
        .label { display: block; font-size: 0.8rem; color: #666; margin-bottom: 4px; }
        .card { box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
      `}</style>
    </main>
  );
}
