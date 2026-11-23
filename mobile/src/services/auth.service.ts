// --- MODO SIMULACIÓN 
export async function registerUser(data: { name: string; email: string; password: string }) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log('Datos recibidos localmente:', data);
  return { success: true, message: 'Usuario registrado localmente' };
}

/* 
// --- MODO REAL (Descomentar cuando el backend) ---
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function registerUser(data: { name: string; email: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || 'Error al registrar usuario');
  }
  return json;
}
*/