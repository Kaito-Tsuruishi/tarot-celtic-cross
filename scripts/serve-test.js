#!/usr/bin/env node
// 回帰テスト用のサーバ。dist/index.html に tests/selftest.js を差し込んで配信し、結果を tests/report-*.json に保存する。
// 使い方: node scripts/serve-test.js [port]  →  http://localhost:8766/?selftest をブラウザで開く
const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const port = Number(process.argv[2]) || 8766;

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (req.method === 'POST' && url.pathname === '/__report') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const data = JSON.parse(body);
      const name = `report-${data.viewport}-${Date.now()}.json`;
      fs.writeFileSync(path.join(root, 'tests', name), JSON.stringify(data, null, 2));
      console.log(`${name}: ${data.total - data.failed}/${data.total} passed`);
      res.writeHead(204); res.end();
    });
    return;
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
    const test = fs.readFileSync(path.join(root, 'tests', 'selftest.js'), 'utf8');
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
    res.end(html.replace('</body>', `<script>\n${test}</script>\n</body>`));
    return;
  }
  res.writeHead(404); res.end();
}).listen(port, () => console.log(`selftest server: http://localhost:${port}/?selftest`));
