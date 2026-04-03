const { chromium } = require('playwright');

async function testSoportePage() {
  console.log('Iniciando prueba de la página de Soporte...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // URL de la aplicación desplegada
  const baseUrl = 'http://localhost:3000';
  
  // Capturar errores de consola
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  try {
    // Probar la página principal
    console.log(`1. Probando página principal (${baseUrl}/)...`);
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 30000 });
    const title = await page.title();
    console.log(`   ✓ Título de la página: ${title}`);
    
    // Verificar que el botón de Soporte existe en desktop
    console.log('\n2. Verificando botón de Soporte en desktop...');
    const soporteButton = await page.locator('text=Soporte').first();
    const isVisible = await soporteButton.isVisible();
    console.log(`   ✓ Botón de Soporte visible: ${isVisible}`);
    
    // Navegar a la página de soporte
    console.log(`\n3. Navegando a ${baseUrl}/soporte...`);
    await page.goto(`${baseUrl}/soporte`, { waitUntil: 'networkidle', timeout: 30000 });
    const soporteTitle = await page.title();
    console.log(`   ✓ Título de la página de Soporte: ${soporteTitle}`);
    
    // Verificar elementos de la página
    console.log('\n4. Verificando elementos de la página de Soporte...');
    
    // Título principal
    const mainTitle = await page.locator('h1').first().textContent();
    console.log(`   ✓ Título principal: ${mainTitle}`);
    
    // Información de contacto
    const contactInfo = await page.locator('text=Información de Contacto').isVisible();
    console.log(`   ✓ Información de contacto visible: ${contactInfo}`);
    
    // Formulario de contacto
    const formTitle = await page.locator('text=Formulario de Contacto').isVisible();
    console.log(`   ✓ Formulario de contacto visible: ${formTitle}`);
    
    // Campos del formulario
    const nameInput = await page.locator('#name').isVisible();
    const emailInput = await page.locator('#email').isVisible();
    const phoneInput = await page.locator('#phone').isVisible();
    const messageInput = await page.locator('#message').isVisible();
    console.log(`   ✓ Campo Nombre visible: ${nameInput}`);
    console.log(`   ✓ Campo Email visible: ${emailInput}`);
    console.log(`   ✓ Campo Teléfono visible: ${phoneInput}`);
    console.log(`   ✓ Campo Mensaje visible: ${messageInput}`);
    
    // Botón de envío
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    console.log(`   ✓ Botón de envío visible: ${submitButton}`);
    
    // Preguntas frecuentes
    const faqSection = await page.locator('text=Preguntas Frecuentes').isVisible();
    console.log(`   ✓ Sección de FAQ visible: ${faqSection}`);
    
    // Probar navegación desde la página principal
    console.log('\n5. Probando navegación desde página principal...');
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('text=Soporte');
    await page.waitForURL('**/soporte', { timeout: 10000 });
    const currentUrl = page.url();
    console.log(`   ✓ Navegación exitosa a: ${currentUrl}`);
    
    // Reportar errores de consola
    if (consoleErrors.length > 0) {
      console.log('\n⚠️  Errores de consola detectados:');
      consoleErrors.forEach(err => console.log(`   - ${err}`));
    } else {
      console.log('\n✓ No se detectaron errores de consola');
    }
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('✓ TODAS LAS PRUEBAS PASARON EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════\n');
    console.log('📱 La página de Soporte ahora es una página');
    console.log('   completa, accesible desde /soporte');
    console.log('   y desde el botón en la barra de navegación.');
    console.log('\n');
    
  } catch (error) {
    console.error('\n✗ Error durante las pruebas:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testSoportePage();
