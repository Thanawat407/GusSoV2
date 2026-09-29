'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const response = await fetch('/api/sign-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, full_name: fullName, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'สมัครสมาชิกไม่สำเร็จ');
          return;
        }

        localStorage.setItem('gusso_current_session', JSON.stringify({
          email: data.user.email,
          full_name: data.user.full_name,
          role_id: data.user.role_id,
          user_id: data.user.user_id,
        }));

        alert('สมัครสมาชิกสำเร็จ! ยินดีต้อนรับสู่ GusSo');
        router.push('/');
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
          return;
        }

        localStorage.setItem('gusso_current_session', JSON.stringify(data.user));
        alert(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${data.user.full_name || data.user.email}`);
        router.push('/');
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md mb-3">
            G
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {isRegister ? 'สมัครสมาชิก GusSo' : 'เข้าสู่ระบบ GusSo'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">กรอกข้อมูลบัญชีของคุณเพื่อเข้าใช้งานระบบ</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
              <input 
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
                placeholder="กรอกชื่อของคุณ" 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" 
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com" 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสผ่าน</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="••••••••" 
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" 
            />
          </div>

          {!isRegister && (
            <div className="flex justify-end mb-2">
              <Link href="/auth/forgot-password" className="text-xs text-sky-600 hover:underline">ลืมรหัสผ่าน?</Link>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
          >
            {loading ? 'กำลังตรวจสอบ...' : (isRegister ? 'ยืนยันการสมัครสมาชิก' : 'เข้าสู่ระบบ')}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
          <Link href="/" className="text-slate-500 hover:underline">← กลับหน้าหลัก</Link>
          <button 
            type="button" 
            onClick={() => { setIsRegister(!isRegister); setError(''); }} 
            className="text-sky-600 font-semibold hover:underline"
          >
            {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
          </button>
        </div>
      </div>
    </div>
  );
}
