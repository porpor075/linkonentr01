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
  
  // Verification States
  const [verifyModel, setVerifyModel] = useState('');
  const [verifyYear, setVerifyYear] = useState('');
  
  // Financial Decisions States
  const [paymentTarget, setPaymentTarget] = useState<'NTR' | 'INSURER'>('NTR');
  const [paymentMode, setPaymentMode] = useState<'NET' | 'GROSS'>('NET');
  const [commissionRate, setCommissionRate] = useState(0);
  const [session, setSession] = useState<any>(null);

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
    const planStr = localStorage.getItem('selectedPlan');
    const vehicleStr = localStorage.getItem('selectedVehicle');
    const plan = planStr ? JSON.parse(planStr) : null;
    const vehicle = vehicleStr ? JSON.parse(vehicleStr) : null;
    
    if (plan) setSelectedPlan(plan);
    if (vehicle) setSelectedVehicle(vehicle);

    // Fetch Initial Data
    Promise.all([
      fetch('/api/auth/session').then(res => res.json()),
      fetch('/api/master/common').then(res => res.json()),
      fetch('/api/master/address').then(res => res.json())
    ]).then(([sessData, masterData, addrData]) => {
      setSession(sessData);
      setMaster(masterData);
      setAddressData(addrData);
      
      if (addrData && Object.keys(addrData).length > 0) {
        const firstProvId = Object.keys(addrData)[0];
        setSelectedProvinceId(firstProvId);
        const firstDistId = Object.keys(addrData[firstProvId].districts)[0];
        setSelectedDistrictId(firstDistId);
        const firstSubId = Object.keys(addrData[firstProvId].districts[firstDistId].subdistricts)[0];
        setSelectedSubDistrictId(firstSubId);
      }

      // Fetch Commission Rate for this product & user
      if (plan && sessData?.id) {
        fetch(\`/api/user/analytics\`)
          .then(res => res.json())
          .then(result => {
             // ในระบบจริงควรมี API ดึงเรทแยกตาม ProductId แต่ตอนนี้เราใช้ค่าเฉลี่ยจาก Analytics หรือ Default
             setCommissionRate(15); // Default Mock 15%
          });
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
            brand: result.data.brand || selectedVehicle?.brandName || '',
            model: result.data.model || selectedVehicle?.modelName || '',
            year: result.data.year || selectedVehicle?.year || ''
          }
        }));
      }
    } catch (err) { console.error('OCR failed', err); }
    finally { setOcrLoading(false); }
  };

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
    }
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const subs = addressData[selectedProvinceId]?.districts[id]?.subdistricts || {};
    const subIds = Object.keys(subs);
    setSelectedSubDistrictId(subIds.length > 0 ? subIds[0] : '');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const sub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];
      const res = await fetch('/api/products/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insured: { ...formData.insured, province: selectedProvinceId, district: selectedDistrictId, subDistrict: selectedSubDistrictId, postalCode: sub?.zipcode || '' },
          plan: selectedPlan,
          vehicle: { ...selectedVehicle, registrationNumber: formData.vehicle.registrationNumber, vin: formData.vehicle.vin || ("KNDJA" + Date.now()) },
          premiumAmount: selectedPlan.price,
          planName: selectedPlan.planName,
          planId: selectedPlan.id,
          quotationId: "Q-" + Date.now(),
          paymentTarget,
          paymentMode,
          netAmount: finalPaymentAmount
        })
      });
      const data = await res.json();
      if (data.success) { setPolicyResult(data.policy); setStep(4); }
      else { alert('Error: ' + (data.error?.message || 'Submission failed')); }
    } catch (e: any) { alert('Network Error: ' + e.message); }
    finally { setLoading(false); }
  };

  if (!mounted || !selectedPlan || !addressData) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังเตรียมระบบออกกรมธรรม์...</div>;

  const provinceList = Object.entries(addressData).map(([id, p]: any) => ({ id, name: p.name }));
  const districtList = Object.entries(addressData[selectedProvinceId]?.districts || {}).map(([id, d]: any) => ({ id, name: d.name }));
  const subDistrictList = Object.entries(addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts || {}).map(([id, s]: any) => ({ id, name: s.name, zipcode: s.zipcode }));
  const currentSub = addressData[selectedProvinceId]?.districts[selectedDistrictId]?.subdistricts[selectedSubDistrictId];

  // Logic การคำนวณเงิน
  const commAmount = (selectedPlan.price * commissionRate) / 100;
  const finalPaymentAmount = paymentMode === 'NET' ? (selectedPlan.price - commAmount) : selectedPlan.price;

  // Logic ตรวจสอบความถูกต้องรุ่น/ปีรถ
  const isVehicleVerified = 
    (verifyModel.toUpperCase() === selectedVehicle?.modelName?.toUpperCase() || verifyModel === selectedVehicle?.model) && 
    verifyYear === String(selectedVehicle?.year);

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>ออกกรมธรรม์ (Agent Journey)</h1>
        <p style={{ color: '#666' }}>ระบบจัดการการเงินและสิทธิ์การออกงานแบบเบ็ดเสร็จ</p>
      </header>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {['1. ข้อมูลผู้เอาประกัน', '2. ข้อมูลรถ & ที่อยู่', '3. ตรวจสอบ & การเงิน', '4. สำเร็จ'].map((label, idx) => (
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
                <label className="label">คำนำหน้า</label>
                <select className="input-field" value={formData.insured.title} onChange={e => setFormData({...formData, insured: {...formData.insured, title: e.target.value}})}>
                  {master.title.map((t: any) => <option key={t.code} value={t.code}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ชื่อ-นามสกุล</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="input-field" placeholder="ชื่อ" value={formData.insured.firstName} onChange={e => setFormData({...formData, insured: {...formData.insured, firstName: e.target.value}})} />
                  <input className="input-field" placeholder="นามสกุล" value={formData.insured.lastName} onChange={e => setFormData({...formData, insured: {...formData.insured, lastName: e.target.value}})} />
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
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
              <div style={{ display: 'flex', gap: '1rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 2, borderRadius: '50px' }}>ตรวจสอบข้อมูล</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem' }}>📋 สรุปรายการและเลือกวิธีชำระเงิน</h3>
              
              <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #eee' }}>
                <p><strong>ผู้เอาประกัน:</strong> {formData.insured.firstName} {formData.insured.lastName}</p>
                <p><strong>รถยนต์:</strong> {selectedVehicle?.brandName} {selectedVehicle?.modelName} ({selectedVehicle?.year})</p>
                <p><strong>ทะเบียน:</strong> {formData.vehicle.registrationNumber}</p>
              </div>

              {/* 3.1: เลือกปลายทางเงิน */}
              <div className="sub-step-card">
                <h4 className="sub-step-title">3.1 เลือกปลายทางรับเงิน</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentTarget('NTR')} className={`choice-btn \${paymentTarget === 'NTR' ? 'active' : ''}\`}>โอนเข้า NTR Broker</button>
                  <button onClick={() => setPaymentTarget('INSURER')} className={`choice-btn \${paymentTarget === 'INSURER' ? 'active' : ''}\`}>โอนตรงบริษัทประกัน</button>
                </div>
              </div>

              {/* 3.2: เลือกรูปแบบยอดชำระ */}
              <div className="sub-step-card">
                <h4 className="sub-step-title">3.2 เลือกรูปแบบยอดชำระ</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setPaymentMode('NET')} className={`choice-btn \${paymentMode === 'NET' ? 'active' : ''}\`}>จ่ายยอด NET (หักค่าคอมฯ)</button>
                  <button onClick={() => setPaymentMode('GROSS')} className={`choice-btn \${paymentMode === 'GROSS' ? 'active' : ''}\`}>จ่ายยอดเต็ม (ไม่หักคอมฯ)</button>
                </div>
              </div>

              {/* 2.0: ยืนยันข้อมูลรุ่น/ปีรถ */}
              <div style={{ background: '#fff9db', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffe066' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px' }}>⚠️ โปรดยืนยัน รุ่นรถ และ ปีรถ เพื่อความถูกต้อง</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="input-field" placeholder="รุ่นรถ (เช่น CAMRY)" value={verifyModel} onChange={e => setVerifyModel(e.target.value)} />
                  <input className="input-field" placeholder="ปีรถ (เช่น 2024)" value={verifyYear} onChange={e => setVerifyYear(e.target.value)} />
                </div>
                <p style={{ fontSize: '0.75rem', marginTop: '10px', color: isVehicleVerified ? 'green' : 'red' }}>
                  {isVehicleVerified ? '✅ ข้อมูลถูกต้องตรงกัน' : '❌ ข้อมูลไม่ตรงกับแผนที่เลือก'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, borderRadius: '50px' }}>ย้อนกลับ</button>
                <button 
                  onClick={handleSubmit} 
                  disabled={loading || !isVehicleVerified} 
                  className="btn-primary" 
                  style={{ flex: 2, borderRadius: '50px', opacity: (loading || !isVehicleVerified) ? 0.5 : 1 }}
                >
                  {loading ? 'กำลังออกกรมธรรม์...' : 'ชำระเงินและออกกรมธรรม์'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2>ออกกรมธรรม์สำเร็จ!</h2>
              <p>ยอดชำระ: <strong>฿{finalPaymentAmount.toLocaleString()}</strong> ({paymentMode})</p>
              <p>เลขที่กรมธรรม์: <strong>{policyResult?.policyNumber || 'กำลังประมวลผล...'}</strong></p>
              <Link href="/user"><button className="btn-primary" style={{ marginTop: '2rem', borderRadius: '50px', padding: '10px 30px' }}>กลับหน้าหลัก</button></Link>
            </div>
          )}
        </section>

        {/* สรุปการเงินด้านข้าง */}
        <section className="card" style={{ padding: '1.5rem', background: '#1a1a1a', color: 'white', borderRadius: '16px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '1rem' }}>สรุปยอดชำระเงิน</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#888' }}>ยอดเบี้ยเต็ม:</span>
            <span>฿{selectedPlan.price?.toLocaleString()}</span>
          </div>
          {paymentMode === 'NET' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2ecc71' }}>
              <span>หักค่าคอมมิชชัน ({commissionRate}%):</span>
              <span>- ฿{commAmount.toLocaleString()}</span>
            </div>
          )}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid #333', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', margin: 0 }}>ยอดโอนจริง ({paymentTarget})</p>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: '#006aff' }}>฿{finalPaymentAmount.toLocaleString()}</p>
          </div>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#666', background: '#222', padding: '10px', borderRadius: '8px' }}>
             {paymentTarget === 'NTR' ? '📌 โอนเข้า บจก. เอ็นทีอาร์ โบรกเกอร์' : '📌 โอนเข้า บมจ. อลิอันซ์ อยุธยา โดยตรง'}
          </div>
        </section>
      </div>

      <style jsx global>{`
        body { font-family: sans-serif; background-color: #f8f9fa; }
        .label { display: block; font-size: 0.8rem; color: #666; margin-bottom: 4px; }
        .input-field { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #ddd; outline: none; }
        .btn-primary { background: #006aff; color: white; border: none; cursor: pointer; font-weight: bold; padding: 12px; }
        .btn-secondary { background: #eee; color: #333; border: none; cursor: pointer; font-weight: bold; padding: 12px; }
        .card { box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: white; }
        .sub-step-card { padding: 1rem; background: #f1f7ff; borderRadius: 12px; border: 1px solid #d0e3ff; }
        .sub-step-title { margin: 0 0 10px 0; fontSize: 0.9rem; color: #004ba0; }
        .choice-btn { flex: 1; padding: 10px; border: 1px solid #ddd; background: white; cursor: pointer; borderRadius: 8px; fontSize: 0.8rem; }
        .choice-btn.active { border-color: #006aff; background: #006aff; color: white; fontWeight: bold; }
      `}</style>
    </main>
  );
}
