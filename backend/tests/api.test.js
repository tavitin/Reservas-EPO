/**
 * Tests de integración — Reserva EPO Backend
 * Ejecutar: node tests/api.test.js
 * Requiere el backend corriendo en localhost:4000
 */

const BASE = 'http://localhost:4000/api';
let passed = 0;
let failed = 0;
let adminToken = '';
let maestroToken = '';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
async function req(method, path, body, token) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

/* ─── suites ──────────────────────────────────────────────────────────────── */

async function testHealth() {
  console.log('\n📋 Health');
  const { status, data } = await req('GET', '/health');
  assert('GET /health → 200 ok', status === 200 && data?.status === 'ok');
}

async function testAuth() {
  console.log('\n🔐 Autenticación');

  // Login inválido
  const bad = await req('POST', '/auth/login', { email: 'noexiste@epo.edu.mx', password: 'wrong' });
  assert('Login con credenciales inválidas → 401', bad.status === 401);

  // Login sin body
  const empty = await req('POST', '/auth/login', {});
  assert('Login sin email/password → 400', empty.status === 400);

  // Login admin válido
  const ok = await req('POST', '/auth/login', { email: 'admin@epo.edu.mx', password: 'Admin2024!' });
  assert('Login admin válido → 200 con token', ok.status === 200 && !!ok.data?.token);
  if (ok.data?.token) adminToken = ok.data.token;
  assert('Token de admin tiene rol=admin', ok.data?.user?.rol === 'admin');
}

async function testUsuarioSeguridad() {
  console.log('\n👤 Seguridad — Usuarios');

  // Crear maestro con rol=admin en el body (debe ignorarse)
  const testEmail = `test_seg_${Date.now()}@epo.mx`;
  const res = await req('POST', '/usuarios', {
    nombre: 'Test Seguridad',
    email: testEmail,
    password: 'test1234',
    rol: 'admin',            // <-- intento de escalación de privilegios
  }, adminToken);

  assert('Crear usuario con rol=admin en body → 201', res.status === 201);
  assert('Usuario creado tiene rol=maestro (no admin)', res.data?.rol === 'maestro',
    `rol recibido: ${res.data?.rol}`);

  // Login con el usuario recién creado
  const login = await req('POST', '/auth/login', { email: testEmail, password: 'test1234' });
  assert('Login con nuevo maestro → 200', login.status === 200);
  if (login.data?.token) maestroToken = login.data.token;
  assert('Token del nuevo usuario tiene rol=maestro', login.data?.user?.rol === 'maestro');

  // Crear usuario con password corta
  const short = await req('POST', '/usuarios', {
    nombre: 'Short Pass',
    email: `short_${Date.now()}@epo.mx`,
    password: '123',
  }, adminToken);
  assert('Password < 6 chars → 400', short.status === 400);

  // Crear usuario sin campos requeridos
  const missing = await req('POST', '/usuarios', { nombre: 'Sin Email' }, adminToken);
  assert('Crear usuario sin email → 400', missing.status === 400);

  // Limpiar usuario de prueba
  await req('DELETE', `/auth/login`, null, null); // no existe, solo limpiar token

  return testEmail;
}

async function testRecursos(testEmail) {
  console.log('\n📦 Recursos');

  // Listar recursos (requiere auth)
  const list = await req('GET', '/recursos', null, adminToken);
  assert('GET /recursos con auth → 200', list.status === 200);
  assert('GET /recursos devuelve array', Array.isArray(list.data));

  // Sin auth
  const noAuth = await req('GET', '/recursos');
  assert('GET /recursos sin token → 401', noAuth.status === 401);

  // Crear recurso
  const nombre = `Test_${Date.now()}`;
  const created = await req('POST', '/recursos', { nombre, tipo: 'Laptop', descripcion: 'Test' }, adminToken);
  assert('POST /recursos → 201', created.status === 201);
  assert('Recurso creado tiene nombre correcto', created.data?.nombre === nombre);
  const recursoId = created.data?.id;

  // Crear sin nombre
  const noName = await req('POST', '/recursos', { tipo: 'Proyector' }, adminToken);
  assert('POST /recursos sin nombre → 400', noName.status === 400);

  // Eliminar recurso sin reservas → debe funcionar
  if (recursoId) {
    const del = await req('DELETE', `/recursos/${recursoId}`, null, adminToken);
    assert('DELETE recurso sin reservas → 200', del.status === 200);
  }

  return recursoId;
}

async function testRecursoConReservas() {
  console.log('\n🚫 Seguridad — Borrado de recurso con reservas activas');

  // Buscar un recurso que tenga reservas activas en la DB
  // Primero creamos un recurso fresco
  const nombre = `RecTest_${Date.now()}`;
  const rec = await req('POST', '/recursos', { nombre, tipo: 'Proyector' }, adminToken);
  if (rec.status !== 201) { assert('Setup: crear recurso para test', false, 'no se pudo crear'); return; }
  const rid = rec.data.id;

  // Crear una reserva para ese recurso (usando maestroToken)
  const ahora = new Date();
  const inicio = new Date(ahora.getTime() + 60 * 60 * 1000); // +1h
  const fin    = new Date(ahora.getTime() + 2 * 60 * 60 * 1000); // +2h
  const reserva = await req('POST', '/reservas', {
    recurso_id: rid,
    fecha_inicio: inicio.toISOString(),
    fecha_fin: fin.toISOString(),
    notas: 'test',
  }, maestroToken);
  assert('Setup: crear reserva activa para el recurso', reserva.status === 201,
    `status=${reserva.status} data=${JSON.stringify(reserva.data)}`);

  // Intentar borrar el recurso → debe fallar con 409
  const del = await req('DELETE', `/recursos/${rid}`, null, adminToken);
  assert('DELETE recurso con reserva activa → 409', del.status === 409,
    `status=${del.status}`);
  assert('Mensaje de error descriptivo', del.data?.error?.includes('reservas activas'),
    `error=${del.data?.error}`);
}

async function testReservas() {
  console.log('\n📅 Reservas');

  // Listar reservas del maestro
  const list = await req('GET', '/reservas', null, maestroToken);
  assert('GET /reservas con auth maestro → 200', list.status === 200);
  assert('GET /reservas devuelve array', Array.isArray(list.data));

  // Verificar disponibilidad
  const recursos = await req('GET', '/recursos', null, adminToken);
  if (Array.isArray(recursos.data) && recursos.data.length > 0) {
    const rid = recursos.data[0].id;
    const inicio = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // +10 días
    const fin    = new Date(inicio.getTime() + 60 * 60 * 1000);
    const disp = await req('GET',
      `/reservas/disponibilidad?recurso_id=${rid}&fecha_inicio=${inicio.toISOString()}&fecha_fin=${fin.toISOString()}`,
      null, maestroToken);
    assert('GET /reservas/disponibilidad → 200', disp.status === 200);
    assert('Respuesta tiene campo disponible (boolean)', typeof disp.data?.disponible === 'boolean');
  }

  // Sin auth
  const noAuth = await req('GET', '/reservas');
  assert('GET /reservas sin token → 401', noAuth.status === 401);
}

async function testAccesoRoles() {
  console.log('\n🔒 Control de acceso por rol');

  // Maestro no puede acceder a rutas de admin
  const rec = await req('DELETE', '/recursos/999', null, maestroToken);
  assert('Maestro no puede borrar recursos (403)', rec.status === 403,
    `status=${rec.status}`);

  const usr = await req('GET', '/usuarios', null, maestroToken);
  assert('Maestro no puede listar usuarios (403)', usr.status === 403,
    `status=${usr.status}`);

  // Admin puede listar usuarios
  const adminUsr = await req('GET', '/usuarios', null, adminToken);
  assert('Admin puede listar usuarios → 200', adminUsr.status === 200);
}

/* ─── runner ──────────────────────────────────────────────────────────────── */
async function run() {
  console.log('🧪 Reserva EPO — Tests de integración');
  console.log(`   Backend: ${BASE}\n`);

  try {
    await testHealth();
    await testAuth();
    const testEmail = await testUsuarioSeguridad();
    await testRecursos(testEmail);
    await testRecursoConReservas();
    await testReservas();
    await testAccesoRoles();
  } catch (err) {
    console.error('\n💥 Error inesperado:', err.message);
    failed++;
  }

  const total = passed + failed;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Resultado: ${passed}/${total} tests pasaron`);
  if (failed > 0) {
    console.log(`           ${failed} fallaron`);
    process.exit(1);
  } else {
    console.log('           ¡Todos pasaron! 🎉');
  }
}

run();
