import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test1234@example.com',
      password: 'password123',
    })
  });
  const data = await res.json();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", data);
}

main().catch(console.error);
