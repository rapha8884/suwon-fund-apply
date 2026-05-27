const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8080;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qwe140511';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('json')) {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try { req.body = JSON.parse(body); } catch(e) { req.body = {}; }
      next();
    });
  } else { next(); }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      receipt_num VARCHAR(20),
      company_name VARCHAR(100),
      ceo_name VARCHAR(50),
      phone VARCHAR(20),
      email VARCHAR(100),
      industry VARCHAR(50),
      biz_age VARCHAR(50),
      address VARCHAR(200),
      revenue VARCHAR(50),
      emp_count VARCHAR(20),
      fund_types TEXT,
      fund_amount VARCHAR(50),
      loan_status VARCHAR(50),
      fund_timing VARCHAR(50),
      memo TEXT,
      coupon_code VARCHAR(30),
      submitted_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ DB 준비 완료');
}

// 신청서 제출
app.post('/api/apply', async (req, res) => {
  try {
    const d = req.body || {};
    await pool.query(`
      INSERT INTO applications
        (receipt_num, company_name, ceo_name, phone, email, industry, biz_age,
         address, revenue, emp_count, fund_types, fund_amount, loan_status,
         fund_timing, memo, coupon_code)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    `, [
      d.receipt_num, d.company_name, d.ceo_name, d.phone, d.email,
      d.industry, d.biz_age, d.address, d.revenue, d.emp_count,
      d.fund_types, d.fund_amount, d.loan_status, d.fund_timing,
      d.memo, d.coupon_code
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// 신청자 목록
app.get('/api/list', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM applications ORDER BY submitted_at DESC');
    res.json({ success: true, rows: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 신청자 삭제 ← 이게 핵심!
app.delete('/api/delete/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id = $1', [req.params.id]);
    console.log('삭제 완료 id:', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('삭제 오류:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('✅ 수원시특례지원금 서버 정상 작동 중');
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 서버 실행: http://localhost:${PORT}`));
}).catch(err => { console.error(err); process.exit(1); });
