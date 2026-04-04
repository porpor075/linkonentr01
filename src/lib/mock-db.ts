export interface User {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'agent';
  createdAt: string;
}

// ข้อมูลเริ่มต้น
let users: User[] = [
  {
    id: 'fc2514e1-8ede-ddc0-8888-888888888888',
    username: 'admin',
    fullName: 'NTR Administrator',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    username: 'agent',
    fullName: 'NTR Sales Agent',
    role: 'agent',
    createdAt: new Date().toISOString()
  }
];

export const getUsers = () => users;

export const addUser = (username: string, fullName: string, role: 'admin' | 'agent') => {
  const newUser: User = {
    id: crypto.randomUUID(),
    username,
    fullName,
    role,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  return newUser;
};

export const deleteUser = (id: string) => {
  users = users.filter(u => u.id !== id);
};

export const updateUserRole = (id: string, role: 'admin' | 'agent') => {
  users = users.map(u => u.id === id ? { ...u, role } : u);
};
