// init-db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./tpi.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )`);

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('123456', salt);

  db.run(`INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)`, 
    ['xiaoyi', hash],
    function(err) {
      if (err) console.error('❌ 用户创建失败:', err.message);
      else console.log('✅ 默认用户已创建（xiaoyi / 123456）');
    }
  );
});

db.close();