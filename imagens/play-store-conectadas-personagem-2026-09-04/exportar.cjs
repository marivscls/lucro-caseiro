const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../../node_modules/.pnpm/sharp@0.35.3_@types+node@22.19.17/node_modules/sharp');
const spec = require('./prompt.json');
async function main() {
  const original = path.join(__dirname, 'panorama-original.png');
  if (!fs.existsSync(original)) fs.copyFileSync(spec.source, original);
  const panorama = path.join(__dirname, 'panorama-4320x1920.png');
  await sharp(original).resize(4320, 1920, {fit:'cover'}).flatten({background:'#4B2233'}).removeAlpha().png().toFile(panorama);
  const names = ['01-seu-negocio','02-precificacao','03-catalogo','04-financeiro'];
  const results = [];
  for (const [i, name] of names.entries()) {
    const file = path.join(__dirname, name + '-1080x1920.png');
    await sharp(panorama).extract({left:i*1080,top:0,width:1080,height:1920}).removeAlpha().png().toFile(file);
    const info = await sharp(file).metadata();
    if (info.width !== 1080 || info.height !== 1920 || info.hasAlpha) throw new Error('Invalid PNG: ' + name);
    results.push({file:path.basename(file),width:info.width,height:info.height,channels:info.channels,bytes:fs.statSync(file).size});
  }
  fs.writeFileSync(path.join(__dirname,'validacao.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
