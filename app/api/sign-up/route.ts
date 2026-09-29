import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, password } = body;

    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' },
        { status: 409 }
      );
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          email: email.toLowerCase().trim(),
          full_name: full_name.trim(),
          password_hash: passwordHash,
          role_id: 1,
        },
      ])
      .select('user_id, email, full_name, role_id')
      .single();

    if (insertError) {
      console.error('Sign-up error:', insertError);
      return NextResponse.json(
        { error: 'สมัครสมาชิกไม่สำเร็จ: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'สมัครสมาชิกสำเร็จ!',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign-up error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
