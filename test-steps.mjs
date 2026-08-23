import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
});
const page = await context.newPage();

const consoleLogs = [];
page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => consoleLogs.push(`[ERROR] ${err.message}`));

const URL = process.env.VITE_CLINIC_URL || 'http://localhost:3000/cliente';

console.log('=== Navigating to ' + URL + ' ===');
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(3000);

// --- STEP 1 ---
console.log('\n=== STEP 1 — Dados do paciente ===');
await page.screenshot({ path: '/tmp/opencode/step1-375.png', fullPage: true });
console.log('Screenshot: step1-375.png');

// Fill Step 1 fields
await page.fill('input[placeholder="Ex: Roberto Carlos"]', 'Maria Silva');
await page.fill('input[placeholder="(11) 98888-7777"]', '11999887766');
await page.fill('input[placeholder="DD/MM/AAAA"]', '15061990');
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/opencode/step1-filled-375.png', fullPage: true });
console.log('Screenshot: step1-filled-375.png');

// Click Continuar
await page.click('button:has-text("Continuar")');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/opencode/step2-375.png', fullPage: true });
console.log('Screenshot: step2-375.png');

// --- STEP 2 ---
console.log('\n=== STEP 2 — Procedimentos ===');

// Check if procedure cards loaded (they should have h3 titles)
const procNames = await page.locator('.rounded-xl h3').allTextContents();
console.log('Procedure names: ' + JSON.stringify(procNames));

// Check prices
const procPrices = await page.locator('.rounded-xl .font-extrabold').allTextContents();
console.log('Procedure prices: ' + JSON.stringify(procPrices));

// Click first procedure card
const firstCard = page.locator('.rounded-xl.cursor-pointer').first();
if (await firstCard.count() > 0) {
  await firstCard.click();
  await page.waitForTimeout(300);
  console.log('Clicked first procedure card');
  await page.screenshot({ path: '/tmp/opencode/step2-selected-375.png', fullPage: true });
  console.log('Screenshot: step2-selected-375.png');
}

// Click Continuar to Step 3
await page.click('button:has-text("Continuar")');
await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/opencode/step3-375.png', fullPage: true });
console.log('Screenshot: step3-375.png');

// --- STEP 3 ---
console.log('\n=== STEP 3 — Data e Horário ===');

// Check calendar is visible
const calText = await page.locator('.font-serif').allTextContents();
console.log('Calendar text elements: ' + JSON.stringify(calText));

// Check disabled days
const disabledDays = await page.locator('button[disabled]').count();
console.log('Disabled buttons: ' + disabledDays);

// Click a future valid day (try various days)
for (const dayNum of [14, 15, 16, 17, 18]) {
  const dayBtn = page.locator(`button:text-is("${dayNum}")`).first();
  if (await dayBtn.count() > 0 && !(await dayBtn.isDisabled())) {
    await dayBtn.click();
    console.log('Clicked day ' + dayNum);
    await page.waitForTimeout(2000);
    break;
  }
}

await page.screenshot({ path: '/tmp/opencode/step3-day-selected-375.png', fullPage: true });
console.log('Screenshot: step3-day-selected-375.png');

// Check time slots
const slots = await page.locator('button.min-h-\\[44px\\]').count();
console.log('Time slot buttons: ' + slots);

// Check loading skeletons
const skeletons = await page.locator('.animate-pulse').count();
console.log('Loading skeletons: ' + skeletons);

// Check error
const errors = await page.locator('text=Erro ao carregar').count();
console.log('Error messages: ' + errors);

// Check Manhã/Tarde tabs
const tabs = await page.locator('button:has-text("Manhã"), button:has-text("Tarde")').count();
console.log('Tabs (Manhã/Tarde): ' + tabs);

// Click Tarde tab
await page.click('button:has-text("Tarde")');
await page.waitForTimeout(500);
const afternoonSlots = await page.locator('button.min-h-\\[44px\\]').count();
console.log('Afternoon slots: ' + afternoonSlots);

// Click Manhã back
await page.click('button:has-text("Manhã")');
await page.waitForTimeout(500);
const morningSlots = await page.locator('button.min-h-\\[44px\\]').count();
console.log('Morning slots: ' + morningSlots);

// Click a slot
const firstSlot = page.locator('button.min-h-\\[44px\\]').first();
if (await firstSlot.count() > 0) {
  await firstSlot.click();
  await page.waitForTimeout(500);
  const slotText = await firstSlot.textContent();
  console.log('Clicked slot: ' + slotText);
}

await page.screenshot({ path: '/tmp/opencode/step3-slot-selected-375.png', fullPage: true });
console.log('Screenshot: step3-slot-selected-375.png');

// Check summary card
const summaryVisible = await page.locator('text=Resumo do agendamento').count();
console.log('Summary visible: ' + (summaryVisible > 0 ? 'YES' : 'NO'));

// Get summary text
const summaryText = await page.locator('.from-emerald-50').first().textContent().catch(() => 'N/A');
console.log('Summary content: ' + summaryText);

// Check Confirmar button
const confirmBtn = page.locator('button:has-text("Confirmar agendamento")');
const confirmDisabled = await confirmBtn.isDisabled().catch(() => 'not found');
console.log('Confirmar disabled: ' + confirmDisabled);

// Check stepper
const stepperDots = await page.locator('.rounded-full:has-text("1"), .rounded-full:has-text("2"), .rounded-full:has-text("3")').count();
console.log('Stepper dots: ' + stepperDots);

// Final full page screenshot
await page.screenshot({ path: '/tmp/opencode/step3-complete-375.png', fullPage: true });
console.log('Screenshot: step3-complete-375.png');

// Console errors
const pageErrors = consoleLogs.filter(l => l.startsWith('[ERROR]') || l.includes('error'));
if (pageErrors.length > 0) {
  console.log('\n=== Console Errors ===');
  pageErrors.forEach(e => console.log(e));
} else {
  console.log('\n=== No console errors ===');
}

await browser.close();
console.log('\n=== All tests completed ===');
