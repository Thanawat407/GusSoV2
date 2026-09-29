'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqgqbmcmklshurruikln.supabase.co';
const supabaseKey = 'sb_publishable_tmmvIicxYSDbKjEAabdn8w_IkWl8siK';
const supabase = createClient(supabaseUrl, supabaseKey);

export function SignUpForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // บันทึกข้อมูลลงตาราง users พร้อมฟิลด์ user_pwd ให้ตรงกับฐานข้อมูล Supabase
      const { error } = await supabase.from('users').insert([{
        email: email.trim(),
        full_name: fullName.trim(),
        role_id: 1,
        user_pwd: password
      }]);

      if (error) {
        alert('สมัครสมาชิกไม่สำเร็จ: ' + error.message);
      } else {
        alert('สมัครสมาชิกสำเร็จ!');
        localStorage.setItem('gusso_current_session', JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          role_id: 1
        }));
        window.location.href = '/';
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'Failed to fetch'));
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
            autoComplete="new-password"
            className="w-full px-3.5 py-2.5 border rounded-xl text-sm outline-none focus:border-sky-500 transition text-slate-800" 
            placeholder="••••••••••••" 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm shadow-md transition"
        >
          {loading ? 'กำลังตรวจสอบ...' : 'ยืนยันการสมัครสมาชิก'}
        </button>
      </form>

      <div className="flex justify-between items-center text-xs pt-2 border-t">
        <Link href="/" className="text-slate-500 hover:text-slate-700">← กลับหน้าหลัก</Link>
        <Link href="/auth/login" className="text-sky-600 font-bold hover:underline">มีบัญชีอยู่แล้ว? เข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}