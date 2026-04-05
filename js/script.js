/* ============================================================
   DEVMRMORAES — JavaScript principal
   Todos os métodos e variáveis em português
   ============================================================ */

'use strict';

/* ─── Loader ─── */
const loader = document.getElementById('loader');
const barraProgresso = document.querySelector('.loader-barra-progresso');
const textoPercentual = document.querySelector('.loader-percentual');

let progresso = 0;
let intervaloLoader;

function iniciarLoader() {
  intervaloLoader = setInterval(() => {
    const incremento = progresso < 50 ? Math.random() * 18 + 8 :
                       progresso < 80 ? Math.random() * 12 + 5 :
                       Math.random() * 6 + 3;

    progresso = Math.min(progresso + incremento, 98);
    barraProgresso.style.width = progresso + '%';
    textoPercentual.textContent = Math.floor(progresso) + '%';

    if (progresso >= 98) {
      clearInterval(intervaloLoader);
      setTimeout(concluirLoader, 150);
    }
  }, 35);
}

function concluirLoader() {
  barraProgresso.style.width = '100%';
  textoPercentual.textContent = '100%';

  setTimeout(() => {
    loader.classList.add('oculto');
    document.body.style.overflow = 'auto';
    ativarAnimacoesHero();
  }, 250);
}


/* ─── Navegação com scroll ─── */
const navegacao = document.getElementById('navegacao');

function controlarNavegacao() {
  if (window.scrollY > 60) {
    navegacao.classList.add('rolada');
  } else {
    navegacao.classList.remove('rolada');
  }
}

/* ─── Menu mobile ─── */
const botaoMenu = document.querySelector('.nav-menu-toggle');
const linksNav = document.querySelector('.nav-links');

function alternarMenu() {
  linksNav.classList.toggle('aberto');
  const estaAberto = linksNav.classList.contains('aberto');
  document.body.style.overflow = estaAberto ? 'hidden' : '';

  botaoMenu.setAttribute('aria-expanded', estaAberto);

  /* Animar linhas do hamburger */
  const linhas = botaoMenu.querySelectorAll('span');
  if (estaAberto) {
    linhas[0].style.transform = 'translateY(6.5px) rotate(45deg)';
    linhas[1].style.opacity = '0';
    linhas[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    linhas[0].style.transform = '';
    linhas[1].style.opacity = '';
    linhas[2].style.transform = '';
  }
}

function fecharMenuAoClicar() {
  const itensMenu = document.querySelectorAll('.nav-links a');
  itensMenu.forEach(item => {
    item.addEventListener('click', () => {
      linksNav.classList.remove('aberto');
      document.body.style.overflow = '';
      const linhas = botaoMenu.querySelectorAll('span');
      linhas[0].style.transform = '';
      linhas[1].style.opacity = '';
      linhas[2].style.transform = '';
    });
  });
}

/* ─── Parallax texto fantasma MAX ─── */
const textoFantasma = document.querySelector('.hero-texto-fantasma');
let offsetParallaxX = 0, offsetParallaxY = 0;
let animandoParallax = false;

function moverParallax(e) {
  if (!textoFantasma) return;

  const centroX = window.innerWidth / 2;
  const centroY = window.innerHeight / 2;

  const movX = ((e.clientX - centroX) / centroX) * 18;
  const movY = ((e.clientY - centroY) / centroY) * 10;

  offsetParallaxX += (movX - offsetParallaxX) * 0.06;
  offsetParallaxY += (movY - offsetParallaxY) * 0.06;

  if (!animandoParallax) {
    animandoParallax = true;
    requestAnimationFrame(aplicarParallax);
  }
}

function aplicarParallax() {
  textoFantasma.style.transform = `translate(calc(-50% + ${offsetParallaxX}px), calc(-50% + ${offsetParallaxY}px))`;
  animandoParallax = false;
}

/* ─── Animações de entrada com IntersectionObserver ─── */
function configurarAnimacoesEntrada() {
  const opcoesObserver = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      }
    });
  }, opcoesObserver);

  const elementosParaAnimar = document.querySelectorAll('.animar-entrada');
  elementosParaAnimar.forEach(el => {
    el.classList.add('animar-preparado');
    observador.observe(el);
  });
}

/* ─── Animações do hero ─── */
function ativarAnimacoesHero() {
  const elementosHero = document.querySelectorAll('#hero .animar-entrada');
  elementosHero.forEach((el, indice) => {
    setTimeout(() => {
      el.classList.add('visivel');
    }, indice * 120);
  });
}

/* ─── Filtros do portfólio ─── */
function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll('.filtro-botao');
  const cardsPortfolio = document.querySelectorAll('.card-projeto');

  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      const categoriaFiltro = botao.dataset.filtro;

      /* Atualizar estado ativo */
      botoesFiltro.forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');

      /* Filtrar projetos */
      cardsPortfolio.forEach(card => {
        const categoriaCard = card.dataset.categoria;

        if (categoriaFiltro === 'todos' || categoriaCard === categoriaFiltro) {
          card.style.opacity = '1';
          card.style.transform = 'scale(1)';
          card.style.display = 'block';
        } else {
          card.style.opacity = '0.2';
          card.style.transform = 'scale(0.97)';
        }
      });
    });
  });
}

/* ─── Formulário de contato ─── */
function configurarFormulario() {
  const formulario = document.getElementById('formulario-contato');
  if (!formulario) return;

  /* Remover erro ao digitar */
  formulario.querySelectorAll('.campo-input, .campo-textarea').forEach(campo => {
    campo.addEventListener('input', () => {
      campo.classList.remove('campo-erro');
      const msgErro = campo.parentElement.querySelector('.campo-erro-msg');
      if (msgErro) msgErro.remove();
    });
  });

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const campoNome = formulario.querySelector('#campo-nome');
    const campoMensagem = formulario.querySelector('#campo-mensagem');
    const campoEmpresa = formulario.querySelector('#campo-empresa');

    /* Limpar erros anteriores */
    formulario.querySelectorAll('.campo-erro').forEach(el => el.classList.remove('campo-erro'));
    formulario.querySelectorAll('.campo-erro-msg').forEach(el => el.remove());

    let valido = true;

    if (!campoNome.value.trim()) {
      mostrarErroCampo(campoNome, 'Informe seu nome para que possamos te chamar.');
      valido = false;
    }

    if (!campoMensagem.value.trim()) {
      mostrarErroCampo(campoMensagem, 'Descreva brevemente o que você precisa.');
      valido = false;
    }

    if (!valido) return;

    const nome = campoNome.value.trim();
    const mensagem = campoMensagem.value.trim();
    const empresa = campoEmpresa.value.trim();
    const assunto = formulario.querySelector('#campo-assunto');
    const tipoTexto = assunto && assunto.value ? assunto.options[assunto.selectedIndex].text : '';

    /* Montar mensagem para WhatsApp */
    const textoWhatsApp = encodeURIComponent(
      `Olá! Meu nome é ${nome}${empresa ? ` da empresa ${empresa}` : ''}.${tipoTexto ? ` Tipo de projeto: ${tipoTexto}.` : ''} ${mensagem}`
    );

    /* TODO: Trocar pelo número real de WhatsApp */
    const urlWhatsApp = `https://wa.me/5551999608608?text=${textoWhatsApp}`;
    window.open(urlWhatsApp, '_blank');
  });
}

function mostrarErroCampo(campo, mensagem) {
  campo.classList.add('campo-erro');
  const msg = document.createElement('p');
  msg.className = 'campo-erro-msg';
  msg.textContent = mensagem;
  campo.parentElement.appendChild(msg);
  if (!document.querySelector('.campo-erro:first-of-type')) campo.focus();
}

/* ─── Botão WhatsApp flutuante ─── */
function criarBotaoWhatsApp() {
  const botaoWpp = document.createElement('a');
  botaoWpp.href = 'https://wa.me/5551999608608?text=Olá!%20Gostaria%20de%20solicitar%20um%20orçamento.';
  botaoWpp.target = '_blank';
  botaoWpp.rel = 'noopener noreferrer';
  botaoWpp.className = 'botao-whatsapp-flutuante';
  botaoWpp.setAttribute('aria-label', 'Conversar no WhatsApp');
  botaoWpp.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  `;

  document.body.appendChild(botaoWpp);
}

/* ─── Animação de contagem dos números ─── */
function animarContadores() {
  const contadores = document.querySelectorAll('.stat-numero[data-meta]');

  const observadorContador = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
      if (!entrada.isIntersecting) return;

      const elemento = entrada.target;
      const meta = parseInt(elemento.dataset.meta);
      const sufixo = elemento.dataset.sufixo || '';
      let atual = 0;
      const duracao = 1800;
      const passos = 60;
      const incremento = meta / passos;
      const intervalo = duracao / passos;

      const timer = setInterval(() => {
        atual = Math.min(atual + incremento, meta);
        elemento.querySelector('.numero-valor').textContent = Math.floor(atual) + sufixo;

        if (atual >= meta) clearInterval(timer);
      }, intervalo);

      observadorContador.unobserve(elemento);
    });
  }, { threshold: 0.5 });

  contadores.forEach(el => observadorContador.observe(el));
}

/* ─── Scroll suave para âncoras ─── */
function configurarScrollSuave() {
  const linksAncora = document.querySelectorAll('a[href^="#"]');

  linksAncora.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;

      const destino = document.querySelector(href);
      if (!destino) return;

      e.preventDefault();

      const offsetTopo = destino.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTopo, behavior: 'smooth' });
    });
  });
}

/* ─── Inicialização geral ─── */
function inicializar() {
  /* Bloquear scroll durante loader */
  document.body.style.overflow = 'hidden';

  iniciarLoader();
  configurarAnimacoesEntrada();
  configurarFiltros();
  configurarFormulario();
  configurarScrollSuave();
  criarBotaoWhatsApp();
  animarContadores();

  /* Eventos de scroll e mouse */
  window.addEventListener('scroll', controlarNavegacao, { passive: true });
  document.addEventListener('mousemove', moverParallax);
  botaoMenu.addEventListener('click', alternarMenu);
  fecharMenuAoClicar();

  /* Fechar menu ao clicar no fundo do overlay */
  linksNav.addEventListener('click', (e) => {
    if (e.target === linksNav) {
      alternarMenu();
    }
  });

  /* Fechar menu com tecla Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && linksNav.classList.contains('aberto')) {
      alternarMenu();
    }
  });
}

/* ─── Aguardar DOM carregado ─── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}