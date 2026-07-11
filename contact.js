// Frontend helper to send contact form details to the Express backend
// This function calls POST /contact on http://localhost:5000

async function sendContactMessage(name, email, message, phone = '', service = '') {
  const response = await fetch('http://localhost:5000/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      phone,
      email,
      service,
      message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Unable to send contact message');
  }

  return data;
}

export { sendContactMessage };