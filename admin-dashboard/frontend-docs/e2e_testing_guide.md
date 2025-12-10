# E2E Testing Best Practices Guide

**Purpose**: Documentar estrategias y patrones para escribir tests E2E confiables y evitar errores comunes.

## Principios Fundamentales

### 0. Variables de Entorno y Seguridad
**NUNCA** hardcodear credenciales en el código de los tests.
- Usar `.env` localmente (`.env.example` como plantilla).
- Acceder mediante `process.env.ADMIN_SECRET_KEY`.
- Los tests fallarán si estas variables no están configuradas en el entorno local.

### 1. Especificidad en Selectores

Los selectores deben ser lo más específicos posible para evitar ambigüedades.

#### Jerarquía de Selectores (del mejor al peor)

```typescript
// ✅ MEJOR: getByRole - Semántico y accesible
await page.getByRole('heading', { name: 'New Booking' })
await page.getByRole('button', { name: 'Save' })
await page.getByRole('textbox', { name: 'Email' })

// ✅ BUENO: getByTestId - Explícito y estable
await page.getByTestId('booking-type-chip')
await page.getByTestId('submit-booking-button')

// ⚠️ ACEPTABLE: getByLabel - Para inputs con labels
await page.getByLabel('Customer Name')

// ⚠️ SOLO SI ES NECESARIO: getByText - Puede ser ambiguo
await page.getByText('Exact text match')

// ❌ EVITAR: CSS selectors genéricos
await page.locator('.btn-primary') // Frágil
await page.locator('div > span') // No semántico
```

#### Problema Común: Strict Mode Violations

```typescript
// ❌ PROBLEMA: Múltiples elementos con el mismo texto
await page.getByText('New Booking') // Button + Modal Heading = 2 matches
// Error: strict mode violation: locator resolved to 2 elements

// ✅ SOLUCIÓN: Usar rol específico
await page.getByRole('heading', { name: 'New Booking' }) // Solo heading
```

---

### 2. Estrategias de Espera (Waiting)

Nunca uses `waitForTimeout` a menos que sea absolutamente necesario.

#### Esperas Recomendadas

```typescript
// ✅ MEJOR: Esperar elemento visible
await expect(page.getByRole('heading', { name: 'Modal Title' })).toBeVisible();

// ✅ BUENO: Esperar selector con timeout custom
await page.waitForSelector('[data-testid="element"]', { timeout: 10000 });

// ✅ BUENO: Esperar condición específica (datos cargados)
await page.waitForFunction(() => {
  const select = document.querySelector('[data-testid="select-tour"]');
  return select && select.options.length > 1;
}, { timeout: 10000 });

// ✅ BUENO: Esperar navegación
await page.waitForURL('/bookings');

// ⚠️ ÚLTIMO RECURSO: Timeout fijo (solo para animaciones conocidas)
await page.waitForTimeout(500); // Solo si sabes exactamente cuánto tarda
```

#### Anti-Pattern: Timeouts Arbitrarios

```typescript
// ❌ MAL: No sabes si 2000ms es suficiente
await page.click('[data-testid="button"]');
await page.waitForTimeout(2000);
await expect(page.getByText('Success')).toBeVisible();

// ✅ BIEN: Esperar condición específica
await page.click('[data-testid="button"]');
await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
```

---

### 3. Testing de Modales

Los modales requieren patrones específicos debido a su naturaleza dinámica.

#### Patrón Modal Completo

```typescript
test('should interact with modal', async ({ page }) => {
  // 1. Abrir modal
  await page.getByTestId('open-modal-button').click();
  
  // 2. Esperar que modal esté visible (heading es buen indicador)
  await expect(page.getByRole('heading', { name: 'Modal Title' })).toBeVisible();
  
  // 3. Verificar elementos del modal
  await expect(page.getByTestId('modal-content')).toBeVisible();
  
  // 4. Interactuar con el modal
  await page.getByTestId('input-field').fill('Value');
  await page.getByRole('button', { name: 'Submit' }).click();
  
  // 5. Verificar resultado (toast, etc)
  await expect(page.getByText('Success message')).toBeVisible({ timeout: 5000 });
  
  // 6. Verificar que modal se cerró
  await expect(page.getByRole('heading', { name: 'Modal Title' })).not.toBeVisible();
});
```

#### Manejo de Estados Condicionales en Modales

```typescript
// Caso: Chip de tipo puede no aparecer si no hay departure
try {
  await page.waitForSelector('[data-testid="booking-type-chip"]', { timeout: 5000 });
  // Chip existe, continuar con verificaciones
  const chip = page.getByTestId('booking-type-chip');
  await expect(chip).toBeVisible();
} catch (e) {
  // Chip no apareció, verificar estado alternativo
  const noDeparture = await page.getByText('No Departure').isVisible();
  if (noDeparture) {
    // Estado esperado si booking no tiene departure
    console.log('Booking has no departure - expected state');
  } else {
    // Algo salió mal, re-throw error
    throw new Error('Booking type chip not found and no "No Departure" indicator');
  }
}
```

---

### 4. Manejo de Datos de Prueba

#### Usar Timestamps para Unicidad

```typescript
test('should create booking', async ({ page }) => {
  const timestamp = Date.now();
  
  // Datos únicos para evitar conflictos
  const customerName = `Test User ${timestamp}`;
  const email = `test${timestamp}@example.com`;
  
  await page.getByTestId('input-name').fill(customerName);
  await page.getByTestId('input-email').fill(email);
  
  // Después: buscar por nombre único
  await page.getByTestId('search-input').fill(customerName);
  await expect(page.getByText(customerName)).toBeVisible();
});
```

#### Asegurar Prerequisites

```typescript
test.beforeEach(async ({ page }) => {
  // Asegurar que existe al menos un tour antes de crear booking
  await page.goto('/tours');
  await page.waitForTimeout(1000);
  
  const tourCount = await page.locator('[data-testid^="tour-card-"]').count();
  
  if (tourCount === 0) {
    // Crear tour de prueba
    await page.getByTestId('new-tour-button').click();
    await page.getByTestId('input-name-es').fill('Test Tour');
    await page.getByTestId('input-price').fill('100000');
    await page.getByTestId('submit-button').click();
    await expect(page.getByRole('heading', { name: 'New Tour' })).not.toBeVisible();
  }
});
```

---

### 5. Debugging de Tests Difíciles

Cuando un test falla y no sabes por qué:

#### File-Based Logging

```typescript
import * as fs from 'fs';

const LOG_FILE = 'test_debug.txt';

test.beforeAll(() => {
  fs.writeFileSync(LOG_FILE, '--- TEST STARTED ---\n');
});

function log(message: string) {
  try {
    fs.appendFileSync(LOG_FILE, `${message}\n`);
    console.log(message); // También a console
  } catch (e) {
    // Ignore file errors
  }
}

test('debug failing test', async ({ page }) => {
  log('Step 1: Opening modal');
  await page.getByTestId('button').click();
  
  log('Step 2: Waiting for modal');
  try {
    await expect(page.getByRole('heading', { name: 'Modal' })).toBeVisible();
    log('Modal opened successfully');
  } catch (e) {
    log(`Modal failed to open: ${e.message}`);
    
    // Capturar estado actual
    const modalText = await page.locator('[role="dialog"]').innerText().catch(() => 'No dialog found');
    log(`Modal content: ${modalText}`);
    
    // Screenshot
    await page.screenshot({ path: 'debug_screenshot.png' });
    log('Screenshot saved to debug_screenshot.png');
    
    throw e;
  }
});
```

#### Captura de Screenshots

```typescript
test('test with screenshot on failure', async ({ page }) => {
  try {
    await page.getByTestId('button').click();
    await expect(page.getByText('Expected')).toBeVisible();
  } catch (e) {
    // Capturar screenshot antes de fallar
    await page.screenshot({ 
      path: `failure-${Date.now()}.png`,
      fullPage: true 
    });
    throw e;
  }
});
```

---

### 6. Estructura de Tests

#### Patrón AAA (Arrange, Act, Assert)

```typescript
test('should update booking status', async ({ page }) => {
  // ARRANGE: Setup inicial
  await page.goto('/bookings');
  await page.locator('table tbody tr').first().click();
  await expect(page.getByRole('heading', { name: 'Manage Booking' })).toBeVisible();
  await page.getByTestId('tab-status').click();
  
  // ACT: Acción a probar
  await page.getByTestId('status-select').selectOption('confirmed');
  
  // ASSERT: Verificaciones
  await expect(page.getByText('Status updated')).toBeVisible();
  const currentStatus = await page.getByTestId('status-select').inputValue();
  expect(currentStatus).toBe('confirmed');
});
```

#### Uso de `beforeEach` vs `beforeAll`

```typescript
// beforeAll: Setup una vez para todos los tests (login, etc)
test.beforeAll(async ({ page }) => {
  // Solo si el estado persiste entre tests
});

// beforeEach: Setup para cada test individual (mejor aislamiento)
test.beforeEach(async ({ page }) => {
  // Login fresh para cada test
  await page.goto('/login');
  await page.getByTestId('login-input').fill(ADMIN_KEY);
  await page.getByTestId('login-button').click();
  await page.waitForURL('/');
});
```

---

### 7. Manejo de Errores y Try/Catch

#### Cuándo Usar Try/Catch

```typescript
// ❌ NO NECESARIO: Playwright ya maneja el error
test('test', async ({ page }) => {
  try {
    await expect(page.getByText('Text')).toBeVisible();
  } catch (e) {
    throw e; // Redundante
  }
});

// ✅ USAR: Para cleanup o logging específico
test('test', async ({ page }) => {
  try {
    await page.getByTestId('button').click();
    await expect(page.getByText('Success')).toBeVisible();
  } catch (e) {
    // Log estado para debugging
    const content = await page.content();
    console.error('Page content:', content);
    
    // Screenshot
    await page.screenshot({ path: 'error.png' });
    
    // Re-throw con contexto adicional
    throw new Error(`Test failed at step X: ${e.message}`);
  }
});

// ✅ USAR: Para estados condicionales esperados
test('test', async ({ page }) => {
  const hasElement = await page.getByTestId('optional-element')
    .isVisible()
    .catch(() => false); // No es error si no existe
  
  if (hasElement) {
    // Verificaciones específicas
  } else {
    // Comportamiento alternativo
  }
});
```

---

### 8. Timeouts y Configuración

#### Test-Level Timeout

```typescript
test('slow test', async ({ page }) => {
  // Este test necesita más tiempo
  test.setTimeout(120000); // 2 minutos
  
  // Operaciones lentas
  await performLongOperation();
});
```

#### Assertion-Level Timeout

```typescript
// Diferentes elementos pueden necesitar diferentes timeouts
await expect(page.getByText('Quick')).toBeVisible({ timeout: 5000 });
await expect(page.getByText('Slow API result')).toBeVisible({ timeout: 15000 });
```

---

## Patrones Específicos por Feature

### Bookings

```typescript
// Abrir booking modal
await page.locator('table tbody tr').first().click();
await expect(page.getByRole('heading', { name: /Manage Booking|New Booking/ })).toBeVisible();

// Verificar chip de tipo (condicional)
const chip = page.getByTestId('booking-type-chip');
const chipVisible = await chip.isVisible().catch(() => false);
if (chipVisible) {
  const chipText = await chip.textContent();
  expect(['Public', 'Private']).toContain(chipText);
}

// Cambiar tabs
await page.getByTestId('tab-status').click();
await page.waitForTimeout(500); // Tab transition animation

// Actualizar status
await page.getByTestId('status-select').selectOption('confirmed');
await expect(page.getByText(/updated|success/i)).toBeVisible({ timeout: 5000 });
```

### Modals con Formularios

```typescript
// Llenar formulario nuevo booking
await page.getByTestId('select-tour').selectOption({ index: 1 });

// Esperar que options se carguen primero
await page.waitForFunction(() => {
  const select = document.querySelector('[data-testid="select-tour"]');
  return select && select.options.length > 1;
});

// Date input
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
await page.getByTestId('input-date').fill(tomorrow.toISOString().split('T')[0]);

// Submit
await page.getByTestId('submit-button').click();

// Verificar success
await expect(page.getByText('created successfully')).toBeVisible({ timeout: 10000 });
```

---

## Checklist de Revisión para Nuevos Tests

Antes de hacer commit de un nuevo test, verificar:

- [ ] **Selectores**: ¿UsastegetByRole` cuando fue posible?
- [ ] **Esperas**: ¿Evitaste `waitForTimeout` arbitrarios?
- [ ] **Unicidad**: ¿Datos de prueba son únicos (timestamps)?
- [ ] **Limpieza**: ¿El test limpia su estado (o usa datos únicos)?
- [ ] **Aislamiento**: ¿El test puede correr solo sin depender de orden?
- [ ] **Mensajes error**: ¿Errores son descriptivos sobre qué falló?
- [ ] **Timeouts**: ¿Timeouts son razonables (5-15s para elementos lentos)?
- [ ] **Verificaciones**: ¿Verificas el estado esperado, no solo ausencia de error?

---

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `strict mode violation` | Selector ambiguo | Usar `getByRole` o `getByTestId` más específico |
| `Timeout waiting for locator` | Elemento no aparece | Verificar selector, aumentar timeout, revisar estado de datos |
| `Element is not visible` | Elemento hidden/loading | Esperar visibilidad explícita con `expect().toBeVisible()` |
| `Cannot read property of null` | Elemento no encontrado | Usar optional chaining `?.` o verificar existe primero |

---

**Última actualización**: 2025-11-23  
**Mantener este documento actualizado** con nuevos patrones descubiertos durante desarrollo de tests.
