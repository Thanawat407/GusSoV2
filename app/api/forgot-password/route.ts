import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, email')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ไม่พบอีเมลนี้ในระบบ' },
        { status: 404 }
      );
    }

    // ส่งอีเมลรีเซ็ตรหัสผ่าน (จำลอง - ในระบบจริงควรส่งอีเมลจริง)
    // สร้าง token สำหรับรีเซ็ตรหัสผ่าน
    const resetToken = 'reset_' + Math.random().toString(36).substring(2, 15);

    // บันทึก token ลงฐานข้อมูล (ในระบบจริงควรมีตาราง password_resets)
    // ตอนนี้จำลองการส่งอีเมล

    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว',
      // ในระบบจริงไม่ควรส่ง token กลับไป client
      // resetToken: resetToken,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
