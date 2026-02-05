// init-db.js - 初始化 SQLite 数据库和用户
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./tpi.db');

// 创建 users 表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 添加默认用户：xiaoyi / 123456
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);

  db.run(`INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)`, 
    ['xiaoyi', hash],
    function(err) {
      if (err) {
        console.error('❌ 插入用户失败:', err.message);
      } else {
        console.log('✅ 默认用户已创建（用户名: xiaoyi，密码: 123456）');
      }
    }
  );
});

db.close();