'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/products/contracts/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || 'ไม่สามารถดึงข้อมูลกรมธรรม์ได้');
        } else {
          setContract(data);
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>กำลังดึงข้อมูลกรมธรรม์...</div>;
  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>{error}</div>;
  if (!contract) return null;

  return (
    <main style={{ padding: '20px' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>รายละเอียดกรมธรรม์</h1>
          <p style={{ color: '#666' }}>เลขที่กรมธรรม์: <strong style={{ color: 'var(--zoho-accent)' }}>{contract.policyNumber}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => router.back()} className="btn-secondary" style={{ borderRadius: '50px' }}>← ย้อนกลับ</button>
          <button className="btn-primary" style={{ borderRadius: '50px' }} onClick={() => window.print()}>🖨️ พิมพ์เอกสาร</button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* คอลัมน์ซ้าย: ข้อมูลทั่วไป (สไตล์เดียวกับหน้า Insurers) */}
        <section className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--zoho-primary)' }}>📝 ข้อมูลกรมธรรม์</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>สถานะ:</span>
            <span className="badge badge-success" style={{ width: 'fit-content' }}>{contract.policyStatus || 'ACTIVE'}</span>
            
            <span style={{ color: '#666', fontSize: '0.9rem' }}>วันเริ่มต้น:</span>
            <span style={{ fontWeight: 'bold' }}>{contract.policyStartDate}</span>
            
            <span style={{ color: '#666', fontSize: '0.9rem' }}>วันสิ้นสุด:</span>
            <span style={{ fontWeight: 'bold' }}>{contract.policyExpiryDate}</span>

            <span style={{ color: '#666', fontSize: '0.9rem' }}>เลขอ้างอิงระบบ:</span>
            <code style={{ fontSize: '0.85rem' }}>{contract.contractId}</code>
          </div>
        </section>

        {/* คอลัมน์ขวา: ข้อมูลรถยนต์และเบี้ย (สไตล์เดียวกับหน้า Insurers) */}
        <section className="card" style={{ padding: '1.5rem', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--zoho-primary)' }}>🚗 ข้อมูลรถยนต์และเบี้ย</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px' }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>ทะเบียนรถ:</span>
            <span style={{ fontWeight: 'bold' }}>{contract.vehicle?.registrationNumber || 'ไม่ระบุ'}</span>
            
            <span style={{ color: '#666', fontSize: '0.9rem' }}>ยี่ห้อ/รุ่น:</span>
            <span>{contract.vehicle?.make} - {contract.vehicle?.model}</span>
            
            <span style={{ color: '#666', fontSize: '0.9rem' }}>เลขตัวถัง:</span>
            <code style={{ fontSize: '0.85rem' }}>{contract.vehicle?.vehicleIdentificationNumber}</code>

            <span style={{ color: '#666', fontSize: '0.9rem', marginTop: '10px' }}>เบี้ยประกันสุทธิ:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--zoho-accent)', marginTop: '10px' }}>
               ฿{Number(contract.productPackages?.[0]?.premium?.grossPremium || 0).toLocaleString()}
            </span>
          </div>
        </section>

        {/* ความคุ้มครอง (แถวยาวเต็มความกว้าง) */}
        <section className="card" style={{ gridColumn: 'span 2', padding: '1.5rem', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '10px', color: 'var(--zoho-primary)' }}>🛡️ รายละเอียดความคุ้มครอง</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {contract.productPackages?.[0]?.coverages?.map((cov: any, idx: number) => (
              <div key={idx} style={{ padding: '15px', border: '1px solid #f0f0f0', borderRadius: '12px', background: '#fcfcfc' }}>
                <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px', fontSize: '0.9rem' }}>{cov.name}</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--zoho-accent)', margin: 0 }}>฿{Number(cov.sumInsured || 0).toLocaleString()}</p>
                <small style={{ color: '#999' }}>ทุนประกัน</small>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap');
        body { font-family: 'IBM Plex Sans Thai', sans-serif; background-color: #ffffff; }
        .card { background: white; border: 1px solid #eee; boxShadow: 0 4px 6px rgba(0,0,0,0.02); }
      `}</style>
    </main>
  );
}
