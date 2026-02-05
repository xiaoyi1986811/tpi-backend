// server.js - TPI 后端服务（支持用户登录 + SQLite 数据库）
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your_strong_secret_key_change_in_production'; // 生产环境请更换！

// 数据库路径
const DB_PATH = path.resolve(__dirname, './tpi.db');
let db;

// 中间件
app.use(express.json());

// CORS（允许前端跨域请求）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// 连接数据库
function connectDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        reject(err);
      } else {
        console.log('✅ 成功连接到 SQLite 数据库');
        resolve(db);
      }
    });
  });
}

// 验证 Token 中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 格式: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: '未提供访问令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
}

// ========== 路由 ==========

// 1. 登录接口
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '缺少用户名或密码' });
  }

  try {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username);
    stmt.finalize();

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 生成 JWT Token（有效期 24 小时）
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: '登录成功',
      token: token,
      username: user.username
    });

  } catch (err) {
    console.error('登录处理出错:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 2. 获取 TPI 数据（需登录）
app.get('/api/data', authenticateToken, (req, res) => {
  const tpiData = {
    tpi: 85.6,
    updateTime: new Date().toISOString(),
    departments: [
      { name: "研发部", score: 92 },
      { name: "市场部", score: 78 },
      { name: "运营部", score: 88 },
      { name: "人力资源部", score: 85 }
    ],
    message: "数据来自后端，仅登录用户可见"
  };
  res.json(tpiData);
});

// 3. 健康检查（公开访问）
app.get('/health', (req, res) => {
  res.status(200).send('TPI Backend with Auth is running!');
});

// 启动服务
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ TPI 后端（带登录功能）已启动`);
    console.log(`🌐 监听端口: ${PORT}`);
    console.log(`🔗 登录测试地址: POST /api/login`);
    console.log(`🔐 默认账号: xiaoyi / 密码: 123456`);
  });
}).catch(err => {
  console.error('❌ 无法启动服务:', err);
  process.exit(1);
});