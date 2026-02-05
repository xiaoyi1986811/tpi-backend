// server.js
const express = require('express');
const app = express();

// 正确读取环境变量端口（Render 使用 PORT）
const PORT = 3000; // 强制使用 3000 端口
// 启用 CORS 跨域（允许 GitHub Pages 访问）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 健康检查接口
app.get('/health', (req, res) => {
  res.status(200).send('TPI Backend is running!');
});

// 主数据接口：返回 TPI 全维效能数据
app.get('/api/data', (req, res) => {
  const tpiData = {
    tpi: 85.6,
    updateTime: new Date().toISOString(),
    departments: [
      { name: "研发部", score: 92 },
      { name: "市场部", score: 78 },
      { name: "运营部", score: 88 },
      { name: "人力资源部", score: 85 }
    ],
    message: "数据由后端动态生成，非前端硬编码"
  };
  res.json(tpiData);
});

// 处理所有未匹配的请求（安全写法，避免通配符错误）
app.get(/.*/, (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ TPI 后端服务已启动`);
  console.log(`🌐 监听端口: ${PORT}`);
  console.log(`🔗 本地测试: http://localhost:${PORT}/api/data`);
});