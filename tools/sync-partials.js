'use strict';
/* Injeta partials/{head-assets,header,footer}.html entre marcadores nos .html do repositorio.
   Node puro, sem dependencia, sem flag.  Uso: node tools/sync-partials.js */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const BLOCOS = { assets: 'head-assets.html', header: 'header.html', footer: 'footer.html' };
const IGNORAR = new Set(['.git', 'node_modules', 'tools', 'partials', 'img', 'css', 'js', 'fonts']);

/* referencia visual da fase 6, fora do site */
const EXCLUIR = new Set(["mockup-presenca.html"]);

/* _modelo.html mora em artigos/ mas e copiado para artigos/<slug>/index.html.
   Os caminhos que ele carrega sao os do destino, nao os da posicao atual no disco. */
const PROFUNDIDADE_FIXA = { 'artigos/_modelo.html': 2 };

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

const PASTAS_SERVICO = new Set(['criacao-de-sites', 'seo-para-sites', 'google-meu-negocio',
  'sistemas-personalizados', 'automacao-de-processos', 'aplicativos-mobile',
  'consultoria-tecnica', 'chatbot-com-ia', 'suporte-e-manutencao']);

/* A chave e hierarquica de proposito: um case da 'projetos/braskit-seo', que casa como
   ancestral de 'projetos' e vira aria-current="true" em vez de "page" -- a pagina do case
   nao E a listagem. Lista explicita de servicos para que um html novo na raiz nao seja
   confundido com um deles. */
function chaveDaPagina(rel) {
  if (rel === 'index.html') return 'inicio';
  if (rel === 'projetos.html') return 'projetos';
  if (rel.startsWith('projetos/')) return 'projetos/' + rel.split('/')[1];
  if (rel === 'artigos/index.html') return 'artigos';
  if (rel.startsWith('artigos/')) return 'artigos/' + rel.split('/')[1].replace(/\.html$/, '');
  const pasta = rel.split('/')[0];
  return PASTAS_SERVICO.has(pasta) ? 'servicos/' + pasta : 'outra';
}

function renderizar(fonte, raiz, chave) {
  const grau = (alvo) => chave === alvo ? 'exato' : chave.startsWith(alvo + '/') ? 'ancestral' : '';
  /* {{inicio}} prefixa ancora que mora na home. Na propria home fica vazio, para o link
     rolar em vez de recarregar; em qualquer outra pagina precisa levar ate la primeiro,
     inclusive nas que estao na raiz, como projetos.html. */
  const inicio = chave === 'inicio' ? '' : (raiz || './');
  return fonte
    .replace(/\{\{inicio\}\}/g, inicio)
    .replace(/\{\{raiz\}\}/g, raiz)
    .replace(/\{\{home\}\}/g, raiz || './')
    .replace(/\{\{ativo:([^}]+)\}\}/g, (_, alvo) => {
      const g = grau(alvo);
      return g === 'exato' ? ' aria-current="page"' : g === 'ancestral' ? ' aria-current="true"' : '';
    })
    .replace(/\{\{ativo-classe:([^}]+)\}\}/g, (_, alvo) => grau(alvo) ? ' ativo' : '');
}

/* null  = par ausente: pagina ainda nao migrada, segue o baile.
   throw = par pela metade, duplicado ou invertido: aborta antes de escrever qualquer coisa. */
function localizar(texto, nome, rel) {
  const abre = [...texto.matchAll(new RegExp('<!--\\s*#' + nome + '\\s*-->', 'g'))];
  const fecha = [...texto.matchAll(new RegExp('<!--\\s*/#' + nome + '\\s*-->', 'g'))];
  if (!abre.length && !fecha.length) return null;
  if (abre.length !== 1 || fecha.length !== 1) {
    throw new Error(rel + ': marcador #' + nome + ' aparece ' + abre.length + 'x/' + fecha.length + 'x (esperado 1x/1x)');
  }
  const ini = abre[0].index + abre[0][0].length;
  const fim = fecha[0].index;
  if (fim < ini) throw new Error(rel + ': fechamento de #' + nome + ' vem antes da abertura');
  return { ini, fim };
}

/* 1. carregar os partials */
const partial = {};
for (const [nome, arq] of Object.entries(BLOCOS)) {
  const p = path.join(RAIZ, 'partials', arq);
  if (!fs.existsSync(p)) { console.error('falta partials/' + arq); process.exit(1); }
  partial[nome] = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

/* 2. renderizar e validar tudo em memoria; nada e escrito nesta etapa */
const pendentes = [];
const erros = [];
for (const rel of listar(RAIZ)) {
  const abs = path.join(RAIZ, rel);
  const bruto = fs.readFileSync(abs, 'utf8');
  const crlf = bruto.includes('\r\n');
  const original = crlf ? bruto.replace(/\r\n/g, '\n') : bruto;

  const prof = PROFUNDIDADE_FIXA[rel] ?? rel.split('/').length - 1;
  const raiz = '../'.repeat(prof);
  const chave = chaveDaPagina(rel);

  let texto = original;
  const aplicados = [];
  try {
    /* de tras para frente: substituir nao desloca os indices ainda nao usados */
    const pontos = Object.keys(BLOCOS)
      .map(n => [n, localizar(texto, n, rel)])
      .filter(([, p]) => p)
      .sort((a, b) => b[1].ini - a[1].ini);

    for (const [nome, pos] of pontos) {
      const corpo = '\n' + renderizar(partial[nome], raiz, chave) + '\n  ';
      if (texto.slice(pos.ini, pos.fim) !== corpo) aplicados.push(nome);
      texto = texto.slice(0, pos.ini) + corpo + texto.slice(pos.fim);
    }
    pendentes.push({ rel, abs, crlf, texto, original, aplicados, vazio: pontos.length === 0 });
  } catch (e) {
    erros.push(e.message);
  }
}
if (erros.length) { erros.forEach(e => console.error('ERRO ' + e)); process.exit(1); }

/* 3. escrever */
let n = 0;
for (const p of pendentes) {
  const mudou = p.texto !== p.original;
  if (mudou) { fs.writeFileSync(p.abs, p.crlf ? p.texto.replace(/\n/g, '\r\n') : p.texto); n++; }
  const marca = p.vazio ? 'sem marcadores' : mudou ? 'atualizado' : 'inalterado';
  const detalhe = p.aplicados.length ? ' (' + p.aplicados.join(', ') + ')' : '';
  console.log('  ' + p.rel.padEnd(46) + ' ' + marca + detalhe);
}
const semMarcador = pendentes.filter(p => p.vazio).length;
console.log('\n  ' + pendentes.length + ' arquivos | ' + n + ' atualizados | ' +
            (pendentes.length - n - semMarcador) + ' inalterados | ' + semMarcador + ' sem marcadores');
console.log(n === 0 ? '  idempotente: nada a fazer' : '  rode de novo: deve reportar 0 atualizados');
