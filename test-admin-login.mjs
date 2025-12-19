// Node 22 tem fetch nativo

const API_URL = 'http://localhost:3000';

async function testAdminLogin() {
  console.log('🧪 Testando login admin...\n');
  
  try {
    // 1. Fazer login
    console.log('1. Fazendo login com admin261/pacientes1...');
    const loginResponse = await fetch(`${API_URL}/api/trpc/auth.adminLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin261',
        password: 'pacientes1'
      })
    });
    
    console.log('Status:', loginResponse.status);
    console.log('Headers:', Object.fromEntries(loginResponse.headers.entries()));
    
    const loginData = await loginResponse.text();
    console.log('Response body:', loginData);
    
    // Verificar cookies
    const setCookie = loginResponse.headers.get('set-cookie');
    console.log('\n2. Cookies recebidos:', setCookie);
    
    if (!setCookie) {
      console.error('❌ ERRO: Nenhum cookie foi definido!');
      return;
    }
    
    // 3. Verificar autenticação
    console.log('\n3. Verificando autenticação com cookie...');
    const meResponse = await fetch(`${API_URL}/api/trpc/auth.me`, {
      headers: {
        'Cookie': setCookie
      }
    });
    
    const meData = await meResponse.json();
    console.log('Usuário autenticado:', JSON.stringify(meData, null, 2));
    
    if (meData.result?.data?.role === 'admin') {
      console.log('\n✅ LOGIN FUNCIONANDO! Usuário é admin.');
    } else {
      console.log('\n❌ ERRO: Usuário não é admin ou não está autenticado.');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAdminLogin();
