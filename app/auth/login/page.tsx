'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      // สมัครสมาชิกใหม่ บันทึกลงตาราง users ใน Supabase
      const { error } = await supabase
        .from('users')
        .insert([{ email, full_name: fullName, role_id: 1 }]);

      if (error) {
        console.error('Register error:', error);
        alert('สมัครสมาชิกไม่สำเร็จ: ' + error.message);
      } else {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setIsRegister(false);
      }
    } else {
      // เช็กว่าเป็นแอดมินบัญชีลับหลังบ้านหรือไม่
      if (email.toLowerCase().trim() === 'admin@gusso.com' && password === 'admin123') {
        let adminUser = { name: 'ผู้ดูแลระบบ', email: 'admin@gusso.com', role_id: 2 };
        localStorage.setItem('gusso_current_session', JSON.stringify(adminUser));
        alert('เข้าสู่ระบบผู้ดูแลระบบสำเร็จ!');
        router.push('/');
        setLoading(false);
        return;
      }

      // ถ้าไม่ใช่แอดมิน ให้ค้นหาจากตาราง users ใน Supabase ทั่วไป
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        alert('ไม่พบอีเมลนี้ในระบบฐานข้อมูล หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        localStorage.setItem('gusso_current_session', JSON.stringify(data));
        alert(`เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับคุณ ${data.full_name || data.email}`);
        router.push('/');
      }
    }
    setLoading(false);
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

          <div className="flex justify-end mb-2">
          <Link href="/auth/forgot-password" className="text-xs text-sky-600 hover:underline">ลืมรหัสผ่าน?</Link>
          </div>

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
            onClick={() => setIsRegister(!isRegister)} 
            className="text-sky-600 font-semibold hover:underline"
          >
            {isRegister ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิก'}
          </button>
        </div>
      </div>
    </div>
  );
}