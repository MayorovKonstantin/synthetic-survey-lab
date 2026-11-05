import { spawn } from 'node:child_process';

const command = {
  encrypt: `try { $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8); $value = $reader.ReadToEnd(); $bytes = [System.Text.Encoding]::UTF8.GetBytes($value); $protected = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($protected)) } catch { [Console]::Error.Write('Credential encryption failed.'); exit 1 }`,
  decrypt: `try { [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); $reader = [System.IO.StreamReader]::new([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8); $encoded = $reader.ReadToEnd(); $bytes = [Convert]::FromBase64String($encoded); $plain = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([System.Text.Encoding]::UTF8.GetString($plain)) } catch { [Console]::Error.Write('Credential decryption failed.'); exit 1 }`
};

function dpapi(mode, input) {
  if (process.platform !== 'win32') throw new Error('Secure ChatGPT credential storage requires Windows DPAPI on this build.');
  return new Promise((resolve, reject) => {
    const child = spawn('pwsh.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', command[mode]],
      { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    let output = '', error = '';
    const timer = setTimeout(() => child.kill(), 10000);
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 2_800_000) child.kill(); });
    child.stderr.on('data', chunk => { error += chunk; if (error.length > 1000) child.kill(); });
    child.on('error', () => { clearTimeout(timer); reject(new Error('Windows credential protection is unavailable.')); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(output);
      else reject(new Error(error.trim() || 'Windows credential protection failed.'));
    });
    child.stdin.end(input, 'utf8');
  });
}

export const windowsCredentialEncryption = {
  id: 'windows-dpapi-v1',
  isAvailable: () => process.platform === 'win32',
  async encrypt(plaintext) { return Buffer.from(await dpapi('encrypt', plaintext), 'base64'); },
  async decrypt(ciphertext) { return dpapi('decrypt', Buffer.from(ciphertext).toString('base64')); }
};
