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

  /* Ligar nao e conversa de WhatsApp: evento proprio, para nao inflar a metrica
     que ja existe no GA4 desde antes. */
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

/* O header so ganha o fio de 1px depois que a pagina rola. Enquanto esta no topo,
   nada separa o header do conteudo e a pagina abre como uma folha limpa. */
function fioDoHeader() {
  const cabecalho = document.querySelector('header');
  if (!cabecalho) return;
  const alternar = () => cabecalho.classList.toggle('rolado', scrollY > 8);
  addEventListener('scroll', alternar, { passive: true });
  alternar();
}

/* O tema. O <head> ja aplicou a escolha salva antes do primeiro paint; aqui so entra o
   botao. Sem escolha salva o site segue o sistema, e o rotulo do botao precisa dizer
   para onde ele leva -- por isso ele le o tema em vigor, e nao o atributo. */
function configurarTema() {
  const botao = document.querySelector('[data-tema-botao]');
  if (!botao) return;

  const escuro = () => document.documentElement.dataset.tema
    ? document.documentElement.dataset.tema === 'escuro'
    : matchMedia('(prefers-color-scheme: dark)').matches;

  const rotular = () => {
    botao.setAttribute('aria-label', escuro() ? 'Mudar para o tema claro' : 'Mudar para o tema escuro');
  };

  botao.addEventListener('click', () => {
    const alvo = escuro() ? 'claro' : 'escuro';
    document.documentElement.dataset.tema = alvo;
    try { localStorage.setItem('tema', alvo); } catch (e) {}
    rotular();
  });

  /* Quem nunca escolheu acompanha o sistema, inclusive se ele mudar com a pagina aberta. */
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', rotular);
  rotular();
}

/* O atalho do WhatsApp so existe entre o fim da abertura e o inicio do contato: antes
   disso ele disputaria com a acao principal, e dentro do contato ele repetiria o
   formulario que ja esta na tela.
   O alvo do topo e a acao do hero na home e o titulo nas internas -- o que garante que
   ele funcione nas 19 paginas, e nao so aqui. Dois observers, e nenhum listener de scroll. */
function configurarAtalho() {
  const atalho = document.querySelector('[data-atalho]');
  if (!atalho) return;

  const topo = document.querySelector('.ficha-acao') || document.querySelector('main h1') || document.querySelector('h1');
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

/* Popup bloqueado devolve null. Sem esta saida o visitante preenche o formulario
   inteiro, toca em enviar e nao acontece nada. */
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

    /* O evento so dispara depois de saber se a janela abriu. Disparar antes conta
       conversa que nao aconteceu, e depois conta a mesma pessoa duas vezes. */
    if (janela) registrarConversa('formulario');
    else saidaManual(formulario, url);
  });
}

/* O que a pessoa pode acionar no primeiro segundo entra agora: o tema, o fio do header
   e o formulario. O resto -- o atalho, que so aparece depois do hero, a medicao e o ano
   do rodape -- espera a linha principal esvaziar. Sao 60ms de TBT em CPU de celular. */
function iniciar() {
  fioDoHeader();
  configurarTema();
  configurarFormulario();

  const depois = () => { configurarAtalho(); medirSaidas(); marcarAno(); };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(depois, { timeout: 2000 });
  else setTimeout(depois, 200);
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar);
else iniciar();
