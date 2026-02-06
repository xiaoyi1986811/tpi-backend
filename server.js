const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;
const USERS = { xiaoyi: '123456' };
let TPI_DATA_STORE = {};

function parsePostBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

async function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    sendJSON(res, 200, {});
    return;
  }

  if (path === '/api/login' && req.method === 'POST') {
    try {
      const body = await parsePostBody(req);
      const { username, password } = body;
      if (!username || !password) {
        sendJSON(res, 400, { error: '缺少用户名或密码' });
        return;
      }
      if (USERS[username] && USERS[username] === password) {
        const token = `tpi-local-token-${username}`;
        sendJSON(res, 200, { token });
      } else {
        sendJSON(res, 401, { error: '用户名或密码错误' });
      }
    } catch (err) {
      console.error('Login error:', err);
      sendJSON(res, 500, { error: '服务器内部错误' });
    }
    return;
  }

  if (path === '/api/save' && req.method === 'POST') {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJSON(res, 401, { error: '未提供有效认证令牌' });
        return;
      }
      const token = authHeader.split(' ')[1];
      if (!token.includes('tpi-local-token-xiaoyi')) {
        sendJSON(res, 401, { error: '无效令牌' });
        return;
      }
      const data = await parsePostBody(req);
      TPI_DATA_STORE['xiaoyi'] = { ...data, timestamp: new Date().toISOString() };
      sendJSON(res, 200, { success: true, message: 'TPI 数据已保存' });
    } catch (err) {
      console.error('Save error:', err);
      sendJSON(res, 500, { error: '保存失败' });
    }
    return;
  }

  if (path === '/api/data' && req.method === 'GET') {
    try {
      const authHeader = req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        sendJSON(res, 401, { error: '未提供有效认证令牌' });
        return;
      }
      const token = authHeader.split(' ')[1];
      if (!token.includes('tpi-local-token-xiaoyi')) {
        sendJSON(res, 401, { error: '无效令牌' });
        return;
      }
      const data = TPI_DATA_STORE['xiaoyi'] || {};
      sendJSON(res, 200, data);
    } catch (err) {
      console.error('Load error:', err);
      sendJSON(res, 500, { error: '加载失败' });
    }
    return;
  }

  sendJSON(res, 404, { error: '接口不存在' });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`✅ TPI 后端服务已启动`);
  console.log(`👉 监听端口: ${PORT}`);
  console.log(`🔐 登录凭证: xiaoyi / 123456`);
});
