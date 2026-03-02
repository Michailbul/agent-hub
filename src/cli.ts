import { spawn, execSync } from 'child_process';
import path from 'path';

const PORT = parseInt(process.env.PORT ?? '4001');
const args = process.argv.slice(2);
const doTunnel = args.includes('--tunnel');
const noOpen   = args.includes('--no-open') || args.includes('--vps');

const server = spawn('node', [path.join(__dirname, 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
});

server.on('error', (e: Error) => { console.error('Server error:', e); process.exit(1); });
process.on('SIGINT', () => { server.kill(); process.exit(0); });
process.on('SIGTERM', () => { server.kill(); process.exit(0); });

setTimeout(async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n⚙️  Agent Hub → ${url}\n`);
  if (doTunnel) {
    startTunnel(PORT);
  } else if (!noOpen) {
    try { const { default: open } = await import('open'); await open(url); } catch {}
  }
}, 1200);

function startTunnel(port: number): void {
  try { execSync('which cloudflared', { stdio: 'ignore' }); }
  catch {
    console.log('Installing cloudflared...');
    execSync('npm install -g cloudflared', { stdio: 'inherit' });
  }
  console.log('🌐 Starting Cloudflare tunnel...');
  const t = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], { stdio: 'inherit' });
  process.on('SIGINT', () => { try { t.kill(); } catch {} });
}
