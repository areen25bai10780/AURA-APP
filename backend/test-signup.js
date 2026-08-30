async function test() {
  try {
    const res = await fetch('http://localhost:5000/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123'
      })
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test script error:', err);
  }
}
test();
