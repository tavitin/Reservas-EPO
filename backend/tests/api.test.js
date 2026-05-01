/**
 * Tests de integración — Reserva EPO Backend
 * Ejecutar: npm test  (requiere backend + DB corriendo en localhost:4000)
 */

const BASE = 'http://localhost:4000/api';
let passed = 0, failed = 0;
let adminToken = '', maestroToken = '';
let maestroId = null, recursoTestId = null, reservaTestId = null;

/* ─── helpers ─────────────────────────────────────────────────────────────── */
async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
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
  assert('GET /health → 200', status === 200 && data?.status === 'ok');
}

async function testAuth() {
  console.log('\n🔐 Autenticación');

  const bad = await req('POST', '/auth/login', { email: 'no@existe.mx', password: 'wrong' });
  assert('Login credenciales inválidas → 401', bad.status === 401);

  const empty = await req('POST', '/auth/login', {});
  assert('Login sin body → 400', empty.status === 400);

  const ok = await req('POST', '/auth/login', { email: 'admin@epo.edu.mx', password: 'Admin2024!' });
  assert('Login admin válido → 200 con token', ok.status === 200 && !!ok.data?.token);
  adminToken = ok.data?.token ?? '';
  assert('Token de admin tiene rol=admin', ok.data?.user?.rol === 'admin');

  const noToken = await req('GET', '/auth/me');
  assert('GET /auth/me sin token → 401', noToken.status === 401);

  const me = await req('GET', '/auth/me', undefined, adminToken);
  assert('GET /auth/me con token → 200', me.status === 200 && me.data?.email === 'admin@epo.edu.mx');
}

async function testUsuarios() {
  console.log('\n👤 Usuarios');

  // Sin auth → 401
  const noAuth = await req('GET', '/usuarios');
  assert('GET /usuarios sin token → 401', noAuth.status === 401);

  // Admin lista usuarios
  const list = await req('GET', '/usuarios', undefined, adminToken);
  assert('GET /usuarios con admin → 200', list.status === 200 && Array.isArray(list.data));

  // Crear maestro normal
  const email = `maestro_test_${Date.now()}@epo.mx`;
  const created = await req('POST', '/usuarios', {
    nombre: 'Maestro Test', email, password: 'Test12345', rol: 'maestro',
  }, adminToken);
  assert('Crear maestro → 201', created.status === 201);
  assert('Rol es maestro', created.data?.rol === 'maestro');
  maestroId = created.data?.id;

  // Login con maestro creado
  const login = await req('POST', '/auth/login', { email, password: 'Test12345' });
  assert('Login maestro nuevo → 200', login.status === 200 && !!login.data?.token);
  maestroToken = login.data?.token ?? '';

  // Crear admin (admin puede crear otro admin)
  const emailAdmin = `admin_test_${Date.now()}@epo.mx`;
  const createdAdmin = await req('POST', '/usuarios', {
    nombre: 'Admin Test', email: emailAdmin, password: 'Admin12345', rol: 'admin',
  }, adminToken);
  assert('Admin puede crear otro admin → 201', createdAdmin.status === 201);
  assert('Rol del nuevo admin es admin', createdAdmin.data?.rol === 'admin');
  const nuevoAdminId = createdAdmin.data?.id;

  // Validaciones de campos
  const noEmail = await req('POST', '/usuarios', { nombre: 'Sin Email', password: 'Pass1234' }, adminToken);
  assert('Crear usuario sin email → 400', noEmail.status === 400);

  const shortPass = await req('POST', '/usuarios', {
    nombre: 'Pass Corta', email: `short_${Date.now()}@epo.mx`, password: '123',
  }, adminToken);
  assert('Password < 8 chars → 400', shortPass.status === 400);

  const duplicate = await req('POST', '/usuarios', {
    nombre: 'Dup', email, password: 'Test12345',
  }, adminToken);
  assert('Email duplicado → 400', duplicate.status === 400);

  // Maestro no puede crear usuarios
  const maestroCreate = await req('POST', '/usuarios', {
    nombre: 'No debería', email: `nd_${Date.now()}@epo.mx`, password: 'Pass1234',
  }, maestroToken);
  assert('Maestro no puede crear usuarios → 403', maestroCreate.status === 403);

  // Protección IDOR: admin no puede desactivar a otro admin
  if (nuevoAdminId) {
    const toggleAdmin = await req('PUT', `/usuarios/${nuevoAdminId}/toggle`, undefined, adminToken);
    assert('Admin no puede desactivar otro admin → 403', toggleAdmin.status === 403,
      `status=${toggleAdmin.status}`);

    const resetAdmin = await req('PUT', `/usuarios/${nuevoAdminId}/reset-password`,
      { password_nuevo: 'NuevoPass123' }, adminToken);
    assert('Admin no puede resetear password de otro admin → 403', resetAdmin.status === 403,
      `status=${resetAdmin.status}`);
  }

  // Admin no puede desactivarse a sí mismo
  const me = await req('GET', '/auth/me', undefined, adminToken);
  if (me.data?.id) {
    const selfToggle = await req('PUT', `/usuarios/${me.data.id}/toggle`, undefined, adminToken);
    assert('Admin no puede desactivarse a sí mismo → 400', selfToggle.status === 400);
  }

  // Reset password de maestro (sí permitido)
  if (maestroId) {
    const reset = await req('PUT', `/usuarios/${maestroId}/reset-password`,
      { password_nuevo: 'NuevoPass123' }, adminToken);
    assert('Admin puede resetear password de maestro → 200', reset.status === 200);
  }
}

async function testRecursos() {
  console.log('\n📦 Recursos');

  const noAuth = await req('GET', '/recursos');
  assert('GET /recursos sin token → 401', noAuth.status === 401);

  const list = await req('GET', '/recursos', undefined, adminToken);
  assert('GET /recursos con auth → 200', list.status === 200 && Array.isArray(list.data));

  // Maestro puede listar pero no crear
  const maestroList = await req('GET', '/recursos', undefined, maestroToken);
  assert('Maestro puede listar recursos → 200', maestroList.status === 200);

  const maestroCreate = await req('POST', '/recursos', { nombre: 'No', tipo: 'Laptop' }, maestroToken);
  assert('Maestro no puede crear recursos → 403', maestroCreate.status === 403);

  // Crear recurso
  const nombre = `Recurso_Test_${Date.now()}`;
  const created = await req('POST', '/recursos', { nombre, tipo: 'Laptop', descripcion: 'Test' }, adminToken);
  assert('POST /recursos → 201', created.status === 201);
  assert('Nombre correcto', created.data?.nombre === nombre);
  recursoTestId = created.data?.id;

  // Validaciones
  const noName = await req('POST', '/recursos', { tipo: 'Proyector' }, adminToken);
  assert('Crear recurso sin nombre → 400', noName.status === 400);

  // Update sin campos → 400
  if (recursoTestId) {
    const badUpdate = await req('PUT', `/recursos/${recursoTestId}`, { descripcion: 'solo esto' }, adminToken);
    assert('Update recurso sin nombre/tipo → 400', badUpdate.status === 400);
  }
}

async function testReservas() {
  console.log('\n📅 Reservas');

  if (!recursoTestId) { console.log('  ⚠️  Sin recurso de prueba, saltando'); return; }

  const noAuth = await req('GET', '/reservas');
  assert('GET /reservas sin token → 401', noAuth.status === 401);

  // Disponibilidad
  const ahora  = new Date();
  const inicio = new Date(ahora.getTime() + 10 * 24 * 60 * 60 * 1000);
  const fin    = new Date(inicio.getTime() + 60 * 60 * 1000);
  const disp   = await req('GET',
    `/reservas/disponibilidad?recurso_id=${recursoTestId}&fecha_inicio=${inicio.toISOString()}&fecha_fin=${fin.toISOString()}`,
    undefined, maestroToken);
  assert('GET /reservas/disponibilidad → 200', disp.status === 200);
  assert('Campo disponible es boolean', typeof disp.data?.disponible === 'boolean');
  assert('Recurso nuevo está disponible', disp.data?.disponible === true);

  // Crear reserva (maestro)
  const reserva = await req('POST', '/reservas', {
    recurso_id: recursoTestId,
    fecha_inicio: inicio.toISOString(),
    fecha_fin: fin.toISOString(),
    notas: 'reserva de prueba',
  }, maestroToken);
  assert('POST /reservas → 201', reserva.status === 201);
  reservaTestId = reserva.data?.id;

  // Conflicto de horario
  const conflicto = await req('POST', '/reservas', {
    recurso_id: recursoTestId,
    fecha_inicio: inicio.toISOString(),
    fecha_fin: fin.toISOString(),
  }, maestroToken);
  assert('Reserva en horario ocupado → 409', conflicto.status === 409);

  // Disponibilidad ahora debe ser false
  const disp2 = await req('GET',
    `/reservas/disponibilidad?recurso_id=${recursoTestId}&fecha_inicio=${inicio.toISOString()}&fecha_fin=${fin.toISOString()}`,
    undefined, maestroToken);
  assert('Recurso ya no disponible → disponible=false', disp2.data?.disponible === false);

  // Admin ve todas las reservas
  const adminList = await req('GET', '/reservas', undefined, adminToken);
  assert('Admin GET /reservas → 200', adminList.status === 200 && Array.isArray(adminList.data));

  // Admin ve solo las suyas con ?own=true
  const ownList = await req('GET', '/reservas?own=true', undefined, adminToken);
  assert('Admin GET /reservas?own=true → 200', ownList.status === 200 && Array.isArray(ownList.data));

  // Cancelar reserva pasada (no permitido si ya terminó — pero esta es futura)
  // El cancel requiere fecha_fin > NOW(), esta reserva es en 10 días → debe funcionar
  if (reservaTestId) {
    const cancel = await req('PUT', `/reservas/${reservaTestId}/cancelar`, undefined, maestroToken);
    assert('Cancelar reserva futura → 200', cancel.status === 200,
      `status=${cancel.status} data=${JSON.stringify(cancel.data)}`);
  }
}

async function testEntrega() {
  console.log('\n✍️  Recepción/Entrega con firma');

  if (!recursoTestId) { console.log('  ⚠️  Sin recurso de prueba, saltando'); return; }

  // Crear una nueva reserva para el test de entrega
  const inicio = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
  const fin    = new Date(inicio.getTime() + 60 * 60 * 1000);
  const reserva = await req('POST', '/reservas', {
    recurso_id: recursoTestId,
    fecha_inicio: inicio.toISOString(),
    fecha_fin: fin.toISOString(),
    notas: 'test entrega',
  }, maestroToken);
  assert('Setup: crear reserva para entrega → 201', reserva.status === 201,
    `status=${reserva.status}`);
  const rid = reserva.data?.id;

  // Entregar sin firma → 400
  const noFirma = await req('PUT', `/reservas/${rid}/entregar`, {}, adminToken);
  assert('Entregar sin firma → 400', noFirma.status === 400);

  // Maestro no puede registrar entrega → 403
  const maestroEntrega = await req('PUT', `/reservas/${rid}/entregar`,
    { firma_base64: 'data:image/png;base64,abc' }, maestroToken);
  assert('Maestro no puede registrar entrega → 403', maestroEntrega.status === 403);

  // Admin registra entrega con firma → 200
  const fakeSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const entrega = await req('PUT', `/reservas/${rid}/entregar`, {
    firma_base64: fakeSignature,
    comentario_entrega: 'Artículo devuelto en buen estado',
  }, adminToken);
  assert('Admin registra entrega con firma → 200', entrega.status === 200,
    `status=${entrega.status} data=${JSON.stringify(entrega.data)}`);
  assert('Estado cambia a completada', entrega.data?.estado === 'completada');
  assert('Tiene fecha_entrega', !!entrega.data?.fecha_entrega);

  // No se puede volver a entregar
  const reentrega = await req('PUT', `/reservas/${rid}/entregar`,
    { firma_base64: fakeSignature }, adminToken);
  assert('Entregar reserva ya completada → 400', reentrega.status === 400);

  // Verificar que aparece en la lista del admin con campos de entrega
  const list = await req('GET', '/reservas', undefined, adminToken);
  const completada = list.data?.find(r => r.id === rid);
  assert('Reserva completada aparece en listado', !!completada);
  assert('Reserva completada tiene estado=completada', completada?.estado === 'completada');
  assert('Reserva completada tiene comentario', completada?.comentario_entrega === 'Artículo devuelto en buen estado');
}

async function testBorradoRecursoConReservas() {
  console.log('\n🚫 Borrado de recurso con reservas activas');

  const rec = await req('POST', '/recursos', { nombre: `RecDel_${Date.now()}`, tipo: 'Proyector' }, adminToken);
  if (rec.status !== 201) { assert('Setup recurso', false); return; }
  const rid = rec.data.id;

  const inicio = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const fin    = new Date(inicio.getTime() + 60 * 60 * 1000);
  await req('POST', '/reservas', { recurso_id: rid, fecha_inicio: inicio.toISOString(), fecha_fin: fin.toISOString() }, maestroToken);

  const del = await req('DELETE', `/recursos/${rid}`, undefined, adminToken);
  assert('DELETE recurso con reservas activas → 409', del.status === 409);
  assert('Mensaje descriptivo', del.data?.error?.includes('reservas activas'));

  // Limpiar el recurso de test si no tiene reservas activas (solo esta de 30 días)
  // Lo dejamos así
}

async function testRateLimiting() {
  console.log('\n🚦 Rate limiting');

  // El limiter de login permite 10 intentos en 15min
  // Hacemos 2 seguidos para verificar que no bloquea antes de tiempo
  const r1 = await req('POST', '/auth/login', { email: 'no@existe.mx', password: 'bad' });
  const r2 = await req('POST', '/auth/login', { email: 'no@existe.mx', password: 'bad' });
  assert('Rate limit no bloquea antes de 10 intentos', r1.status === 401 && r2.status === 401);
}

/* ─── cleanup ─────────────────────────────────────────────────────────────── */
async function cleanup() {
  // Desactivar maestro de prueba si fue creado
  if (maestroId && adminToken) {
    await req('PUT', `/usuarios/${maestroId}/toggle`, undefined, adminToken);
  }
  // Eliminar recurso de prueba si no tiene reservas activas (podría tener)
  // No forzamos el borrado para no romper estado
}

/* ─── runner ──────────────────────────────────────────────────────────────── */
async function run() {
  console.log('🧪 Reserva EPO — Tests de integración');
  console.log(`   Backend: ${BASE}`);
  console.log(`   Fecha:   ${new Date().toLocaleString('es-MX')}\n`);

  try {
    await testHealth();
    await testAuth();
    await testUsuarios();
    await testRecursos();
    await testReservas();
    await testEntrega();
    await testBorradoRecursoConReservas();
    await testRateLimiting();
  } catch (err) {
    console.error('\n💥 Error inesperado en el runner:', err.message);
    failed++;
  } finally {
    await cleanup();
  }

  const total = passed + failed;
  console.log(`\n${'─'.repeat(52)}`);
  console.log(`📊 Resultado: ${passed}/${total} tests pasaron`);
  if (failed > 0) {
    console.log(`             ${failed} fallaron ❌`);
    process.exit(1);
  } else {
    console.log('             ¡Todos pasaron! 🎉');
    process.exit(0);
  }
}

run();
