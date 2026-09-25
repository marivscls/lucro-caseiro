import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export async function open(h=800) {
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const ctx = await b.newContext({viewport:{width:360,height:h},deviceScaleFactor:3});
const p = await ctx.newPage();
await p.goto('http://localhost:8123/');
await p.getByText('Já tenho conta').click();
await p.waitForTimeout(1500);
const inputs = p.locator('input');
await inputs.nth(0).fill('reel@exemplo.com');
await inputs.nth(1).fill('senha1234');
await p.getByText('Entrar', {exact:true}).last().click();
await p.waitForTimeout(4000);
return {b,p,ctx};
}
