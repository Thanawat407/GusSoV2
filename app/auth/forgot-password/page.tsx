'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yqgqbmcmklshurruikln.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key-placeholder';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
    } else {
      setMessage('ส่งลิงก์ตั้งค่ารหัสผ่านใหม่ไปยังอีเมลของคุณเรียบร้อยแล้ว');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md max-w-md w-full space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">ลืมรหัสผ่าน</h2>
          <p className="text-xs text-slate-500 mt-1">กรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${message.includes('เกิดข้อผิดพลาด') ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">อีเมล</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com" 
              className="w-full px-4 py-2.5 border rounded-xl text-sm" 
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-sky-500 text-white font-bold rounded-xl text-sm shadow">
            {loading ? 'กำลังส่งข้อมูล...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
          </button>
        </form>

        <div className="text-center pt-2 border-t">
          <Link href="/auth/login" className="text-xs text-sky-600 hover:underline">← กลับไปหน้าเข้าสู่ระบบ</Link>
        </div>
      </div>
    </div>
  );
}