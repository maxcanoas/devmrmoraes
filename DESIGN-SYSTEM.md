# Sistema de design — devmrmoraes.com.br

Direção **O número**, aplicada na home em 03/09/2026. Este documento é o que basta para
reproduzir o visual nas páginas internas sem reabrir o `index.html`.

**A tese.** O site é a proposta comercial aberta em cima da mesa, e a primeira coisa que
se lê é o preço, porque nenhum concorrente publica o dele. O preço em manchete é o único
lugar onde a página levanta a voz; todo o resto é grotesca em corpo modesto e muito ar.
Ao aplicar isto numa página interna, a pergunta é sempre: **qual é o número desta página?**
Na de criação de sites é o preço de entrada; na de SEO é o prazo; num case é o resultado.
Só um por página, e ele usa `.numero`.

---

## Tokens

Todos vivem em `:root` no topo de `css/style.css`. **Nunca escreva um hex fora de lá.**
Os mesmos nomes servem os dois temas: quem pinta é o valor, não o seletor, e por isso
nenhuma regra do arquivo precisa saber em que tema está.

| Token | Claro | Escuro | Para que serve |
|---|---|---|---|
| `--folha` | `#FFFFFF` | `#0F1216` | fundo da página |
| `--via-2` | `#EDF0F2` | `#171C22` | fundo de um degrau (bloco alternado) |
| `--impresso` | `#CFD7DD` | `#2D353D` | o fio de 1px, estrutural |
| `--grafite` | `#0F1216` | `#F0F2F4` | texto principal |
| `--grafite-2` | `#565F69` | `#98A1AA` | texto secundário, rótulo |
| `--caneta` | `#1B3A8C` | `#8AAAF0` | o acento: valor, link, botão, carimbo |
| `--inverso` | `#0F1216` | `#232931` | fundo do bloco invertido |
| `--inverso-texto` | `#FFFFFF` | `#FFFFFF` | texto sobre o bloco invertido |
| `--sobre` | `#C2C8CE` | `#B6BEC7` | secundário dentro do bloco invertido |
| `--impresso-2` | `#2A2F36` | `#39424C` | fio dentro do bloco invertido |
| `--caneta-2` | `#7FA6E8` | `#A9C2F7` | acento dentro do bloco invertido |
| `--vidro` | `rgb(255 255 255 / .72)` | `rgb(15 18 22 / .72)` | fundo do header e do atalho |

O acento é **azul de esferográfica**: é o que foi preenchido à mão, não a cor da marca.
Ele entra em valor, link, botão primário e carimbo. Nunca em fundo de seção, nunca em
título. No bloco invertido ele reprova contraste e vira `--caneta-2`.

**No tema escuro o bloco invertido sobe um degrau em vez de descer** (`#232931` sobre
`#0F1216`), senão sumiria dentro do próprio fundo. A cadência entre os cases se mantém.

Contraste verificado: o par mais fraco de todo o sistema é `--caneta` sobre `--via-2` no
tema claro, em 9,1:1. Todos os outros passam com folga. Ao criar um par novo, meça.

### Espaçamento e forma

```
--e-1 0.25rem   --e-2 0.5rem   --e-3 1rem
--e-4 1.5rem    --e-5 3rem     --e-6 6rem
--raio 2px      --dur 140ms    --dur-2 320ms
```

`--raio: 2px` é deliberado: zero fazia a página parecer impressa, que era a direção
anterior. Dois pixels tiram isso sem virar cartão arredondado.

---

## Tipografia

Duas famílias, quatro arquivos `.woff2` em `fonts/`, self-hosted. **Nunca adicionar uma
terceira**: o gate reprova Google Fonts e o orçamento não comporta.

- **Familjen Grotesk** (variável 400–700) — prosa, título, botão. Grotesca escandinava de
  terminais cortados em ângulo, que lê como texto e não como interface.
- **IBM Plex Mono** (400–600) — o dado: valor, prazo, domínio, telefone, rótulo. É a
  tipografia do relatório e da nota fiscal, e no hero ela sobe a corpo de manchete.
- **Grotesk Substituta** — fallback com métricas casadas (`size-adjust: 93.4%`), medido com
  fontkit sobre os próprios binários. Sem ele o reflow custa CLS em CPU lenta, que é o
  aparelho de quem visita este site. Se trocar a fonte de corpo, **remeça**.

Só o subset `latin` é baixado na prática; o `latin-ext` existe para o caractere raro.
Preload de ambas as `latin` em `partials/head-assets.html`.

### Escala

```
--t--1  0.8125rem                        rótulo, mono, nota de rodapé
--t-0   1.0625rem                        corpo
--t-1   1.3125rem                        h3, nome no retrato
--t-2   1.625rem                         h3 de case
--t-3   clamp(1.6rem, 5.2vw, 2.125rem)   h2
--t-4   clamp(1.9rem, 6.4vw, 2.875rem)   h1, h2 no desktop
--t-5   clamp(3.25rem, 13vw, 6.5rem)     o preço, e só ele
```

`--t-5` é reservado ao `.numero`. Se aparecer em dois lugares na mesma página, um dos dois
está errado.

---

## Componentes

Os que a home usa e as internas herdam. Todos já existem em `css/style.css`.

| Classe | O que é |
|---|---|
| `.container` | 1200px, `padding-inline: max(5vw, 1.25rem)` |
| `.grade` | 12 colunas; `.col-3`…`.col-9` e `.inicio-7`…`.inicio-9` só a partir de 48em |
| `.botao` / `.botao-compacto` / `.botao-claro` | ação; `.botao-claro` é para dentro do bloco invertido |
| `.campo` | rótulo + valor com fio de 1px. O trilho de rótulos aparece por **container query** (`@container (min-width: 34rem)`), não por media query |
| `.rotulo` | mono, caixa alta, `0.08em`. Nomeia o campo, nunca responde por ele |
| `.valor` | mono grande em `--caneta`. O que foi preenchido |
| `.numero` | o preço em manchete. `--t-5`, `letter-spacing: -0.07em`, `word-spacing: -0.32em` — os dois medidos no navegador; mais apertado que isso o cifrão encosta no 1 |
| `.eixo` | o fio de 2px sob o H1. **Um por página**, e ele se desenha na entrada |
| `.retrato` | foto 4:5 + nome + função + cidade |
| `.carimbo` | `Entregue` / `Em aberto`. O único ornamento, e carrega informação |
| `.ato` / `.ato-escuro` / `.ato-via-2` | cada case é um ato, com fundo próprio; a troca dá a cadência |
| `.anexo` | o print com fio e o domínio real acima, em mono |
| `.resultado-bloco` / `.resultado-manchete` | a frase mais valiosa da página |
| `.lista-servicos` | nome à esquerda, explicação à direita, fio entre. `.destaque` para os carros-chefe |
| `.atalho` | o botão flutuante de WhatsApp, em vidro |
| `.tema` | o botão de tema no header |

---

## Movimento

**Quatro momentos, e cada um tem um motivo.** Tudo em CSS: `animation-timeline: view()` e
`position: sticky`. Não há GSAP, não há ScrollTrigger e não há scroll suave por JS — os
três somariam ~40 KB gzip para fazer o que o navegador já faz, e o scroll por JS é o que
mais custa INP.

1. **A entrada do hero** (~600 ms, uma vez). O eixo se desenha da esquerda e a oferta sobe
   atrás dele. O `.numero` sobe **sem animar opacity**: ele é candidato a maior elemento da
   primeira tela, e começar invisível adiaria o LCP pelo tempo inteiro da animação.
2. **O header vira vidro** ao rolar, pela classe `.rolado` que o JS aplica.
3. **O parallax do print**, só no desktop: a imagem é 4% maior que o quadro e desliza dentro
   dele. Mais que 4% come o topo do print, que é onde mora o logo do cliente.
4. **O pin dos compromissos**: o título fica preso na coluna da esquerda enquanto os três
   passam pela direita. É o único bloco que é sequência de verdade, e por isso o único
   numerado do site.

### Regras que não se quebram

- **Nunca animar `opacity` de texto.** O axe mede o contraste no meio do caminho e reprova:
  um texto a 25% de opacidade dá 1,6:1 enquanto a animação roda. Use só `translate`.
- Toda `animation` vive dentro de `@media (prefers-reduced-motion: no-preference)`, e o
  bloco `reduce` no fim do arquivo zera tudo. **O site tem que ficar completo e bonito parado.**
- Vidro em no máximo **dois elementos** (header e atalho). O gate reprova acima de 5
  ocorrências de `backdrop-filter` — que são esses dois, cada um com o par `-webkit-`, mais
  a detecção de suporte. Sempre com fallback opaco via `@supports not`.
- Um único breakpoint de layout: `48em`. O resto responde por container query ou clamp.

---

## Como trocar a foto

O arquivo é `img/maxwell-rigo-moraes.webp`, com `img/maxwell-rigo-moraes.jpg` de fallback.

- **Proporção 4:5**, mínimo **1200 × 1500 px**. A atual tem 560 × 700 e já fica no limite
  em tela retina: no desktop ela é exibida com 272 px de largura, o que dá 1,47× de
  densidade. Com 1200 px de largura sobra folga para qualquer tela.
- Salve as duas versões com o mesmo nome e a mesma proporção. O `width`/`height` no HTML
  reserva a altura antes do byte chegar — **atualize os dois** se a proporção mudar, senão
  o CLS sai de zero.
- O recorte de exibição é `object-position: center 18%`: o rosto fica no terço superior.

**Ao fotografar:**

- Enquadramento de meio-corpo, do peito para cima, com o olhar na câmera. O recorte 4:5
  corta pelos ombros no mobile.
- Deixe **espaço acima da cabeça** (uns 10% da altura). Sem ele o `object-position` corta
  o topo do cabelo quando a foto encolhe.
- Luz vindo de um lado só, suave. Luz frontal chapada apaga o volume do rosto e a foto
  fica com cara de documento.
- Fundo neutro e liso, claro ou escuro — **não** precisa recortar. O CSS não depende de
  fundo removido: a foto entra num quadro com fio de 1px e funciona dos dois jeitos.
- Evite: camisa com estampa ou listra fina (mói na compressão), fundo com textura forte,
  e qualquer coisa que peça retoque para ficar apresentável.

---

## Orçamento

Medido no Lighthouse mobile, com gzip, em `index.html`.

| Item | Teto | Hoje |
|---|---|---|
| CSS | 45.000 B bruto | 38.780 B (11.497 B gzip) |
| JS de runtime | — | 6.483 B (2.502 B gzip) |
| Fontes carregadas | 2 famílias, 4 arquivos | 33.624 B (só os subsets `latin`) |
| Performance mobile | ≥ 90 | 97 |
| LCP | < 2,5 s | 1,66 s |
| CLS | < 0,1 | 0 |

**Se um efeito novo não couber, corte o efeito — não aumente o teto.**

---

## O gate

`node tools/verificar.js` roda antes de qualquer commit e reprova:

- gradiente, `box-shadow`, `filter: blur`, `transition: all`, `!important`,
  `-webkit-text-stroke`, `background-clip: text`, Google Fonts, `style=` inline;
- mais de 5 ocorrências de `backdrop-filter`;
- famílias de clichê (Inter, Poppins, DM Sans, Space Grotesk, Satoshi e companhia);
- âncora que não aterrissa, `href` que não resolve, link `wa.me` sem `data-origem`,
  mais de um `<h1>`, `<head>` divergindo de `tools/head-referencia.json`, e FAQ que não
  bate com o `FAQPage` do JSON-LD.

Ordem de trabalho: editar → `node tools/sync-partials.js` → `node tools/sync-faq.js` →
`node tools/verificar.js`.

---

## Ao aplicar numa página interna (Fase 2)

1. **Ache o número da página** e dê a ele o `.numero` e o `.eixo` logo acima. Um só.
2. O H1 continua em `--t-4` e o eixo fecha a declaração.
3. Reuse `.campo`, `.rotulo` e `.valor` para qualquer par nome/dado. Não invente componente
   novo antes de olhar a tabela acima.
4. Blocos invertidos usam `--inverso` de fundo e `--inverso-texto` de texto. **Nunca**
   `--grafite` e `--folha` fixos: no tema escuro eles invertem e o bloco some.
5. Se a página ganhar movimento, ele entra na lista dos quatro momentos ou substitui um.
   Não acumule.
