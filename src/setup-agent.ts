import { spawn, execSync } from 'child_process';
import type { Response } from 'express';
import { SETUP_PROMPT } from './setup-prompt';

export type AgentCLI = 'claude' | 'codex' | null;

export function detectCLI(): AgentCLI {
  for (const cmd of ['claude', 'codex'] as const) {
    try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return cmd; }
    catch {}
  }
  return null;
}

export function runSetupAgent(res: Response, configPath: string): void {
  const cli = detectCLI();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  if (!cli) {
    send({ type: 'error', text: 'No Claude Code or Codex CLI found.\nInstall: npm install -g @anthropic-ai/claude-code' });
    res.end();
    return;
  }

  send({ type: 'info', text: `Using ${cli} CLI to scan your workspace...` });

  const prompt = SETUP_PROMPT.replace(/\{\{CONFIG_PATH\}\}/g, configPath);

  const args = cli === 'claude'
    ? ['-p', prompt, '--output-format', 'stream-json',
       '--allowedTools', 'Read,Write,Bash,Glob',
       '--permission-mode', 'acceptEdits']
    : ['-q', '--no-interactive', prompt];

  const proc = spawn(cli, args, { env: { ...process.env, HOME: process.env.HOME } });
  let buffer = '';

  proc.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text' && block.text) send({ type: 'text', text: block.text });
            else if (block.type === 'tool_use') send({ type: 'tool', name: block.name, input: block.input });
          }
        } else if (msg.type === 'result') {
          send({ type: 'result', text: msg.result ?? '' });
        }
      } catch {
        send({ type: 'text', text: line });
      }
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    const t = chunk.toString().trim();
    if (t) send({ type: 'stderr', text: t });
  });

  proc.on('close', (code) => {
    if (buffer.trim()) send({ type: 'text', text: buffer });
    send({ type: 'done', exitCode: code });
    res.end();
  });

  proc.on('error', (err) => { send({ type: 'error', text: err.message }); res.end(); });
  res.on('close', () => { try { proc.kill(); } catch {} });
}
