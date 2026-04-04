'use client';

import React, { useState, useEffect } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ username: '', fullName: '', role: ['agent'], password: '' });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      // แก้ไขตรงนี้: data คือ array ของ users โดยตรง ไม่ต้อง .users
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = (currentRoles: string[], role: string) => {
    const roles = Array.isArray(currentRoles) ? currentRoles : [currentRoles];
    if (roles.includes(role)) {
      return roles.filter(r => r !== role);
    } else {
      return [...roles, role];
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.fullName || formData.role.length === 0) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ username: '', fullName: '', role: ['agent'], password: '' });
        setIsAdding(false);
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to add user:', e);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editingUser.role || editingUser.role.length === 0) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.id, role: editingUser.role, fullName: editingUser.fullName })
      });
      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error('Failed to update user:', e);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!id) return;
    if (confirm('ยืนยันการลบผู้ใช้งานนี้?')) {
      try {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchUsers();
      } catch (e) {
        console.error('Failed to delete user:', e);
      }
    }
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>จัดการผู้ใช้งาน (User & Permission)</h2>
        <button className="btn btn-primary" onClick={() => { setIsAdding(!isAdding); setEditingUser(null); }}>
          {isAdding ? 'ยกเลิก' : '+ เพิ่มผู้ใช้งาน'}
        </button>
      </div>

      {isAdding && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--zoho-accent)', background: '#fdfdfd' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>เพิ่มผู้ใช้งานใหม่</h3>
          <form onSubmit={handleAddUser} className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Username</label>
              <input 
                className="input-field" 
                placeholder="เช่น ntr_agent01" 
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>รหัสผ่าน</label>
              <input 
                type="password"
                className="input-field" 
                placeholder="กำหนดรหัสผ่าน" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ชื่อ-นามสกุล</label>
              <input 
                className="input-field" 
                placeholder="ชื่อจริง-นามสกุล" 
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>สิทธิ์การใช้งาน (Permissions)</label>
              <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.role.includes('agent')} 
                    onChange={() => setFormData({...formData, role: handleToggleRole(formData.role, 'agent')})}
                  /> Agent
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.role.includes('admin')} 
                    onChange={() => setFormData({...formData, role: handleToggleRole(formData.role, 'admin')})}
                  /> Admin
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem' }}>สร้างบัญชีผู้ใช้งาน</button>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid #3498db', background: '#f0f7ff' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>แก้ไขผู้ใช้งาน: @{editingUser.username}</h3>
          <form onSubmit={handleUpdateUser} className="grid grid-2" style={{ gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>ชื่อ-นามสกุล</label>
              <input 
                className="input-field" 
                value={editingUser.fullName}
                onChange={e => setEditingUser({...editingUser, fullName: e.target.value})}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>สิทธิ์การใช้งาน (Permissions)</label>
              <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={editingUser.role.includes('agent')} 
                    onChange={() => setEditingUser({...editingUser, role: handleToggleRole(editingUser.role, 'agent')})}
                  /> Agent
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={editingUser.role.includes('admin')} 
                    onChange={() => setEditingUser({...editingUser, role: handleToggleRole(editingUser.role, 'admin')})}
                  /> Admin
                </label>
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>บันทึกการแก้ไข</button>
              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setEditingUser(null)}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '1.25rem' }}>ผู้ใช้งาน</th>
              <th style={{ padding: '1.25rem' }}>Permission</th>
              <th style={{ padding: '1.25rem' }}>UUID</th>
              <th style={{ padding: '1.25rem' }}>วันที่สร้าง</th>
              <th style={{ padding: '1.25rem', textAlign: 'right' }}>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center' }}>กำลังดึงข้อมูลผู้ใช้งาน...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#999' }}>ยังไม่มีข้อมูลผู้ใช้งาน</td></tr>
            ) : users.filter(user => user && user.id).map((user: any) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{user.fullName}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>@{user.username}</div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {(Array.isArray(user.role) ? user.role : [user.role]).map((r: string) => (
                      <span key={r} style={{ 
                        padding: '2px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold',
                        background: r === 'admin' ? '#fff0f6' : '#f0f7ff',
                        color: r === 'admin' ? '#c01c28' : '#00539c',
                        border: `1px solid ${r === 'admin' ? '#ffc9c9' : '#a5d8ff'}`
                      }}>
                        {r.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <code style={{ fontSize: '0.7rem', color: '#999', background: '#f1f3f5', padding: '2px 5px', borderRadius: '3px' }}>{user.id}</code>
                </td>
                <td style={{ padding: '1.25rem', fontSize: '0.85rem', color: '#666' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button 
                      onClick={() => { setEditingUser(user); setIsAdding(false); }}
                      style={{ border: 'none', background: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      แก้ไข
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      style={{ border: 'none', background: 'none', color: '#e03131', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: '2rem', background: '#fff9db' }}>
         <p style={{ margin: 0, fontSize: '0.85rem' }}>
           💡 <strong>ข้อมูลสำคัญ:</strong> ทุกรายการ Quotation และการเรียก API จะถูกผูก (Linked) กับ UUID ของผู้ใช้งานที่ล็อกอินอยู่ เพื่อความปลอดภัยและใช้ในการคำนวณค่าคอมมิชชั่น
         </p>
      </div>
    </main>
  );
}
