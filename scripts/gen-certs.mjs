import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import getCert from 'selfsigned';

const here = dirname(fileURLToPath(import.meta.url));
const certDir = resolve(here, '..', '.certs');
const keyPath = resolve(certDir, 'lm-dev-key.pem');
const certPath = resolve(certDir, 'lm-dev-cert.pem');

const certsExist = existsSync(keyPath) && existsSync(certPath);

async function ensureCerts() {
  if (certsExist) return;
  const hosts = (process.env.LM_HOSTS || 'localhost,192.168.1.6')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean);
  mkdirSync(certDir, { recursive: true });
  const pems = await getCert.generate(
    [{ name: 'commonName', value: hosts[0] }],
    {
      days: 365,
      keySize: 2048,
      extensions: [
        {
          name: 'subjectAltName',
          altNames: hosts.map((h) =>
            h.match(/^\d+\.\d+\.\d+\.\d+$/)
              ? { type: 7, ip: h }
              : { type: 2, value: h }
          ),
        },
      ],
    }
  );
  writeFileSync(keyPath, pems.private);
  writeFileSync(certPath, pems.cert);
  console.log('Generated TLS certificates for hosts:', hosts.join(', '));
}

await ensureCerts();
console.log(certsExist ? `Certificates already exist: ${certPath}` : 'Generated.');