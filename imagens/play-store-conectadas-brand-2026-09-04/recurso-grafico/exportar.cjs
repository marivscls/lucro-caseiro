const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../../../node_modules/.pnpm/sharp@0.35.3_@types+node@22.19.17/node_modules/sharp');
const spec = require('./prompt.json');
async function main() {
  const original = path.join(__dirname, 'original.png');
  fs.copyFileSync(spec.source, original);
  const final = path.join(__dirname, 'lucro-caseiro-recurso-grafico-1024x500.png');
  await sharp(original).resize(1024,500,{fit:'cover'}).flatten({background:'#FAF8F6'}).removeAlpha().png().toFile(final);
  const m = await sharp(final).metadata();
  if(m.width !== 1024 || m.height !== 500 || m.channels !== 3 || m.hasAlpha) throw new Error('PNG inválido');
  const result = {file:final,width:m.width,height:m.height,channels:m.channels,hasAlpha:m.hasAlpha,size:fs.statSync(final).size};
  fs.writeFileSync(path.join(__dirname, 'validacao.json'), JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
