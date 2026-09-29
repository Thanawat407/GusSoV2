'use client'

import React, { useState } from 'react';
import Link from 'next/link';

export function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/sign-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          password: password,
        }),
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
      window.location.href = '/';
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md">
          G
        </div>
        <h2 className="text-xl font-bold text-slate-800">สมัครสมาชิก GusSo</h2>
        <p className="text-xs text-slate-500">กรอกข้อมูลบัญชีของคุณเพื่อเข้าใช้งานระบบ</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4" autoComplete="off">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุล</label>
          <input 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            autoComplete="off"
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-500 transition text-slate-800" 
            placeholder="กรอกชื่อของคุณ" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="off"
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-500 transition text-slate-800" 
            placeholder="example@gmail.com" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">รหัสผ่าน</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            minLength={6}
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-500 transition text-slate-800" 
            placeholder="•••••••••••• (อย่างน้อย 6 ตัวอักษร)" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md transition"
        >
          {loading ? 'กำลังสมัครสมาชิก...' : 'ยืนยันการสมัครสมาชิก'}
        </button>
      </form>

      <div className="flex justify-between items-center text-xs pt-2 border-t">
        <Link href="/" className="text-slate-500 hover:text-slate-700">← กลับหน้าหลัก</Link>
        <Link href="/auth/login" className="text-sky-600 font-bold hover:underline">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}
