'use strict';
/* Gate de fim de fase. So le, nunca escreve.  Uso: node tools/verificar.js */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SITE = 'https://www.devmrmoraes.com.br';
const IGNORAR = new Set(['.git', 'node_modules', 'tools', 'partials', 'img', 'css', 'js', 'fonts']);

/* Superficie de teste da fundacao: noindex, fora do sitemap, apagada na ultima fase. */
const EXCLUIR = new Set(['laboratorio.html']);

const falhas = [];
const avisos = [];
const reprova = (m) => falhas.push(m);
const alerta = (m) => avisos.push(m);

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

const paginas = listar(RAIZ);
const fonte = new Map(paginas.map(p => [p, fs.readFileSync(path.join(RAIZ, p), 'utf8')]));

/* ids declarados por arquivo, para checar as ancoras */
const ids = new Map();
for (const [rel, html] of fonte) {
  ids.set(rel, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
}

/* 1. sitemap aponta para arquivo existente */
const sitemap = fs.readFileSync(path.join(RAIZ, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
for (const loc of locs) {
  const caminho = loc.replace(SITE, '').replace(/^\//, '');
  const alvo = caminho === '' ? 'index.html' : caminho.endsWith('/') ? caminho + 'index.html' : caminho;
  if (!fs.existsSync(path.join(RAIZ, alvo))) reprova('sitemap: ' + loc + ' -> ' + alvo + ' nao existe');
}

/* 2 e 3. todo href/src relativo resolve, e toda ancora aterrissa num id que existe.
   _modelo.html e copiado para artigos/<slug>/index.html: seus caminhos sao os do destino,
   entao e validado a partir dali, e nao de onde o arquivo dorme no disco. */
const DIRETORIO_EFETIVO = { 'artigos/_modelo.html': 'artigos/exemplo' };
for (const [rel, html] of fonte) {
  const dir = DIRETORIO_EFETIVO[rel] ?? (path.dirname(rel) === '.' ? '' : path.dirname(rel));
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const alvo = m[1];
    if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(alvo)) continue;
    if (alvo === '#') { reprova(rel + ': href="#" vazio'); continue; }

    const [caminho, frag] = alvo.split('#');
    let arquivoAlvo = rel;
    if (caminho) {
      let p = path.posix.normalize(path.posix.join(dir, caminho));
      if (p.endsWith('/')) p += 'index.html';
      else if (!path.extname(p)) p += '/index.html';
      if (!fs.existsSync(path.join(RAIZ, p))) { reprova(rel + ': ' + alvo + ' -> ' + p + ' nao existe'); continue; }
      arquivoAlvo = p;
    }
    if (frag && !ids.get(arquivoAlvo)?.has(frag)) {
      reprova(rel + ': ancora #' + frag + ' nao existe em ' + arquivoAlvo);
    }
  }
}

/* 4. o <head> continua carregando o que precisa carregar */
const OBRIGATORIOS = [
  [/<title>[^<]{10,}<\/title>/, 'title'],
  [/<meta name="description" content="[^"]{40,}"/, 'meta description'],
  [/<link rel="canonical" href="https:\/\/www\.devmrmoraes\.com\.br/, 'canonical'],
  [/<meta property="og:title"/, 'og:title'],
  [/<meta property="og:url"/, 'og:url'],
  [/<meta property="og:image"/, 'og:image'],
  [/<meta name="twitter:card"/, 'twitter:card'],
  [/<meta name="geo\.region" content="BR-RS"/, 'geo.region'],
  [/<link rel="manifest"/, 'manifest'],
  [/<link rel="icon"/, 'favicon'],
  [/gtag\/js\?id=G-19XH630KZE/, 'gtag script'],
  [/gtag\('config', 'G-19XH630KZE'\)/, 'gtag config'],
];
for (const [rel, html] of fonte) {
  for (const [re, nome] of OBRIGATORIOS) if (!re.test(html)) reprova(rel + ': falta ' + nome);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length) reprova(rel + ': falta JSON-LD');
  ld.forEach((m, i) => {
    try { JSON.parse(m[1]); } catch (e) { reprova(rel + ': JSON-LD #' + (i + 1) + ' invalido: ' + e.message); }
  });
  const h1 = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1 !== 1) reprova(rel + ': ' + h1 + ' <h1> (esperado 1)');
}

/* 5. toda saida para o WhatsApp se identifica no GA4 */
for (const [rel, html] of fonte) {
  for (const m of html.matchAll(/<a\s([^>]*href="[^"]*wa\.me[^"]*"[^>]*)>/g)) {
    if (!/data-origem="[^"]+"/.test(m[1])) reprova(rel + ': link wa.me sem data-origem');
  }
}

/* 6. os prints reais continuam referenciados */
const usadas = new Set();
for (const html of fonte.values()) {
  for (const m of html.matchAll(/(?:src|href)="[^"]*img\/(cases\/[^"]+|[^"/]+\.(?:jpg|png|svg))"/g)) {
    usadas.add(m[1].replace(/^cases\//, 'cases/'));
  }
}
for (const arq of fs.readdirSync(path.join(RAIZ, 'img', 'cases'))) {
  if (!usadas.has('cases/' + arq)) alerta('img/cases/' + arq + ' nao e referenciado por nenhuma pagina');
}

/* 7. proibicoes verificaveis */
const PROIBIDO = [
  [/linear-gradient|radial-gradient|conic-gradient/, 'gradiente'],
  [/backdrop-filter/, 'backdrop-filter'],
  [/filter:\s*blur/, 'filter: blur'],
  [/transition:\s*all/, 'transition: all'],
  [/!important/, '!important'],
  [/-webkit-text-stroke/, '-webkit-text-stroke'],
  [/background-clip:\s*text/, 'background-clip: text'],
  [/box-shadow/, 'box-shadow'],
  [/fonts\.(?:googleapis|gstatic)\.com/, 'Google Fonts'],
  [/[─═]{3}|={6}/, 'comentario-caixa'],
  [/\sstyle="/, 'style inline'],
  [/Bebas Neue|DM Sans|DM Serif|Inter|Poppins|Montserrat|Roboto|Open Sans|Lato|Nunito|Raleway|Playfair|Space Grotesk|Outfit|Sora|Manrope/, 'familia proibida'],
];
const alvos = [...paginas, 'css/style.css', 'js/script.js'];
for (const rel of alvos) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) continue;
  const txt = fs.readFileSync(abs, 'utf8');
  for (const [re, nome] of PROIBIDO) {
    const n = (txt.match(new RegExp(re.source, 'g')) || []).length;
    if (n) reprova(rel + ': ' + n + 'x ' + nome);
  }
}

/* relatorio */
const total = paginas.length;
if (avisos.length) { console.log('AVISOS'); avisos.forEach(a => console.log('  . ' + a)); console.log(''); }
if (falhas.length) {
  console.log('REPROVADO -- ' + falhas.length + ' problemas em ' + total + ' paginas\n');
  falhas.forEach(f => console.log('  x ' + f));
  process.exit(1);
}
console.log('OK -- ' + total + ' paginas, ' + locs.length + ' URLs no sitemap, nenhum problema');
