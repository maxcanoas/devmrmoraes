'use strict';
/* O FAQPage do JSON-LD passa a ser gerado a partir do que a pagina mostra, e nao
   mantido a mao em paralelo. Antes desta ferramenta havia 8 divergencias entre os
   dois, uma delas mudando o sentido da resposta.
   Uso: node tools/sync-faq.js */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const IGNORAR = new Set(['.git', 'node_modules', 'tools', 'partials', 'img', 'css', 'js', 'fonts']);
const EXCLUIR = new Set();

function listar(dir, base = '') {
  const saida = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(item.name)) continue;
    const rel = base ? base + '/' + item.name : item.name;
    if (item.isDirectory()) saida.push(...listar(path.join(dir, item.name), rel));
    else if (item.name.endsWith('.html') && !EXCLUIR.has(rel)) saida.push(rel);
  }
  return saida.sort();
}

const texto = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();

let mexidos = 0;
for (const rel of listar(RAIZ)) {
  const abs = path.join(RAIZ, rel);
  const html = fs.readFileSync(abs, 'utf8');

  const pares = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>\s*<div>([\s\S]*?)<\/div>/g)]
    .map(m => ({ pergunta: texto(m[1]), resposta: texto(m[2]) }));
  if (!pares.length) continue;

  let saida = html, alterou = false;
  for (const m of html.matchAll(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/g)) {
    let dados;
    try { dados = JSON.parse(m[2]); } catch { continue; }
    const nos = dados['@graph'] || [dados];
    const faq = nos.find(n => n['@type'] === 'FAQPage');
    if (!faq) continue;

    faq.mainEntity = pares.map(p => ({
      '@type': 'Question',
      name: p.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: p.resposta }
    }));

    const novo = m[1] + '\n  ' + JSON.stringify(dados, null, 2).split('\n').join('\n  ') + '\n  ' + m[3];
    /* funcao de substituicao, e nao string: um $$ no conteudo viraria $ literal. */
    if (novo !== m[0]) { saida = saida.replace(m[0], () => novo); alterou = true; }
  }

  if (alterou) { fs.writeFileSync(abs, saida); mexidos++; }
  console.log('  ' + rel.padEnd(46) + (alterou ? 'FAQPage regerado' : 'ja em sincronia') + ' (' + pares.length + ' perguntas)');
}
console.log('\n  ' + mexidos + ' arquivos atualizados');
