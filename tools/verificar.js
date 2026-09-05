'use strict';
/* Gate de fim de fase. So le, nunca escreve.  Uso: node tools/verificar.js */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SITE = 'https://www.devmrmoraes.com.br';
const IGNORAR = new Set(['.git', 'node_modules', 'tools', 'partials', 'img', 'css', 'js', 'fonts']);

/* referencia visual da fase 6, fora do site */
const EXCLUIR = new Set(["mockup-presenca.html"]);

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
      let p = path.posix.normalize(path.posix.join(dir, caminho)).replace(/^\.\//, '');
      if (p === '' || p === '.' || p === '/') p = 'index.html';
      else if (p.endsWith('/')) p += 'index.html';
      else if (!path.extname(p)) p += '/index.html';
      if (!fs.existsSync(path.join(RAIZ, p))) { reprova(rel + ': ' + alvo + ' -> ' + p + ' nao existe'); continue; }
      arquivoAlvo = p;
    }
    if (frag && !ids.get(arquivoAlvo)?.has(frag)) {
      reprova(rel + ': ancora #' + frag + ' nao existe em ' + arquivoAlvo);
    }
  }
}

/* 4. o <head> continua carregando o que precisa carregar. Pagina noindex (o 404, o modelo
   de artigo) nao precisa de canonical, de card nem de JSON-LD: ela nao existe para o Google. */
const NOINDEX = /<meta name="robots" content="[^"]*noindex/;
const OBRIGATORIOS = [
  [/<title>[^<]{10,}<\/title>/, 'title'],
  [/<meta name="description" content="[^"]{40,}"/, 'meta description'],
  [/<link rel="manifest"/, 'manifest'],
  [/<link rel="icon"/, 'favicon'],
  [/gtag\/js\?id=G-19XH630KZE/, 'gtag script'],
  [/gtag\('config', 'G-19XH630KZE'\)/, 'gtag config'],
];
const OBRIGATORIOS_INDEXAVEL = [
  [/<link rel="canonical" href="https:\/\/www\.devmrmoraes\.com\.br/, 'canonical'],
  [/<meta property="og:title"/, 'og:title'],
  [/<meta property="og:url"/, 'og:url'],
  [/<meta property="og:image"/, 'og:image'],
  [/<meta name="twitter:card"/, 'twitter:card'],
  [/<meta name="geo\.region" content="BR-RS"/, 'geo.region'],
];
for (const [rel, html] of fonte) {
  const indexavel = !NOINDEX.test(html);
  for (const [re, nome] of OBRIGATORIOS) if (!re.test(html)) reprova(rel + ': falta ' + nome);
  if (indexavel) for (const [re, nome] of OBRIGATORIOS_INDEXAVEL) if (!re.test(html)) reprova(rel + ': falta ' + nome);
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!ld.length && indexavel) reprova(rel + ': falta JSON-LD');
  ld.forEach((m, i) => {
    try { JSON.parse(m[1]); } catch (e) { reprova(rel + ': JSON-LD #' + (i + 1) + ' invalido: ' + e.message); }
  });
  const h1 = [...html.matchAll(/<h1[\s>]/g)].length;
  if (h1 !== 1) reprova(rel + ': ' + h1 + ' <h1> (esperado 1)');
}

/* 4b. o FAQPage tem que dizer a mesma coisa que a pagina mostra. Havia 8 divergencias
   antes desta checagem, uma delas mudando o sentido da resposta. */
const limpar = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

for (const [rel, html] of fonte) {
  const perguntasLd = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let dados;
    try { dados = JSON.parse(m[1]); } catch { continue; }
    const nos = dados['@graph'] || [dados];
    for (const no of nos) {
      if (no['@type'] !== 'FAQPage') continue;
      for (const q of no.mainEntity || []) perguntasLd.push({ nome: q.name, resposta: q.acceptedAnswer?.text || '' });
    }
  }
  if (!perguntasLd.length) continue;

  const visiveis = [...html.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/g)].map(m => limpar(m[1]));
  const respostas = [...html.matchAll(/<summary[^>]*>[\s\S]*?<\/summary>\s*<div>([\s\S]*?)<\/div>/g)].map(m => limpar(m[1]));

  if (perguntasLd.length !== visiveis.length) {
    reprova(rel + ': FAQPage tem ' + perguntasLd.length + ' perguntas e a pagina mostra ' + visiveis.length);
  }
  perguntasLd.forEach((q, i) => {
    if (!visiveis.includes(limpar(q.nome))) reprova(rel + ': pergunta so no JSON-LD -> "' + q.nome.slice(0, 60) + '"');
    const vis = respostas[i];
    if (vis && limpar(q.resposta) !== vis) {
      reprova(rel + ': resposta ' + (i + 1) + ' diverge entre JSON-LD e pagina');
    }
  });
  visiveis.forEach(v => {
    if (!perguntasLd.some(q => limpar(q.nome) === v)) reprova(rel + ': pergunta so na pagina -> "' + v.slice(0, 60) + '"');
  });
}

/* 4c. o <head> e intocavel: cada valor tem que continuar identico ao do checkpoint.
   Excecoes autorizadas pelo cliente: o noindex do _modelo.html, o theme-color (a paleta
   mudou) e o FAQPage, que agora e gerado a partir da pagina pelo sync-faq. */
const REF = path.join(__dirname, 'head-referencia.json');
if (fs.existsSync(REF)) {
  const ref = JSON.parse(fs.readFileSync(REF, 'utf8'));
  const CAMPOS = {
    'title': /<title>([\s\S]*?)<\/title>/,
    'description': /<meta name="description" content="([^"]*)"/,
    'canonical': /<link rel="canonical" href="([^"]*)"/,
    'og:title': /<meta property="og:title" content="([^"]*)"/,
    'og:description': /<meta property="og:description" content="([^"]*)"/,
    'og:url': /<meta property="og:url" content="([^"]*)"/,
    'og:image': /<meta property="og:image" content="([^"]*)"/,
    'og:type': /<meta property="og:type" content="([^"]*)"/,
    'twitter:title': /<meta name="twitter:title" content="([^"]*)"/,
    'twitter:description': /<meta name="twitter:description" content="([^"]*)"/,
    'robots': /<meta name="robots" content="([^"]*)"/,
    'geo.region': /<meta name="geo.region" content="([^"]*)"/,
    'geo.placename': /<meta name="geo.placename" content="([^"]*)"/,
  };
  const semFaq = (dados) => {
    const copia = JSON.parse(JSON.stringify(dados));
    const nos = copia['@graph'] || [copia];
    for (const no of nos) if (no['@type'] === 'FAQPage') delete no.mainEntity;
    return JSON.stringify(copia);
  };

  for (const [rel, html] of fonte) {
    const esperado = ref[rel];
    if (!esperado) continue;
    /* o head do _modelo.html tem exemplos de tag dentro de comentario; nao sao conteudo */
    const bruto = html.slice(0, html.indexOf('</head>'));
    const head = bruto.replace(/<!--[\s\S]*?-->/g, '');
    for (const [nome, re] of Object.entries(CAMPOS)) {
      if (esperado[nome] === undefined) continue;
      if (rel === 'artigos/_modelo.html' && nome === 'robots') continue;
      const m = head.match(re);
      const agora = m ? m[1].trim() : null;
      if (agora !== esperado[nome]) {
        reprova(rel + ': ' + nome + ' mudou\n      antes: ' + esperado[nome] +
                '\n      agora: ' + (agora === null ? '(ausente)' : agora));
      }
    }
    const ldAgora = [...bruto.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map(m => { try { return JSON.parse(m[1]); } catch { return null; } }).filter(Boolean);
    if (ldAgora.length !== esperado.jsonLd.length) {
      reprova(rel + ': tinha ' + esperado.jsonLd.length + ' bloco(s) JSON-LD, agora tem ' + ldAgora.length);
    } else {
      ldAgora.forEach((dados, i) => {
        if (semFaq(dados) !== semFaq(esperado.jsonLd[i])) {
          reprova(rel + ': JSON-LD #' + (i + 1) + ' mudou fora do FAQPage');
        }
      });
    }
  }
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
  /* srcset junto: os WebP chegam por <source srcset>, e nao por src */
  for (const m of html.matchAll(/(?:src|href|srcset)="[^"]*img\/(cases\/[^"]+|[^"/]+\.(?:jpg|png|svg|webp))"/g)) {
    usadas.add(m[1]);
  }
}
for (const arq of fs.readdirSync(path.join(RAIZ, 'img', 'cases'))) {
  if (!usadas.has('cases/' + arq)) alerta('img/cases/' + arq + ' nao e referenciado por nenhuma pagina');
}

/* 7a. o vidro tem teto, e nao proibicao. Dois elementos o usam -- o header e o atalho
   do WhatsApp -- e cada um precisa do par com prefixo para o Safari. Acima disso o site
   vira sopa de blur e o custo de composicao aparece no celular. */
const TETO = [
  [/backdrop-filter/g, 'backdrop-filter', 5],
];

/* 7b. orcamento em bytes brutos. O CSS subiu de 45.000 para 60.000 na direcao A virada
   (05/09/2026); o JS proprio e o vendor (GSAP + ScrollTrigger) ganharam teto proprio.
   Se um efeito novo nao couber, corte o efeito -- nao aumente o teto. */
const ORCAMENTO = [
  ['css/style.css', 60000],
  ['js/script.js', 12000],
  ['js/vendor', 130000],
];
for (const [rel, teto] of ORCAMENTO) {
  const abs = path.join(RAIZ, rel);
  if (!fs.existsSync(abs)) { reprova(rel + ': nao existe'); continue; }
  const bytes = fs.statSync(abs).isDirectory()
    ? fs.readdirSync(abs).filter(a => a.endsWith('.js')).reduce((n, a) => n + fs.statSync(path.join(abs, a)).size, 0)
    : fs.statSync(abs).size;
  if (bytes > teto) reprova(rel + ': ' + bytes + ' B, teto ' + teto);
}
for (const [re, nome, teto] of TETO) {
  const css = fs.readFileSync(path.join(RAIZ, 'css/style.css'), 'utf8');
  const n = (css.match(re) || []).length;
  if (n > teto) reprova('css/style.css: ' + n + 'x ' + nome + ', teto ' + teto);
}

/* 7. proibicoes verificaveis */
const PROIBIDO = [
  [/linear-gradient|radial-gradient|conic-gradient/, 'gradiente'],
  /* lookbehind: sem ele "backdrop-filter: blur" cai nesta proibicao */
  [/(?<![-\w])filter:\s*blur/, 'filter: blur'],
  [/transition:\s*all/, 'transition: all'],
  [/!important/, '!important'],
  [/-webkit-text-stroke/, '-webkit-text-stroke'],
  [/background-clip:\s*text/, 'background-clip: text'],
  [/box-shadow/, 'box-shadow'],
  [/fonts\.(?:googleapis|gstatic)\.com/, 'Google Fonts'],
  [/[─═]{3}|={6}/, 'comentario-caixa'],
  [/\sstyle="/, 'style inline'],
  /* fronteira de palavra: sem ela "IntersectionObserver" casava com "Inter" */
  [/\b(?:Bebas Neue|DM Sans|DM Serif|Inter|Poppins|Montserrat|Roboto|Open Sans|Lato|Nunito|Raleway|Playfair|Space Grotesk|Outfit|Sora|Manrope|Figtree|Plus Jakarta|Urbanist|Syne|Cabinet Grotesk|Satoshi|General Sans|Clash Display)\b/, 'familia proibida'],
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
