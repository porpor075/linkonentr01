'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

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

  const adminNav = [
    { label: 'แดชบอร์ด & Analytics', href: '/admin', icon: '📊' },
    { label: 'คลังสินค้า (Product Store)', href: '/admin/insurers', icon: '🏢' },
    { label: 'จัดการคอมมิชชัน (Settings)', href: '/admin/sales-settings', icon: '⚙️' },
    { label: 'รายการงานขาย (Sales)', href: '/admin/policies', icon: '📜' },
    { label: 'จัดการผู้ใช้งาน (Users)', href: '/admin/users', icon: '👤' },
    { label: 'สินค้า API (Internal)', href: '/admin/insurance-products', icon: '⚡' },
  ];

  if (isMobile === null) return <div style={{ background: '#001F3F', height: '100vh' }} />;

  // Mobile View for Admin
  if (isMobile) {
    return (
      <div className="mobile-app-shell">
        <div className="mobile-main">
          {children}
        </div>

        <nav className="mobile-nav" style={{ background: 'rgba(0, 31, 63, 0.95)', border: 'none' }}>
          {adminNav.slice(0, 4).map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                color: pathname === item.href ? 'var(--zoho-warning)' : 'rgba(255,255,255,0.6)',
                fontWeight: pathname === item.href ? '700' : '400',
                textDecoration: 'none'
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>{item.icon}</div>
              {item.label}
            </Link>
          ))}
          <button 
            onClick={handleLogout}
            style={{ border: 'none', background: 'none', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: '2px' }}>🚪</div>
            ออก
          </button>
        </nav>
      </div>
    );
  }

  // Desktop Zoho View for Admin
  return (
    <div className="zoho-layout">
      {/* Sidebar for Desktop Admin */}
      <aside className="zoho-sidebar" style={{ background: '#001F3F' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
             <img src="/logo.webp" alt="NTR LOGO" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
          </div>
          <h2 style={{ color: 'var(--zoho-warning)', fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>NTR ADMIN</h2>
        </div>
        
        <nav style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', height: 'calc(100% - 80px)' }}>
          {adminNav.map((item) => (
            <Link 
              key={item.label} 
              href={item.href} 
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: pathname === item.href ? 'rgba(255,255,255,0.1)' : 'transparent',
                fontWeight: pathname === item.href ? '700' : '400',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
          
          <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
             <Link href="/" style={{ padding: '0.75rem 1rem', color: 'var(--zoho-warning)', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>←</span> กลับหน้าตัวแทน
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
                gap: '1rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem',
                fontWeight: 'bold'
              }}
            >
              <span>🚪</span> ออกจากระบบ
            </button>
          </div>
        </nav>
      </aside>

      <div className="zoho-main-content">
        <header className="zoho-topbar">
           <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: '500', color: 'var(--zoho-text-muted)' }}>NTR BROKER</span>
            <span style={{ color: 'var(--zoho-border)' }}>/</span>
            <span style={{ fontWeight: '600', color: 'var(--zoho-primary)' }}>
              {adminNav.find(i => i.href === pathname)?.label || 'แดชบอร์ด'}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <span className="badge badge-success" style={{ padding: '4px 12px' }}>● System Online</span>
             <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--zoho-warning)', color: '#001F3F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                N
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
