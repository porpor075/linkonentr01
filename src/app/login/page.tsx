'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt started...');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response received:', res.status);
      const data = await res.json();

      if (res.ok) {
        console.log('Login success, role:', data.role);
        // FORCE RELOAD to ensure middleware picks up the cookie if router.push is flaky
        if (data.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      } else {
        console.warn('Login failed:', data.error);
        setError(data.error || 'การเข้าสู่ระบบล้มเหลว');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f4f7f9',
      fontFamily: 'sans-serif'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2.5rem', textAlign: 'center', background: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', overflow: 'hidden', border: '1px solid #eee' }}>
            <img src="/logo.webp" alt="NTR LOGO" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#001F3F', margin: 0 }}>NTR BROKER</h1>
          <p className="text-muted" style={{ marginTop: '0.5rem', color: '#666' }}>ระบบจัดการประกันภัยรถยนต์</p>
        </div>

        {error && (
          <div style={{ background: '#fff5f5', color: '#e03131', padding: '0.75rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.85rem', border: '1px solid #ffa8a8' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#666' }}>ชื่อผู้ใช้งาน</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin หรือ agent"
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#666' }}>รหัสผ่าน</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.85rem', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              background: '#3498db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#999', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
          <p style={{ margin: '4px 0' }}>Admin: <strong>admin</strong> / password123</p>
          <p style={{ margin: '4px 0' }}>Agent: <strong>agent</strong> / password123</p>
        </div>
      </div>
    </div>
  );
}
