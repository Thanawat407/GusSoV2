-- ============================================
-- GusSo Digital Bookstore - Database Schema (v2)
-- เพิ่มตาราง password_resets สำหรับระบบรีเซ็ตรหัสผ่าน
-- ============================================

-- ลบตารางเดิมทั้งหมดก่อน
DROP TABLE IF EXISTS download_links CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS ebooks CASCADE;
DROP TABLE IF EXISTS authors CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- สร้างตาราง users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INTEGER DEFAULT 1 CHECK (role_id IN (1, 2)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- สร้างตาราง password_resets (สำหรับระบบรีเซ็ตรหัสผ่าน)
CREATE TABLE password_resets (
    reset_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- สร้างตาราง categories
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT
);

-- สร้างตาราง authors
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    author_name VARCHAR(255) NOT NULL,
    bio TEXT
);

-- สร้างตาราง ebooks
CREATE TABLE ebooks (
    ebook_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    cover_image TEXT,
    stock_status VARCHAR(20) DEFAULT 'พร้อมขาย',
    category_id INTEGER REFERENCES categories(category_id),
    author_id INTEGER REFERENCES authors(author_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง carts
CREATE TABLE carts (
    cart_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง cart_items
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
    ebook_id INTEGER REFERENCES ebooks(ebook_id),
    quantity INTEGER DEFAULT 1
);

-- สร้างตาราง orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ยืนยันแล้ว',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- สร้างตาราง order_items
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    ebook_id INTEGER REFERENCES ebooks(ebook_id),
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    quantity INTEGER DEFAULT 1
);

-- สร้างตาราง payments
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'รอชำระเงิน',
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_method VARCHAR(100),
    slip_image TEXT
);

-- สร้างตาราง download_links
CREATE TABLE download_links (
    link_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    ebook_id INTEGER REFERENCES ebooks(ebook_id),
    token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- เปิด RLS ทั้งหมด
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;

-- Policies สำหรับ users
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON users FOR UPDATE USING (true);

-- Policies สำหรับ password_resets
CREATE POLICY "password_resets_select" ON password_resets FOR SELECT USING (true);
CREATE POLICY "password_resets_insert" ON password_resets FOR INSERT WITH CHECK (true);
CREATE POLICY "password_resets_update" ON password_resets FOR UPDATE USING (true);
CREATE POLICY "password_resets_delete" ON password_resets FOR DELETE USING (true);

-- Policies สำหรับ categories
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (true);

-- Policies สำหรับ authors
CREATE POLICY "authors_select" ON authors FOR SELECT USING (true);
CREATE POLICY "authors_insert" ON authors FOR INSERT WITH CHECK (true);

-- Policies สำหรับ ebooks
CREATE POLICY "ebooks_select" ON ebooks FOR SELECT USING (true);
CREATE POLICY "ebooks_insert" ON ebooks FOR INSERT WITH CHECK (true);
CREATE POLICY "ebooks_update" ON ebooks FOR UPDATE USING (true);

-- Policies สำหรับ carts
CREATE POLICY "carts_select" ON carts FOR SELECT USING (true);
CREATE POLICY "carts_insert" ON carts FOR INSERT WITH CHECK (true);

-- Policies สำหรับ cart_items
CREATE POLICY "cart_items_select" ON cart_items FOR SELECT USING (true);
CREATE POLICY "cart_items_insert" ON cart_items FOR INSERT WITH CHECK (true);

-- Policies สำหรับ orders
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);

-- Policies สำหรับ order_items
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);

-- Policies สำหรับ payments
CREATE POLICY "payments_select" ON payments FOR SELECT USING (true);
CREATE POLICY "payments_insert" ON payments FOR INSERT WITH CHECK (true);

-- Policies สำหรับ download_links
CREATE POLICY "download_links_select" ON download_links FOR SELECT USING (true);
CREATE POLICY "download_links_insert" ON download_links FOR INSERT WITH CHECK (true);

-- Seed data
INSERT INTO categories (category_name, description) VALUES
    ('Programming', 'หนังสือเกี่ยวกับการเขียนโปรแกรม'),
    ('Database', 'หนังสือเกี่ยวกับฐานข้อมูล'),
    ('Web Development', 'หนังสือเกี่ยวกับการพัฒนาเว็บ'),
    ('Data Science', 'หนังสือเกี่ยวกับวิทยาศาสตร์ข้อมูล')
ON CONFLICT DO NOTHING;

INSERT INTO authors (author_name, bio) VALUES
    ('ผู้เชี่ยวชาญ', 'ผู้เขียนหนังสือด้านเทคโนโลยี')
ON CONFLICT DO NOTHING;

INSERT INTO ebooks (title, author, price, description, cover_image, stock_status, category_id, author_id) VALUES
    ('Advanced SQL Programming', 'ผู้เชี่ยวชาญ', 350.00, 'หนังสือเกี่ยวกับ SQL ขั้นสูง', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&q=80', 'พร้อมขาย', 2, 1),
    ('Next.js 15 Guide', 'ผู้เชี่ยวชาญ', 450.00, 'คู่มือพัฒนาเว็บด้วย Next.js 15', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80', 'พร้อมขาย', 3, 1),
    ('Database Design', 'ผู้เชี่ยวชาญ', 300.00, 'การออกแบบฐานข้อมูล', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=500&q=80', 'พร้อมขาย', 2, 1)
ON CONFLICT DO NOTHING;
