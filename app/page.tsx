'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import emailjs from '@emailjs/browser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function GusSoStorefront() {
  const [ebooks, setEbooks] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'books' | 'users' | 'addBook'>('books');
  const [paymentStatus, setPaymentStatus] = useState<'รอชำระเงิน' | 'ชำระเงินแล้ว'>('รอชำระเงิน');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState('');

  useEffect(() => {
    try {
      const sessionData = localStorage.getItem('gusso_current_session');  
      if (sessionData) {
        setCurrentUser(JSON.parse(sessionData));
      }
    } catch (e) {}

    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: booksData, error: booksError } = await supabase.from('ebooks').select('*');
      if (booksError) {
        console.error('Error fetching books:', booksError);
      } else {
        const uniqueBooks = Array.from(
          new Map((booksData || []).map(book => [book.title, book])).values()
        );
        setEbooks(uniqueBooks);
      }

      const { data: userData, error: userError } = await supabase.from('users').select('*');
      if (!userError && userData) {
        setUsersList(userData);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('gusso_current_session');
    setCurrentUser(null);
    setIsAdminModalOpen(false);
    alert('ออกจากระบบเรียบร้อยแล้ว');
  };

  const addToCart = (book: any) => {
    if (book.stock_status === 'หมด' || book.is_active === false) {
      alert('หนังสือเล่มนี้ปิดการขายชั่วคราว');
      return;
    }
    const existing = cart.find(item => item.ebook_id === book.ebook_id);
    if (existing) {
      setCart(cart.map(item => item.ebook_id === book.ebook_id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...book, quantity: 1 }]);
    }
    alert(`เพิ่มหนังสือ "${book.title}" ลงตะกร้าแล้ว!`);
  };

  const updateQuantity = (ebook_id: number, delta: number) => {
    const updated = cart.map(item => {
      if (item.ebook_id === ebook_id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean);
    setCart(updated);
  };

  const removeItem = (ebook_id: number) => {
    setCart(cart.filter(item => item.ebook_id !== ebook_id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal * 0.20;
  const total = subtotal - discount;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleBookStatus = async (ebookId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'หมด' ? 'พร้อมขาย' : 'หมด';
    const { error } = await supabase
      .from('ebooks')
      .update({ stock_status: nextStatus })
      .eq('ebook_id', ebookId);

    if (error) {
      alert('ไม่สามารถเปลี่ยนสถานะได้: ' + error.message);
    } else {
      fetchData();
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('ebooks').insert([{
      title: newTitle,
      author: newAuthor,
      price: parseFloat(newPrice),
      description: newDesc,
      cover_image: newCover || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80',
      stock_status: 'พร้อมขาย',
      category_id: 1,
      author_id: 1
    }]);

    if (error) {
      alert('เพิ่มหนังสือไม่สำเร็จ: ' + error.message);
    } else {
      alert('เพิ่มหนังสือเข้าฐานข้อมูลเรียบร้อยแล้ว!');
      setNewTitle('');
      setNewAuthor('');
      setNewPrice('');
      setNewDesc('');
      setNewCover('');
      setAdminTab('books');
      fetchData();
    }
  };

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setIsCartOpen(false);
    setPaymentStatus('รอชำระเงิน');
    setIsQRModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    setIsCheckingOut(true);

    try {
      let userId = currentUser ? (currentUser.user_id || 1) : null;
      let userEmail = currentUser ? currentUser.email : 'customer@gusso.com';
      let userName = currentUser ? (currentUser.full_name || currentUser.name || 'คุณลูกค้า') : 'คุณลูกค้า GusSo';

      if (!userId) {
        let { data: usersData } = await supabase.from('users').select('user_id, email, full_name').limit(1);
        if (usersData && usersData.length > 0) {
          userId = usersData[0].user_id;
          userEmail = usersData[0].email || userEmail;
          userName = usersData[0].full_name || userName;
        }
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{ user_id: userId, total_amount: total, status: 'ยืนยันแล้ว' }])
        .select()
        .single();

      if (orderError) {
        console.error('Order error:', orderError);
        alert('เกิดข้อผิดพลาดในการบันทึก orders: ' + orderError.message);
        setIsCheckingOut(false);
        return;
      }

      const orderId = orderData.order_id;
      const receiptNo = 'RCP-2026-' + String(orderId).padStart(4, '0');

      try {
        await supabase
          .from('payments')
          .insert([{
            order_id: orderId,
            amount: total,
            payment_status: 'ชำระเงินแล้ว',
            paid_at: new Date().toISOString(),
            payment_method: 'PromptPay QR',
            slip_image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&q=80'
          }]);
      } catch (payErr) {
        console.error('Payment table warning (non-fatal):', payErr);
      }

      let orderItemsHtmlList = [];

      for (const item of cart) {
        const itemPrice = (item.price * 0.8) * item.quantity;
        
        await supabase.from('order_items').insert([{
          order_id: orderId,
          ebook_id: item.ebook_id,
          price_at_purchase: itemPrice
        }]);

        const tokenVal = 'secure_dl_' + orderId + '_' + Math.random().toString(36).substring(2, 8);
        await supabase.from('download_links').insert([{
          order_id: orderId,
          ebook_id: item.ebook_id,
          token: tokenVal,
          is_active: true
        }]);

        orderItemsHtmlList.push({
          title: item.title,
          quantity: item.quantity,
          price: itemPrice,
          token: tokenVal
        });
      }

      let itemsHtml = orderItemsHtmlList.map(i => `
        <div style="margin-bottom: 8px; padding: 10px; background: #f0f9ff; border-radius: 8px; border: 1px solid #bae6fd;">
          <b>${i.title}</b> (x${i.quantity}) - ฿${i.price.toFixed(2)}<br>
          <span style="font-size: 11px; color: #0284c7;">📥 ลิงก์ดาวน์โหลดส่วนตัว: <b>${window.location.origin}/download?token=${i.token}</b></span>
        </div>
      `).join('');

      await emailjs.send(
        'service_5t8qqtj',
        'template_cudu5ko',
        {
          email: userEmail,
          name: userName,
          receipt_no: receiptNo,
          date: new Date().toLocaleString('th-TH'),
          items_html: itemsHtml,
          total_price: `฿${total.toFixed(2)}`
        },
        'DSI4WZImOBIzggUBL'
      );

      setPaymentStatus('ชำระเงินแล้ว');
      alert(`ชำระเงินสำเร็จ! ส่งใบเสร็จพร้อมลิงก์ดาวน์โหลดไปที่อีเมล ${userEmail} เรียบร้อยแล้ว`);
      setCart([]);
      setIsQRModalOpen(false);
    } catch (err) {
      console.error('Checkout error:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const isAdmin = currentUser && (currentUser.email === 'admin@gusso.com' || currentUser.role_id === 2);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            G
          </div>
          <h1 className="text-xl font-bold text-slate-800">GusSo Digital Bookstore</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button 
              onClick={() => setIsAdminModalOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center space-x-1"
            >
              <span>⚙️ หลังบ้าน (Admin)</span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center space-x-3 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{currentUser.full_name || currentUser.name || 'ผู้ใช้งาน'}</p>
                <p className="text-[10px] text-slate-500">{currentUser.email}</p>
              </div>
              <button onClick={handleLogout} className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg transition">
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
              เข้าสู่ระบบ
            </Link>
          )}

          <button onClick={() => setIsCartOpen(true)} className="bg-sky-50 hover:bg-sky-100 border border-sky-200 px-4 py-2 rounded-xl text-xs font-semibold text-sky-600 flex items-center space-x-2 transition shadow-sm">
            <span>🛒 ตะกร้าสินค้า</span>
            <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full text-[10px]">{totalItemsCount}</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 flex-1 w-full space-y-8">
        <div className="bg-gradient-to-r from-sky-500 to-sky-700 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">ยินดีต้อนรับสู่คลังหนังสือดิจิทัล GusSo</h2>
            <p className="text-sky-100 text-sm">ระบบฐานข้อมูล E-Book พร้อมระบบจัดการหลังบ้านสำหรับผู้ดูแลระบบ</p>
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6">รายการ E-Book จากฐานข้อมูล</h3>
          {loading ? (
            <div className="text-center py-20 bg-white rounded-3xl border shadow-sm">
              <p className="text-slate-500 text-sm animate-pulse">กำลังโหลดข้อมูลจากฐานข้อมูล Supabase...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ebooks.map((book: any) => (
                <div key={book.ebook_id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="relative">
                      <img src={book.cover_image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80"} alt={book.title} className="w-full h-48 object-cover rounded-2xl mb-3 shadow-inner" />
                      <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold shadow ${book.stock_status === 'หมด' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        {book.stock_status || 'พร้อมขาย'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-slate-800 line-clamp-1">{book.title}</h4>
                      <span className="text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">⭐ 4.8</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">ผู้แต่ง: {book.author}</p>
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <b>เนื้อเรื่องย่อ:</b> {book.description || 'หนังสือคู่มือคุณภาพเยี่ยม เนื้อหาเข้มข้น เหมาะสำหรับศึกษาและพัฒนาทักษะ'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div>
                      <span className="text-[11px] text-slate-400 line-through">฿{book.price}</span>
                      <span className="text-sky-600 font-bold text-base ml-2">฿{(book.price * 0.8).toFixed(2)}</span>
                    </div>
                    <button 
                      onClick={() => addToCart(book)} 
                      disabled={book.stock_status === 'หมด'}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition"
                    >
                      {book.stock_status === 'หมด' ? 'ปิดการขาย' : '+ เพิ่มลงตะกร้า'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {isAdminModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl h-[85vh] p-6 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden">
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">⚙️ ระบบบริหารจัดการหลังบ้าน (Admin Management)</h3>
                  <p className="text-xs text-slate-500">สำหรับผู้ดูแลระบบเท่านั้น ควบคุมสต็อก เปิด-ปิดการขาย และดูสมาชิก</p>
                </div>
                <button onClick={() => setIsAdminModalOpen(false)} className="text-slate-400 font-bold text-lg">✕</button>
              </div>

              <div className="flex space-x-2 my-4 border-b pb-2">
                <button 
                  onClick={() => setAdminTab('books')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'books' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  จัดการหนังสือ ({ebooks.length})
                </button>
                <button 
                  onClick={() => setAdminTab('users')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'users' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  สมาชิกในระบบ ({usersList.length} คน)
                </button>
                <button 
                  onClick={() => setAdminTab('addBook')} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${adminTab === 'addBook' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  + เพิ่มหนังสือเล่มใหม่
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-2">
                {adminTab === 'books' && (
                  <div className="space-y-3">
                    {ebooks.map((b) => (
                      <div key={b.ebook_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
                        <div className="flex items-center space-x-3">
                          <img src={b.cover_image} alt="" className="w-10 h-12 object-cover rounded-lg" />
                          <div>
                            <p className="font-bold text-slate-800">{b.title}</p>
                            <p className="text-xs text-slate-500">ราคา: ฿{b.price} | สถานะ: <span className={b.stock_status === 'หมด' ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>{b.stock_status || 'พร้อมขาย'}</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleBookStatus(b.ebook_id, b.stock_status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition ${b.stock_status === 'หมด' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
                        >
                          {b.stock_status === 'หมด' ? 'เปิดการขาย' : 'ปิดการขาย'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === 'users' && (
                  <div className="space-y-3">
                    {usersList.map((u) => (
                      <div key={u.user_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
                        <div>
                          <p className="font-bold text-slate-800">{u.full_name || 'ไม่ระบุชื่อ'}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${u.role_id === 2 ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                          {u.role_id === 2 ? 'ADMIN' : 'CUSTOMER'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {adminTab === 'addBook' && (
                  <form onSubmit={handleAddBook} className="space-y-4 max-w-lg mx-auto">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อหนังสือ</label>
                      <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="เช่น Advanced SQL Programming" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้แต่ง</label>
                      <input type="text" value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="เช่น กรกช ชัยสิทธิ์" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">ราคา (บาท)</label>
                      <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="350" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">เนื้อเรื่องย่อ</label>
                      <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="รายละเอียดสรุปเนื้อหาหนังสือ..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">URL รูปภาพปก (ถ้ามี)</label>
                      <input type="text" value={newCover} onChange={(e) => setNewCover(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" placeholder="https://..." />
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm">
                      บันทึกเพิ่มหนังสือใหม่
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="pt-4 border-t text-right">
              <button onClick={() => setIsAdminModalOpen(false)} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-lg font-bold">🛒 ตะกร้าสินค้าของคุณ</h3>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 font-bold">✕</button>
              </div>
              <div className="divide-y max-h-[60vh] overflow-y-auto my-4">
                {cart.map((item) => (
                  <div key={item.ebook_id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <h5 className="font-semibold text-slate-800">{item.title}</h5>
                      <span className="text-xs text-sky-600">฿{(item.price * 0.8).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => updateQuantity(item.ebook_id, -1)} className="px-2 py-0.5 bg-slate-100 rounded text-xs">-</button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.ebook_id, 1)} className="px-2 py-0.5 bg-slate-100 rounded text-xs">+</button>
                      <button onClick={() => removeItem(item.ebook_id)} className="text-rose-500 text-xs ml-2">ลบ</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-sky-600">
                  <span>ยอดรวมสุทธิ:</span>
                  <span>฿{total.toFixed(2)}</span>
                </div>
                <button onClick={openPaymentModal} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-2xl shadow">
                  ไปหน้าชำระเงิน (QR PromptPay)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isQRModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-6 text-center">
            <h3 className="text-xl font-bold text-slate-800">สแกน QR Code เพื่อชำระเงิน</h3>
            <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100">
              <p className="text-xs text-slate-500 mb-2">สถานะการชำระเงินปัจจุบัน:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${paymentStatus === 'ชำระเงินแล้ว' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {paymentStatus}
              </span>
            </div>
            <div className="flex justify-center">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=GusSoBookstorePromptPay" alt="PromptPay QR" className="rounded-xl border p-2 shadow-inner" />
            </div>
            <p className="text-sm font-semibold text-slate-700">ยอดชำระ: ฿{total.toFixed(2)}</p>
            <div className="space-y-2">
              <button 
                onClick={handleConfirmPayment} 
                disabled={isCheckingOut}
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow transition"
              >
                {isCheckingOut ? 'กำลังตรวจสอบ...' : 'จำลองการชำระเงินสำเร็จ (ยืนยันสิทธิ์)'}
              </button>
              <button onClick={() => setIsQRModalOpen(false)} className="w-full py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-white border-t py-6 text-center text-xs text-slate-400 mt-12">
        Database Mini Project - GusSo Digital Bookstore &copy; 2026
      </footer>
    </div>
  );
}