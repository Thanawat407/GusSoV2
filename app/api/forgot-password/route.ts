import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // บันทึก reset token ลงฐานข้อมูล
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // หมดอายุใน 30 นาที
    const { error: resetError } = await supabaseAdmin
      .from('password_resets')
      .insert({
        user_id: user.user_id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (resetError) {
      console.error('Reset token save error:', resetError);
      return NextResponse.json(
        { error: 'ไม่สามารถสร้างลิงก์รีเซ็ตได้ กรุณาลองใหม่อีกครั้ง' },
        { status: 500 }
      );
    }

    // ส่งอีเมลผ่าน EmailJS HTTP API
    try {
      const emailjsResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'service_5t8qqtj',
          template_id: 'template_1ln8ve7',
          user_id: 'DSI4WZImOBIzggUBL',
          template_params: {
            to_email: email,
            to_name: user.full_name || email,
            reset_link: resetLink,
            reset_token: resetToken,
          },
        }),
      });

      const responseText = await emailjsResponse.text();
      console.log('EmailJS response:', responseText);

      if (!emailjsResponse.ok) {
        console.error('EmailJS API error:', responseText);
        return NextResponse.json(
          { error: 'ไม่สามารถส่งอีเมลได้: ' + responseText },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว',
      });
    } catch (emailError) {
      console.error('EmailJS error:', emailError);
      return NextResponse.json(
        { error: 'เกิดข้อผิดพลาดในการส่งอีเมล: ' + (emailError instanceof Error ? emailError.message : 'Unknown error') },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
