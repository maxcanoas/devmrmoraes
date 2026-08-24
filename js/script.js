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
    if (!pedido.value.trim()) { erroNoCampo(pedido, 'Escreva o que voce precisa, mesmo que em uma linha.'); pedido.focus(); return; }

    const texto = 'Ola! Meu nome e ' + nome.value.trim() + '. ' + pedido.value.trim();
    const url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto);
    const janela = open(url, '_blank');

    /* O evento so dispara depois de saber se a janela abriu. Disparar antes conta
       conversa que nao aconteceu, e depois conta a mesma pessoa duas vezes. */
    if (janela) registrarConversa('formulario');
    else saidaManual(formulario, url);
  });
}

function iniciar() {
  marcarAno();
  fioDoHeader();
  configurarFormulario();
  medirSaidas();
}

if (document.readyState === 'loading') addEventListener('DOMContentLoaded', iniciar);
else iniciar();
