# Sistema de design: devmrmoraes.com.br

Direção **A virada**, aplicada nas 18 páginas em 05/09/2026. Este documento é o que basta para
reproduzir o visual numa página nova sem reabrir o `index.html`.

**A tese.** Todo serviço do site transforma uma situação em outra: a empresa sem site passa a
existir no Google, o site invisível passa a ser encontrado, o relatório feito à mão sai da
planilha. A copy já contava cada case assim (situação encontrada, o que eu fiz, resultado). O
visual conta a mesma história com um elemento só, **a linha da virada**: um traço de 3 px em
cobalto que separa o antes do depois. Ela se desenha na abertura, varre cada print, sublinha o
H1 das internas, passa por baixo do botão no hover e empurra o breu para fora da tela de contato.

Um gesto, repetido com sentido, em vez de dez efeitos espalhados.

---

## As seis cores

| Nome | Hex | Papel |
|---|---|---|
| **Breu** | `#0A0C14` | o fundo, preto azulado |
| **Sombra** | `#141830` | o degrau acima do breu: seção alternada, quadro do print, campo |
| **Luz** | `#F4F5F9` | texto principal, e o fundo do tema claro |
| **Névoa** | `#9AA1B8` | texto secundário, e a cor do "antes" |
| **Cobalto** | `#2A4BFF` | a dominante: a linha, o botão, a ação |
| **Âmbar** | `#FFB324` | o apoio: só o resultado, a marca dos carros-chefe e a tela de contato |

A cor carrega informação, não decoração: **névoa é o antes, cobalto é a ação, âmbar é o
resultado.** Cobalto puro dá 3,4:1 sobre breu e por isso só pinta forma e fundo; como texto ele
sobe para **Cobalto-claro** `#8FA5FF` (8,4:1). Âmbar nunca é texto sobre fundo claro: no tema
claro o resultado escreve em `#8C5A00` (5,5:1 sobre luz).

### Tokens

Todos vivem em `:root` no topo de `css/style.css` e têm nome de papel, não de cor. É assim que o
tema claro (`[data-tema='claro']`) troca os valores sem que nenhuma regra precise saber em que
tema está. **Nunca escreva um hex fora do `:root`.**

| Token | Escuro | Claro | Para que serve |
|---|---|---|---|
| `--fundo` | Breu | Luz | fundo da página |
| `--fundo-2` | Sombra | `#E6E8F0` | degrau, quadro, campo |
| `--fio` | `#262B45` | `#CDD1DE` | o fio de 1px: FAQ, tabela, rodapé, campo |
| `--texto` | Luz | Breu | texto principal |
| `--texto-2` | Névoa | `#5B6275` | secundário, rótulo, o antes |
| `--acao` | Cobalto | Cobalto | a linha, o botão, a forma |
| `--acao-texto` | Cobalto-claro | Cobalto | link, rótulo de tempo, número de etapa |
| `--sobre-acao` | branco | branco | texto sobre cobalto |
| `--resultado` | Âmbar | Âmbar | a linha do resultado, o quadrado do carro-chefe, o fundo do contato |
| `--resultado-texto` | Âmbar | `#8C5A00` | a manchete de resultado |
| `--sobre-resultado` | Breu | Breu | texto sobre âmbar |
| `--vidro` | breu a 74% | luz a 78% | header rolado e atalho |

O site é **escuro por padrão**. O claro é a saída de quem lê no sol: só a escolha "claro" é
salva em `localStorage` e aplicada pelo script inline do `<head>` antes do primeiro paint.

Contrastes medidos: luz/breu 18:1, névoa/breu 7,5:1, cobalto-claro/breu 8,4:1, âmbar/breu e
breu/âmbar 10,9:1, luz/cobalto 5,8:1. Ao criar um par novo, meça.

### Espaço e forma

```
--e-1 0.25rem   --e-2 0.5rem   --e-3 1rem    --e-4 1.5rem
--e-5 3rem      --e-6 6rem     --e-7 9rem
--raio 3px      --dur 160ms    --dur-2 400ms   --curva cubic-bezier(0.22, 1, 0.36, 1)
```

Seção respira `--e-5` no celular e `--e-6` no desktop. Grade de 12 colunas, container 1200px,
margem `max(5vw, 1.25rem)`, um breakpoint de layout em `48em`; o resto responde por container
query e clamp.

---

## Tipografia

Duas famílias, quatro arquivos `.woff2` em `fonts/`, self-hosted. **Nunca adicionar uma
terceira**: o gate reprova Google Fonts e o orçamento não comporta. Não há mono: ela era a voz
do "documento", a direção anterior.

- **Gabarito** (variável 400 a 900, Naipe Foundry, Brasil): a voz de cartaz. H1, H2, título de
  cena, a frase do antes, o resultado, o nome do serviço na lista, o dado da capa. Pesos 700 a 900,
  `line-height` de 0.95 a 1.05, `letter-spacing: -0.03em`.
- **Golos Text** (variável 400 a 900, Paratype): a voz de leitura. Corpo, lista, formulário,
  rótulo, número. Pesos 400 a 600. Rótulos em caixa alta com `letter-spacing: 0.06em`; números com
  `tabular-nums`.
- **Substitutas** com métricas casadas, medidas com fontkit sobre os binários (05/09/2026):
  Golos é 6,3% mais larga que a Arial (`size-adjust: 106.3%`); Gabarito 900 é 5,6% mais estreita
  que a Arial Bold (`94.4%`). **As duas levam `font-display: optional`**, e isso não é opcional:
  o Chrome resolve `local()` por uma tabela de nomes montada de forma assíncrona, e num perfil
  recém-aberto a busca segurava o texto invisível por até 2,3 s (LCP 4,3 s). Com `optional`, o
  texto sai em Arial comum se a face local não responde em 100 ms. A trava só se reproduz dentro
  do Lighthouse no Windows (1 em cada 4 ou 5 rodadas); em 24 rodadas de Chrome novo com CPU 4x
  ela não aconteceu, então as substitutas ficam. Se trocar de fonte, remeça.

Só o subset `latin` é baixado na prática (72 KB pelas duas); o `latin-ext` existe para o caractere
raro. Preload das duas `latin` em `partials/head-assets.html`.

### Escala

```
--t--1  0.8125rem                          rótulo, legenda, nota
--t-0   1.0625rem                          corpo
--t-1   1.25rem                            h3, telefone da abertura, compromisso
--t-2   1.625rem                           nome de serviço, resultado no celular
--t-3   clamp(1.75rem, 3.2vw, 2.5rem)      h2, o antes fora do palco, telefone do contato
--t-4   clamp(2.25rem, 5vw, 4rem)          h2 no desktop, título de cena, o antes no palco
--t-5   clamp(2.6rem, 6vw, 5rem)           H1
```

---

## Componentes

Todos já existem em `css/style.css`. Antes de inventar um, olhe aqui.

| Classe | O que é |
|---|---|
| `.container`, `.grade`, `.col-3`…`.col-9`, `.inicio-7`…`.inicio-9`, `.fluxo` | grade e ritmo |
| `.virada` / `.eixo` | **a linha da virada** de 3px. Uma por página, sob o H1, e ela se desenha na entrada |
| `.rotulo` | Golos 600, caixa alta, `0.06em`. Nomeia o campo, nunca responde por ele |
| `.mono` | dado curto nas internas: Golos 500 com números tabulares |
| `.campo` | rótulo em cima, resposta embaixo; trilho de 8rem ao lado a partir de 34rem de container |
| `.botao`, `.botao-compacto`, `.botao-claro` | ação. No hover a linha passa por baixo do rótulo, em âmbar |
| `.abertura`, `.abertura-grade`, `.indice`, `.indice-lista`, `.chefe`, `.retrato`, `.abertura-acao`, `.fone` | a primeira tela da home |
| `.cena`, `.cena-esquerda` / `.cena-direita` / `.cena-cima`, `.cena-palco`, `.cena-grade`, `.antes`, `.depois` | um case como cena presa (ver Movimento) |
| `.anexo`, `.anexo-quadro`, `.anexo-mascara`, `.anexo-rotulo` | o print dentro do quadro que a linha revela |
| `.resultado` / `.resultado-bloco`, `.resultado-manchete` | a frase mais valiosa da página, em âmbar, com a linha em cima |
| `.os-cabecalho`, `.carimbo` | cliente e serviço, e o carimbo `Entregue` / `Exercício` |
| `.lista-servicos`, `.chefe`, `.apagado` | a lista de serviços; o quadrado âmbar marca os carros-chefe; `.apagado` é o JS acendendo os nomes |
| `.processo`, `.compromissos`, `.quando` | sequência de tempo de verdade, com rótulo (`Antes`, `Na proposta`, `Depois`) ou número de etapa |
| `.perguntas`, `.lista-perguntas` | FAQ em `<details>`, o único bloco quieto |
| `.contato` / `.fechamento`, `.contato-varredura` | a tela em âmbar; a varredura é o breu que a linha empurra para fora (só na home) |
| `.capa`, `.capa-grade`, `.capa-oferta`, `.numero`, `.valor`, `.capa-linha`, `.capa-credito`, `.trilha` | a abertura das internas |
| `.case`, `.case-invertido`, `.case-texto` | o case fora do palco, print a 62% |
| `.cenarios`, `.conversa`, `.acoes`, `.lista-pratica`, `.aviso`, `.par-figuras`, `.prosa`, `.lista-artigos` | miolos das internas |
| `.atalho`, `.tema`, `.pular` | o atalho de WhatsApp em vidro, o botão de tema, o link de pular |

---

## Movimento

GSAP 3.15 + ScrollTrigger, self-hosted em `js/vendor/` (117 KB brutos, 46 KB gzip), carregados
por `js/script.js` **depois do evento `load`**, em prioridade baixa e em ordem. Nada da primeira
tela depende deles. Rolagem nativa, sem Lenis. Só `transform` anima; **texto nunca perde
opacidade**, porque o axe mede o contraste no meio do caminho.

**Tudo nasce no estado final no CSS.** Sem JS, sem vendor ou com `prefers-reduced-motion:
reduce`, a página é o "depois" inteiro: linha desenhada, print à vista, resultado à vista.

`gsap.matchMedia()` separa três mundos:

| Mundo | Condição | O que acontece |
|---|---|---|
| reduzido | `prefers-reduced-motion: reduce` | nada registra |
| preso | `(min-width: 48em) and (min-height: 43.75em)` | cada `.cena` prende o palco por 110% de rolagem: a linha varre o print, o antes sai por cima, o depois entra por baixo, o resultado carimba; serviços acendem; compromissos entram; o contato é varrido |
| leve | o resto | sem pin; a linha revela o print uma vez, quando ele entra na tela; serviços acendem; compromissos entram |

A revelação usa dois contêineres com translações opostas (`.anexo-mascara` e o `picture`
dentro dela), que roda no compositor. Nunca `clip-path` animado por scroll.

A entrada da home é CSS puro, para não depender do vendor: a linha se desenha (600 ms), o
índice acende em cascata (cor, nunca opacidade), a ação sobe 14 px. O H1 nunca fica escondido:
ele é o LCP.

### Regras que não se quebram

- Um `.cena` só na home. Nas internas o print revela na entrada e não prende.
- O palco só prende com 700 px de altura de tela; abaixo disso, ou com menos movimento, o antes
  fica em cima do depois e os dois se leem.
- Vidro em no máximo dois elementos (header rolado e atalho). O gate reprova acima de 5
  `backdrop-filter`.
- Página pré-renderizada por speculation rules espera `prerenderingchange` antes de medir.

---

## A abertura das páginas internas

Toda capa é **trilha, H1, a linha da virada, e o que a pessoa veio buscar**. Três formas:

- **Com número** (`.capa-oferta` + `.numero`): preço ou prazo curto, em Gabarito 800. Criação de
  sites (`R$ 1.989`), sistemas, Perfil no Google, apps, suporte.
- **Com resultado** (`.capa-oferta` + `.resultado-manchete`): nos cases, em âmbar.
- **Tipográfica**: a frase de escopo assume em `--t-2` e o botão vai para a direita na mesma
  linha de base. SEO, automação, consultoria, listagens, artigos.

**Onde não há dado, não invente um.** O miolo usa `.campo`, `.cenarios`, `.case`, `.processo`
(a única sequência numerada) e `.prosa`. Toda página fecha em `.fechamento`, em âmbar.

---

## A foto

`img/maxwell-rigo-moraes.webp` com `.jpg` de fallback, 560×700. Inteira, em preto e branco
(`filter: grayscale(1) contrast(1.04)`), abaixo da linha e ao lado do índice: presente, sem
cor e sem corte, para não virar a âncora da página. Decisão do Max em 05/09/2026, depois de ver
a versão cortada pela linha. Se uma foto nova chegar (4:5, mínimo 1200×1500, olhar na câmera,
espaço acima da cabeça), ela entra no mesmo lugar.

### O card de compartilhamento

`img/og-image.png` (1200×630) é gerado de `tools/og-card.html`, que usa os tokens e as fontes
do site: breu, a chamada em Gabarito, a linha em cobalto, o retrato em preto e branco e os cinco
carros-chefe. Sirva o repositório num servidor local, capture em 1200×630 sem escala e comprima
com paleta (`sharp(...).png({ quality: 90, palette: true })`). **Fique abaixo de 300 KB**.

---

## Orçamento

Medido em 05/09/2026, Lighthouse mobile, três rodadas seguidas e sozinho (outro Chrome aberto
em paralelo derruba a nota por disputa de CPU).

| Item | Teto | Hoje |
|---|---|---|
| CSS bruto | 60.000 B | 36.427 B |
| `js/script.js` | 12.000 B | 11.404 B |
| `js/vendor/` somado | 130.000 B | 117.502 B (46 KB gzip, depois do load) |
| Fontes carregadas | 90 KB | 72 KB |
| Home completa | 500 KB | 437 KB |
| Performance mobile | ≥ 90 | 98, 97, 98 |
| LCP / CLS / TBT | ≤ 2,5 s / 0 / verde | 1,9 s / 0 / 140 a 180 ms |
| Acessibilidade / Boas práticas / SEO | 100 | 100 / 100 / 100 |

**Se um efeito novo não couber, corte o efeito, não aumente o teto.**

---

## O gate

`node tools/verificar.js` roda antes de qualquer commit e reprova:

- gradiente, `box-shadow`, `filter: blur`, `transition: all`, `!important`,
  `-webkit-text-stroke`, `background-clip: text`, Google Fonts, `style=` inline;
- mais de 5 ocorrências de `backdrop-filter`;
- CSS acima de 60.000 B, `js/script.js` acima de 12.000 B, `js/vendor/` acima de 130.000 B;
- famílias de clichê (Inter, Poppins, DM Sans, Space Grotesk, Satoshi e companhia);
- âncora que não aterrissa, `href` que não resolve, link `wa.me` sem `data-origem`, mais de um
  `<h1>`, `<head>` divergindo de `tools/head-referencia.json`, FAQ que não bate com o `FAQPage`.

Página `noindex` (`404.html`, `artigos/_modelo.html`) dispensa canonical, card e JSON-LD.

Ordem de trabalho: editar → `node tools/sync-partials.js` → `node tools/sync-faq.js` →
`node tools/verificar.js`.

---

## O que morreu, e por quê

- **O número** (03/09/2026), **Ordem de serviço** (02/09) e **Documento** (24/08) tratavam o site
  como um documento de negócio. Provaram rigor, não ofício: o site de quem vende sites é o
  portfólio em si. O Max diagnosticou visual sem presença, a ideia de documento e o preço em
  manchete, e pediu colorido e cinético sobre escuro.
- **O preço em manchete** saiu da home em 05/09/2026, antes do fim da medição de 30 dias. Ele
  continua público em `criacao-de-sites/` e no FAQ.
- **O chatbot com IA** saiu do site em 05/09/2026 por decisão do Max. `404.html` recebe quem
  chega pelo endereço antigo.
- **A foto cortada pela linha** (metade cinza, metade cobalto) durou uma revisão: o Max preferiu
  a foto inteira em preto e branco.
