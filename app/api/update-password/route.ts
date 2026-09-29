import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      );
    }

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

    const passwordHash = await hashPassword(newPassword);

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('user_id', user.user_id);

    if (updateError) {
      console.error('Update password error:', updateError);
      return NextResponse.json(
        { error: 'เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    });
  } catch (error: any) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
