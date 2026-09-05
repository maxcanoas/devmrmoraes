'use strict';

const WHATSAPP = '5551999608608';

function registrarConversa(origem) {
  if (typeof gtag !== 'function') return;
  gtag('event', 'contato_whatsapp', { origem: origem, pagina: location.pathname });
}

function medirSaidas() {
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => registrarConversa(link.dataset.origem || 'nao_identificado'));
  });

  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag === 'function') gtag('event', 'contato_telefone', { pagina: location.pathname });
    });
  });
}

function marcarAno() {
  const ano = String(new Date().getFullYear());
  document.querySelectorAll('[data-ano]').forEach(el => { el.textContent = ano; });
}

function fioDoHeader() {
  const cabecalho = document.querySelector('header');
  if (!cabecalho) return;
  const alternar = () => cabecalho.classList.toggle('rolado', scrollY > 8);
  addEventListener('scroll', alternar, { passive: true });
  alternar();
}

/* Escuro por padrao; o claro e a saida de quem le no sol. O <head> ja aplicou a escolha. */
function configurarTema() {
  const botao = document.querySelector('[data-tema-botao]');
  if (!botao) return;
  const raiz = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const claro = () => raiz.dataset.tema === 'claro';

  const aplicar = () => {
    botao.setAttribute('aria-label', claro() ? 'Mudar para o tema escuro' : 'Mudar para o tema claro');
    if (meta) meta.content = claro() ? '#F4F5F9' : '#0A0C14';
  };

  botao.addEventListener('click', () => {
    const alvo = claro() ? 'escuro' : 'claro';
    if (alvo === 'claro') raiz.dataset.tema = 'claro';
    else delete raiz.dataset.tema;
    try { localStorage.setItem('tema', alvo); } catch (e) {}
    aplicar();
  });

  aplicar();
}

/* O atalho so existe entre o fim da abertura e o inicio do contato. */
function configurarAtalho() {
  const atalho = document.querySelector('[data-atalho]');
  if (!atalho) return;

  const topo = document.querySelector('.abertura-acao') || document.querySelector('.ficha-acao') || document.querySelector('main h1') || document.querySelector('h1');
  const contato = document.querySelector('#contato');
  if (!topo) return;

  let passouDoTopo = false;
  let noContato = false;
  const decidir = () => { atalho.hidden = !(passouDoTopo && !noContato); };

  new IntersectionObserver(([e]) => {
    passouDoTopo = e.boundingClientRect.bottom < 0;
    decidir();
  }, { threshold: 0 }).observe(topo);

  if (contato) {
    new IntersectionObserver(([e]) => {
      noContato = e.isIntersecting;
      decidir();
    }, { threshold: 0 }).observe(contato);
  }
}

function erroNoCampo(campo, mensagem) {
  campo.setAttribute('aria-invalid', 'true');
  const aviso = document.createElement('p');
  aviso.className = 'campo-erro';
  aviso.textContent = mensagem;
  campo.insertAdjacentElement('afterend', aviso);
}

/* Popup bloqueado devolve null: sem esta saida a pessoa preenche tudo e nada acontece. */
function saidaManual(formulario, url) {
  let caixa = formulario.querySelector('.saida-manual');
  if (!caixa) {
    caixa = document.createElement('p');
    caixa.className = 'saida-manual';
    caixa.setAttribute('role', 'status');
    formulario.append(caixa);
  }
  caixa.replaceChildren();

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.dataset.origem = 'formulario_saida_manual';
  link.textContent = 'O navegador bloqueou a abertura. Toque aqui para abrir o WhatsApp';
  link.addEventListener('click', () => registrarConversa('formulario_saida_manual'));
  caixa.append(link);
  link.focus();
}

function configurarFormulario() {
  const formulario = document.querySelector('#formulario');
  if (!formulario) return;

  formulario.addEventListener('input', e => {
    e.target.removeAttribute('aria-invalid');
    formulario.querySelector('.campo-erro')?.remove();
  });

  formulario.addEventListener('submit', e => {
    e.preventDefault();
    formulario.querySelectorAll('.campo-erro').forEach(el => el.remove());
    formulario.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));

    const nome = formulario.querySelector('#campo-nome');
    const pedido = formulario.querySelector('#campo-pedido');

    if (!nome.value.trim()) { erroNoCampo(nome, 'Escreva seu nome para eu saber como te chamar.'); nome.focus(); return; }
    if (!pedido.value.trim()) { erroNoCampo(pedido, 'Escreva o que você precisa, mesmo que em uma linha.'); pedido.focus(); return; }

    const texto = 'Olá! Meu nome é ' + nome.value.trim() + '. ' + pedido.value.trim();
    const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    const janela = open(url, '_blank');

    if (janela) registrarConversa('formulario');
    else saidaManual(formulario, url);
  });
}

/* AS CENAS. Tudo nasce no estado final no CSS: sem GSAP ou com menos movimento, a pagina e
   o depois inteiro. Tres mundos: reduzido (nada), preso (desktop alto: pin) e leve (o resto).
   So transform anima; texto nunca perde opacidade. */
function cenaDoCase(cena, preso) {
  const palco = cena.querySelector('.cena-palco');
  const mascara = cena.querySelector('.anexo-mascara');
  const conteudo = mascara && mascara.firstElementChild;
  if (!palco || !mascara || !conteudo) return;

  const vertical = cena.classList.contains('cena-cima');
  const eixo = vertical ? 'yPercent' : 'xPercent';
  const lado = cena.classList.contains('cena-direita') ? 1 : -1;
  const varrer = (tl, inicio, dur, ease) => tl
    .fromTo(mascara, { [eixo]: lado * 100 }, { [eixo]: 0, ease: ease, duration: dur }, inicio)
    .fromTo(conteudo, { [eixo]: -lado * 100 }, { [eixo]: 0, ease: ease, duration: dur }, inicio);

  if (!preso) {
    varrer(gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: cena.querySelector('.anexo'), start: 'top 85%', once: true } }), 0, 0.9, 'power2.out');
    return;
  }

  const antes = cena.querySelector('.antes');
  const depois = cena.querySelector('.depois');
  const resultado = cena.querySelector('.resultado');
  const img = cena.querySelector('.anexo img');
  const altura = () => palco.clientHeight;

  cena.classList.add('cena-presa');
  const tl = gsap.timeline({
    scrollTrigger: { trigger: cena, start: 'top top', end: '+=110%', pin: palco, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true }
  });
  varrer(tl, 0.2, 0.45, 'none');
  if (antes) tl.fromTo(antes, { y: 0 }, { y: () => -altura() * 0.7, ease: 'none', duration: 0.4 }, 0.22);
  if (depois) tl.fromTo(depois, { y: () => altura() }, { y: 0, ease: 'none', duration: 0.4 }, 0.3);
  if (resultado) tl.fromTo(resultado, { scale: 0.94, transformOrigin: 'left top' }, { scale: 1, duration: 0.25 }, 0.72);
  /* o print e 6% maior que o quadro e desliza dentro dele */
  if (img) tl.fromTo(img, { scale: 1.06, yPercent: -2.5 }, { scale: 1.06, yPercent: 2.5, ease: 'none', duration: 1 }, 0);
}

/* Nas internas o print nao tem palco: a linha so o revela quando ele entra na tela. */
function revelarAnexos() {
  document.querySelectorAll('.anexo-mascara').forEach(mascara => {
    if (mascara.closest('.cena') || !mascara.firstElementChild) return;
    gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.9 }, scrollTrigger: { trigger: mascara, start: 'top 88%', once: true } })
      .fromTo(mascara, { xPercent: -100 }, { xPercent: 0 }, 0)
      .fromTo(mascara.firstElementChild, { xPercent: 100 }, { xPercent: 0 }, 0);
  });
}

function acenderServicos() {
  const nomes = gsap.utils.toArray('.lista-servicos li');
  if (!nomes.length) return;
  nomes.forEach(li => li.classList.add('apagado'));
  ScrollTrigger.batch(nomes, {
    start: 'top 88%',
    once: true,
    onEnter: lote => lote.forEach((li, i) => setTimeout(() => li.classList.remove('apagado'), i * 90))
  });
}

function entrarCompromissos() {
  const itens = gsap.utils.toArray('.compromissos li');
  if (!itens.length) return;
  gsap.set(itens, { y: 28 });
  ScrollTrigger.batch(itens, {
    start: 'top 90%',
    once: true,
    onEnter: lote => gsap.to(lote, { y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', overwrite: true })
  });
}

/* O breu sai da frente do ambar, com a linha na aresta. */
function varrerContato() {
  const varredura = document.querySelector('.contato-varredura');
  if (!varredura) return;
  gsap.fromTo(varredura, { x: 0, xPercent: 0 }, {
    x: 0, xPercent: 101, ease: 'none',
    scrollTrigger: { trigger: varredura.parentElement, start: 'top 85%', end: 'top 25%', scrub: 0.4 }
  });
}

/* O vendor (117 KB) entra depois do load, em prioridade baixa e em ordem: nao disputa banda
   com fonte, foto e CSS. Quem rola antes ve o site parado e inteiro. */
function carregarVendor() {
  const raiz = document.querySelector('script[src$="js/script.js"]');
  const base = raiz ? raiz.getAttribute('src').replace(/script.js$/, '') : 'js/';
  const um = nome => new Promise((ok, erro) => {
    const s = document.createElement('script');
    s.src = base + 'vendor/' + nome;
    s.async = false;
    s.fetchPriority = 'low';
    s.onload = ok;
    s.onerror = erro;
    document.head.append(s);
  });
  return um('gsap.min.js').then(() => um('ScrollTrigger.min.js'));
}

function cenas() {
  if (!document.querySelector('.cena, .lista-servicos, .compromissos, .contato-varredura')) return;
  const depoisDoLoad = document.readyState === 'complete' ? Promise.resolve() : new Promise(ok => addEventListener('load', ok, { once: true }));
  depoisDoLoad.then(carregarVendor).then(registrarCenas).catch(() => {});
}

function registrarCenas() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const palco = '(min-width: 48em) and (min-height: 43.75em)';
  gsap.matchMedia().add({
    reduzido: '(prefers-reduced-motion: reduce)',
    preso: palco + ' and (prefers-reduced-motion: no-preference)',
    leve: '(prefers-reduced-motion: no-preference)'
  }, ctx => {
    if (ctx.conditions.reduzido) return;
    const preso = ctx.conditions.preso;
    document.querySelectorAll('.cena').forEach(cena => cenaDoCase(cena, preso));
    revelarAnexos();
    acenderServicos();
    entrarCompromissos();
    if (preso) varrerContato();
    return () => document.querySelectorAll('.apagado, .cena-presa').forEach(el => el.classList.remove('apagado', 'cena-presa'));
  });

  /* a fonte real muda a altura de tudo: o pin se remede quando ela chega */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* A medicao entra imediatamente: listener de clique tardio e contato que o GA4 nao viu.
   Cenas esperam a pagina deixar de ser pre-renderizada, senao medem no vazio. */
function iniciar() {
  fioDoHeader();
  configurarTema();
  configurarFormulario();
  medirSaidas();

  if (document.prerendering) document.addEventListener('prerenderingchange', cenas, { once: true });
  else cenas();

  const depois = () => { configurarAtalho(); marcarAno(); };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(depois, { timeout: 2000 });
  else setTimeout(depois, 200);
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar);
else iniciar();
