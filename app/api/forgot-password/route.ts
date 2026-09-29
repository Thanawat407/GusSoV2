import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/nodejs';

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

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('user_id, email, full_name')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'ไม่พบอีเมลนี้ในระบบ' },
        { status: 404 }
      );
    }

    const resetToken = 'reset_' + Math.random().toString(36).substring(2, 15);
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gussov2.onrender.com'}/auth/update-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    try {
      await emailjs.send(
        'service_5t8qqtj',
        'template_1ln8ve7',
        {
          to_email: email,
          to_name: user.full_name || email,
          reset_link: resetLink,
          reset_token: resetToken,
        },
        {
          publicKey: 'DSI4WZImOBIzggUBL',
          privateKey: process.env.EMAILJS_PRIVATE_KEY || '',
        }
      );
    } catch (emailError) {
      console.error('EmailJS error:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
