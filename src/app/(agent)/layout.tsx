'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AgentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { label: 'แดชบอร์ด', href: '/user', icon: '🏠' },
    { label: 'เช็คเบี้ย', href: '/user/products', icon: '🛡️' },
    { label: 'ประวัติการขาย', href: '/user/history', icon: '📜' },
    { label: 'งานของฉัน', href: '/user/tasks', icon: '📋' },
    { label: 'การชำระเงิน', href: '/user/quotation', icon: '🔗' },
  ];

  // Mobile View
  if (isMobile) {
    return (
      <div className="mobile-app-shell">
        <div className="mobile-main">
          {children}
        </div>

        <nav className="mobile-nav">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                color: pathname === item.href ? 'var(--zoho-accent)' : 'var(--zoho-text-muted)',
                fontWeight: pathname === item.href ? '700' : '400',
                textDecoration: 'none'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>{item.icon}</div>
              {item.label}
            </Link>
          ))}
          <button 
            onClick={handleLogout}
            style={{ border: 'none', background: 'none', textAlign: 'center', fontSize: '0.7rem', color: 'var(--zoho-text-muted)', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: '2px' }}>🚪</div>
            ออก
          </button>
        </nav>
      </div>
    );
  }

  // Desktop Zoho View
  return (
    <div className="zoho-layout">
      {/* Sidebar */}
      <aside className="zoho-sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
             <img src="/logo.webp" alt="NTR LOGO" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
          </div>
          <h2 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>NTR BROKER</h2>
        </div>
        
        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'calc(100% - 80px)' }}>
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '4px',
                color: pathname === item.href ? 'white' : 'rgba(255,255,255,0.7)',
                background: pathname === item.href ? 'var(--zoho-accent)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontWeight: pathname === item.href ? '600' : '400',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <div style={{ marginTop: 'auto' }}>
            <Link 
              href="/admin" 
              style={{
                padding: '0.75rem 1rem',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none'
              }}
            >
              <span>⚙️</span> ระบบหลังบ้าน (แอดมิน)
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                color: '#ff6b6b',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              <span>🚪</span> ออกจากระบบ
            </button>
          </div>
        </nav>
      </aside>

      <div className="zoho-main-content">
        {/* Topbar */}
        <header className="zoho-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '500', color: 'var(--zoho-text-muted)' }}>หน้าหลัก</span>
            <span style={{ color: 'var(--zoho-border)' }}>/</span>
            <span style={{ fontWeight: '600', color: 'var(--zoho-primary)' }}>
              {navItems.find(i => i.href === pathname)?.label || 'แดชบอร์ด'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0 }}>NTR Agent</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--zoho-text-muted)', margin: 0 }}>Verified Partner</p>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--zoho-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                N
              </div>
            </div>
          </div>
        </header>

        <main className="zoho-page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
