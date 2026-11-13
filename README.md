# Chemical Injection Management System – Business Analyst Challenge

**Author / Autor:** Thiago Sartori Cardoso

**[English](#english)** · **[Português](#português)**

| | Link |
| --- | --- |
| **Working prototype / Protótipo** | https://po-struture-task-desafio-ba.vercel.app/ |
| **Project route / Rota do projeto (Miro)** | https://miro.com/app/board/uXjVEPPIUUI=/?share_link_id=663015320580 |
| **Specification / Especificação (PDF)** | [docs/specification/Specification.pdf](docs/specification/Specification.pdf) |
| **Quick guide (EN)** | [docs/guides/Prototype-Quick-Guide.pdf](docs/guides/Prototype-Quick-Guide.pdf) |
| **Guia rápido (PT)** | [docs/guides/Guia-Rapido-do-Prototipo.pdf](docs/guides/Guia-Rapido-do-Prototipo.pdf) |
| **Prototype design spec** | [docs/spec/2026-11-12-wizard-of-oz-prototype-design.md](docs/spec/2026-11-12-wizard-of-oz-prototype-design.md) |
| **Implementation plan** | [docs/plan/2026-11-12-wizard-of-oz-prototype.md](docs/plan/2026-11-12-wizard-of-oz-prototype.md) |

![Autonomy screen](docs/screenshots/autonomy.png)

---

<a id="english"></a>

## English

This repository is my answer to a Product Owner / Business Analyst challenge. The task: describe a web platform where a chemical supplier registers its tanks and wells, links them without breaking the safety rules, and sees how many days each tank has left, so Sales can plan the next delivery.

Besides the specification, I built a small online prototype so you can see the proposal working.

### What is here

| Challenge item | Where to find it |
| --- | --- |
| Project deliverables | Specification, section 5 |
| Project activities by phase (Discovery, Detailing, plus Planning) | Specification, section 6 · Miro board |
| Requirements and business rules | Specification, section 7 (sections 1 to 4 are the discovery behind it) |
| Lo-fi prototype | Specification, section 8 · [docs/specification/lo-fi](docs/specification/lo-fi) |
| Suggested features and KPIs | Specification, section 9 |
| Development method and prioritization | Specification, section 10 (MoSCoW, WSJF – what to build first, release roadmap) |
| Working prototype (extra) | This repository, online on Vercel |
| Test guide (extra) | [docs/guides](docs/guides) – English and Portuguese |

### How I approached it

I followed the same path I would follow on a real project: **first understand the problem, then define the requirements, then design, and finally plan the delivery.** Each phase ends with a decision with the sponsor. Development is planned in Scrum sprints and fits SAFe if the client works that way.

1. **Discovery** – what the problem is, who is involved, the goal (OKR), and the assumptions and open questions, riskiest first.
2. **Specification** – deliverables, activities per phase, business rules, requirements, use cases and user stories.
3. **Design** – simple lo-fi screens, then this online prototype.
4. **Planning** – KPIs, suggested features, method, what goes into each release and in what order.

The main decisions:

- **Show where everything comes from.** Each item says if it comes from the *Brief* (challenge text), the *Diagram* (Figure 1) or is *Proposed* (my suggestion, to confirm with the client). No made-up facts.
- **Read the diagram carefully.** Figure 1 shows Well-1 with products A and C, which the brief does not allow, and product D going into the flowlines. Both became questions for the client, and both appear in the prototype.
- **Start with the biggest risk.** Nobody measures how much chemical each well uses; it can only be estimated (assumption A1). So the first release delivers the days-left forecast, and consumption per well comes after A1 is checked.
- **Block, don't just warn.** The brief says the system must not allow the forbidden combinations, so the prototype blocks them.

### The prototype (Wizard of Oz)

A Wizard of Oz prototype shows a product working before its connections to other systems exist. Here, **the screens and the business rules are real**. The **real-time data system is played by a hidden panel** called *Behind the curtain* – like the wizard behind the curtain in the film.

- Open the panel with **Shift + O**, the link at the bottom of the page, or the address [`?oz=1`](https://po-struture-task-desafio-ba.vercel.app/?oz=1).
- The panel knows how much each tank really uses, but **the screens never read that number**. They work it out from the volume readings, just as the real system would.
- **All numbers are made up for the demo.** The names of tanks, pumps, wells and products, and the links of Site 1, come from Figure 1.
- Data stays only in your browser tab. Reloading the page starts the demo again.

#### Try it in 5 steps

The full 10-step route is in the [quick guide](docs/guides/Prototype-Quick-Guide.pdf).

1. **Autonomy:** C-TK-3 is *Critical* (about 2.2 days to 20%) and C-TK-1 needs *Attention* (5.0 days).
2. **Associations:** choose Well-2 and try to add C-TK-1 (product A). It is blocked: Well-2 already has product C (BR-05).
3. **Profile → Field Technician:** the Equipment tab disappears (BR-01), but linking tanks still works (BR-02).
4. **Shift + O → +7 days:** statuses change as the tanks empty. Refill C-TK-3 and it goes back to *OK*.
5. **Stop sensor** on a tank and move 3 hours ahead: it turns *Stale* and its forecast is hidden (NFR-05).

![Association blocked by BR-05](docs/screenshots/associations-blocked.png)

#### Screens

| Screen | What it does | Requirements |
| --- | --- | --- |
| Autonomy | Lists the tanks by days left until 20%, with level, volume, injection rate and status. You can change the warning horizon | FR-07, FR-09, FR-10 |
| Equipment | Registers tanks and wells, checking the fields. Only Sales sees it | FR-02, FR-03, BR-01 |
| Associations | Links and unlinks tanks and wells. Rules are checked before saving, and every change is logged | FR-05, BR-02–BR-05, NFR-04 |
| Consumption per well | Shows the estimated chemical each well gets, by product and in total, and flags rule conflicts | FR-08 |
| Guide | Rules, fields, formulas and panel controls, inside the prototype | — |

#### Business rules

| Rule | What it says | Where you see it |
| --- | --- | --- |
| BR-01 | Only Sales registers equipment | The Equipment tab is hidden for the Field Technician |
| BR-02 | Sales and Field Technicians link tanks to wells | Associations, with both profiles |
| BR-03 | A tank feeds many wells; a well gets many products | Associations, Consumption per well |
| BR-04 | A well gets 3 chemical products at most | "n of 3 products" counter. With products A to D, a 4th product always also breaks BR-05, so that message shows up; BR-04 is checked by the automated tests |
| BR-05 | Products A and C never on the same well | The link is blocked; Well-1's conflict is flagged |
| BR-06 | Each piece of equipment belongs to one site; there are many sites | The site selector filters every screen |
| BR-07 | Days left are counted until the tank reaches 20% | Days to 20%, dashed line on the level bar |
| BR-08 | Each tank holds one product and has one pump (Figure 1) | Tank registration |

#### Specification coverage

How each requirement of the specification shows up in the prototype.

| Requirement | In the prototype |
| --- | --- |
| FR-01 Register sites | Not in the prototype: Site 1 and Site 2 are already loaded |
| FR-02 Register tanks | Equipment screen |
| FR-03 Register wells | Equipment screen |
| FR-04 Register pumps and products | Partly: the pump is a field of the tank; products A to D are already loaded |
| FR-05 Link and unlink tanks and wells, checking the rules | Associations screen |
| FR-06 Receive hourly tank volume and well production | Played by *Behind the curtain* |
| FR-07 Injection rate per tank | Autonomy screen |
| FR-08 Estimated consumption per well | Consumption per well screen |
| FR-09 Days until 20% | Autonomy screen |
| FR-10 Filter by site | Site selector |
| NFR-01 Browser only, nothing to install | Web page on Vercel |
| NFR-02 Access by profile | Simulated with the Profile selector |
| NFR-03 Hourly data | Simulated hourly readings |
| NFR-04 Change log (audit trail) | Associations screen |
| NFR-05 Flag missing or old data | *Stale* status, forecast hidden |
| US-01 to US-06 | Covered by the four screens above |

#### Fields and what they mean

| Field | Meaning |
| --- | --- |
| Site | The production site. Filters tanks, wells and links |
| Profile | Who is using it: Sales or Field Technician (simulated login) |
| Simulated time | The demo clock. Only *Behind the curtain* moves it |
| Tank ID · Pump | The chemical tank and the pump that injects from it |
| Product | The chemical in the tank (A, B, C or D) |
| Capacity (L) | How much the tank holds |
| Volume (L) · Level | The last hourly reading and how full the tank is |
| Construction material | What the tank is made of (sample list) |
| Injection rate (L/day) | How many litres leave the tank per day, measured over the last 7 days, without counting refills |
| Days to 20% | How many days until the tank reaches the reorder limit |
| Reorder horizon | How many days ahead Sales wants to be warned (suggested: 7) |
| Production (m³/day) | How much each well produces per day |
| Consumption by product / Total | Estimated chemical each well gets per day |
| Chemical per m³ | Total consumption ÷ production (suggested KPI) |
| Rule check | Flags wells that already break BR-04 or BR-05 |
| Audit trail | Who changed a link, when, and what |

**Status:** *Stale* – no reading for more than 2 hours, so the forecast is hidden · *Critical* – at 20% or less, or 3 days or less · *Attention* – within the warning horizon · *OK* – beyond it. The 2-hour, 3-day and 7-day limits are suggestions to agree with the client.

**Formulas:**

```
Injection rate (L/day) = volume drop in the last 7 days ÷ days covered   (refills are left out)
Days to 20%            = (volume − 0.20 × capacity) ÷ injection rate
Well consumption       = Σ tank rate × (well production ÷ production of all wells that tank feeds)
```

#### Behind the curtain controls

| Control | What it plays |
| --- | --- |
| +1 hour · +1 day · +7 days | New hourly volume readings arriving |
| Tank selector | Picks the tank the controls below act on |
| Refill to capacity | A chemical delivery |
| Stop / Resume sensor | A tank that stops sending data (it keeps using chemical) |
| Real consumption (hidden) | How much the tank really uses; the screens never read it |
| Well production | The production reported for each well |
| Event log | Everything the simulated data system sent |
| Reset demo | Back to the start |

![Behind the curtain panel](docs/screenshots/behind-the-curtain.png)

### How the prototype was built

**The idea.** Show the proposal working without building the real integrations. That is the Wizard of Oz technique: the product logic is real, and only the outside data system is played by a hidden panel.

**The steps.**

1. **Design** – I wrote down the goal, the screens, the panel, the sample data and the formulas ([design spec](docs/spec/2026-11-12-wizard-of-oz-prototype-design.md)).
2. **Plan** – I split the work into four small tasks ([plan](docs/plan/2026-11-12-wizard-of-oz-prototype.md)).
3. **Tests first** – I wrote the tests for the rules and formulas before the code.
4. **Build** – business logic, then the simulation, then the screens and the in-app guide.
5. **Check** – 22 automated tests, plus a browser test that walks through the demo.
6. **Publish** – the code is on GitHub, and every update goes online on Vercel by itself.

**The tools.**

| Part | Tool | Why |
| --- | --- | --- |
| Screens | HTML and CSS, no framework | Easy to open, read and explain; nothing to compile |
| Logic | Plain JavaScript | Runs straight in the browser; one file per job |
| Data | Kept in the browser's memory | Everyone starts from the same demo; reload to start again |
| Tests | Node.js test runner | 22 tests of rules, formulas and simulation, no extra installs |
| Browser test | Playwright | Clicks through the demo like a user would |
| Hosting | Vercel, linked to GitHub | Each change to the code goes online automatically |

**Three choices that keep it simple.** The rules live in their own file (`src/logic.js`), so they can be tested without a browser. The simulation lives in another file (`src/oz.js`), so a real data connection would only replace that file. And nothing is random: the same clicks always give the same result.

### Files in this repository

```
index.html, style.css      Page and look
src/data.js                Sample data (Site 1 = Figure 1, Site 2 to show the filter)
src/logic.js               Business rules and formulas
src/oz.js                  Behind the curtain: the simulated data system
src/app.js                 Screens, profiles, forms, change log, guide
tests/                     Automated tests and the browser test
docs/specification/        Specification PDF, lo-fi screens, release roadmap
docs/guides/               Quick test guide (English and Portuguese)
docs/spec/, docs/plan/     Prototype design and plan
docs/screenshots/          Screens of the prototype
```

### Run it on your computer

Nothing to build or install. The page needs a small local server:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
npm test                          # 22 automated tests (Node 18 or newer)
npm run smoke                     # browser test (needs Playwright with Chromium)
```

### Not included

A real backend or API, saving data after a reload, real login, registering sites and products, editing or deleting equipment, ERP or logistics connections.

---

<a id="português"></a>

## Português

Este repositório é a minha resposta a um desafio para Product Owner / Business Analyst. A tarefa: descrever uma plataforma web em que um fornecedor de químicos cadastra seus tanques e poços, liga um ao outro sem quebrar as regras de segurança e vê quantos dias cada tanque ainda aguenta, para que Vendas planeje a próxima entrega.

Além da especificação, construí um pequeno protótipo online para você ver a proposta funcionando.

### O que tem aqui

| Item do desafio | Onde encontrar |
| --- | --- |
| Entregáveis do projeto | Especificação, seção 5 |
| Atividades do projeto por etapa (Discovery, Detalhamento e Planejamento) | Especificação, seção 6 · quadro do Miro |
| Requisitos e regras de negócio | Especificação, seção 7 (as seções 1 a 4 são o discovery por trás dela) |
| Protótipo lo-fi | Especificação, seção 8 · [docs/specification/lo-fi](docs/specification/lo-fi) |
| Funcionalidades sugeridas e KPIs | Especificação, seção 9 |
| Método de desenvolvimento e priorização | Especificação, seção 10 (MoSCoW, WSJF – o que construir primeiro, roadmap de releases) |
| Protótipo funcionando (extra) | Este repositório, online na Vercel |
| Guia de teste (extra) | [docs/guides](docs/guides) – inglês e português |

### Como abordei o desafio

Segui o mesmo caminho que seguiria num projeto real: **primeiro entender o problema, depois definir os requisitos, depois desenhar e, por fim, planejar a entrega.** Cada fase termina com uma decisão junto com o sponsor. O desenvolvimento é planejado em sprints Scrum e se encaixa no SAFe, se o cliente trabalhar assim.

1. **Discovery** – qual é o problema, quem está envolvido, o objetivo (OKR) e as premissas e perguntas em aberto, começando pelas de maior risco.
2. **Especificação** – entregáveis, atividades por fase, regras de negócio, requisitos, casos de uso e user stories.
3. **Design** – telas lo-fi simples e, depois, este protótipo online.
4. **Planejamento** – KPIs, funcionalidades sugeridas, método, o que entra em cada release e em que ordem.

As principais decisões:

- **Mostrar de onde vem cada coisa.** Cada item diz se vem do *Brief* (texto do desafio), do *Diagram* (Figura 1) ou se é *Proposed* (sugestão minha, a confirmar com o cliente). Nada inventado.
- **Ler o diagrama com atenção.** A Figura 1 mostra o Well-1 com os produtos A e C, o que o enunciado não permite, e o produto D indo para as linhas de escoamento (flowlines). As duas coisas viraram perguntas para o cliente e aparecem no protótipo.
- **Começar pelo maior risco.** Ninguém mede quanto químico cada poço usa; só dá para estimar (premissa A1). Por isso a primeira release entrega a previsão de dias restantes, e o consumo por poço vem depois que a A1 for confirmada.
- **Bloquear, não só avisar.** O enunciado diz que o sistema não deve permitir as combinações proibidas, então o protótipo bloqueia.

### O protótipo (Mágico de Oz)

Um protótipo Mágico de Oz mostra o produto funcionando antes de existirem as ligações com outros sistemas. Aqui, **as telas e as regras de negócio são reais**. O **sistema de dados em tempo real é feito por um painel escondido** chamado *Behind the curtain* ("atrás da cortina") – como o mágico atrás da cortina no filme.

- Abra o painel com **Shift + O**, pelo link no rodapé da página ou pelo endereço [`?oz=1`](https://po-struture-task-desafio-ba.vercel.app/?oz=1).
- O painel sabe quanto cada tanque realmente usa, mas **as telas nunca leem esse número**. Elas calculam a partir das leituras de volume, como o sistema real faria.
- **Todos os números são inventados para a demonstração.** Os nomes de tanques, bombas, poços e produtos, e as ligações do Site 1, vêm da Figura 1.
- Os dados ficam só na aba do navegador. Recarregar a página recomeça a demonstração.

#### Teste em 5 passos

O roteiro completo, com 10 passos, está no [guia rápido](docs/guides/Guia-Rapido-do-Prototipo.pdf).

1. **Autonomy:** o C-TK-3 está *Critical* (cerca de 2,2 dias até 20%) e o C-TK-1 precisa de *Attention* (5,0 dias).
2. **Associations:** escolha o Well-2 e tente adicionar o C-TK-1 (produto A). É bloqueado: o Well-2 já tem o produto C (BR-05).
3. **Profile → Field Technician:** a aba Equipment some (BR-01), mas ligar tanques continua funcionando (BR-02).
4. **Shift + O → +7 days:** os status mudam conforme os tanques esvaziam. Faça o Refill do C-TK-3 e ele volta a *OK*.
5. **Stop sensor** em um tanque e avance 3 horas: ele fica *Stale* e a previsão é ocultada (NFR-05).

![Associação bloqueada pela BR-05](docs/screenshots/associations-blocked.png)

#### Telas

| Tela | O que faz | Requisitos |
| --- | --- | --- |
| Autonomy | Lista os tanques pelos dias que faltam até 20%, com nível, volume, taxa de injeção e status. Dá para mudar o horizonte de aviso | FR-07, FR-09, FR-10 |
| Equipment | Cadastra tanques e poços, conferindo os campos. Só Sales vê | FR-02, FR-03, BR-01 |
| Associations | Liga e desliga tanques e poços. As regras são conferidas antes de salvar, e toda mudança fica registrada | FR-05, BR-02–BR-05, NFR-04 |
| Consumption per well | Mostra o químico estimado que cada poço recebe, por produto e no total, e aponta conflitos de regra | FR-08 |
| Guide | Regras, campos, fórmulas e controles do painel, dentro do protótipo | — |

#### Regras de negócio

| Regra | O que diz | Onde você vê |
| --- | --- | --- |
| BR-01 | Só Sales cadastra equipamentos | A aba Equipment some para o Field Technician |
| BR-02 | Sales e Field Technician ligam tanques a poços | Associations, nos dois perfis |
| BR-03 | Um tanque atende vários poços; um poço recebe vários produtos | Associations, Consumption per well |
| BR-04 | Um poço recebe no máximo 3 produtos químicos | Contador "n of 3 products". Com os produtos A a D, um 4º produto sempre quebra também a BR-05, e é essa mensagem que aparece; a BR-04 é conferida pelos testes automáticos |
| BR-05 | Produtos A e C nunca no mesmo poço | A ligação é bloqueada; o conflito do Well-1 é sinalizado |
| BR-06 | Cada equipamento pertence a um site; existem vários sites | O seletor de site filtra todas as telas |
| BR-07 | Os dias restantes contam até o tanque chegar a 20% | Days to 20% e linha tracejada na barra de nível |
| BR-08 | Cada tanque guarda um produto e tem uma bomba (Figura 1) | Cadastro de tanque |

#### Cobertura da especificação

Como cada requisito da especificação aparece no protótipo.

| Requisito | No protótipo |
| --- | --- |
| FR-01 Cadastrar sites | Fora do protótipo: o Site 1 e o Site 2 já vêm carregados |
| FR-02 Cadastrar tanques | Tela Equipment |
| FR-03 Cadastrar poços | Tela Equipment |
| FR-04 Cadastrar bombas e produtos | Em parte: a bomba é um campo do tanque; os produtos A a D já vêm carregados |
| FR-05 Ligar e desligar tanques e poços, conferindo as regras | Tela Associations |
| FR-06 Receber o volume dos tanques e a produção dos poços a cada hora | Feito pelo *Behind the curtain* |
| FR-07 Taxa de injeção por tanque | Tela Autonomy |
| FR-08 Consumo estimado por poço | Tela Consumption per well |
| FR-09 Dias até 20% | Tela Autonomy |
| FR-10 Filtrar por site | Seletor de site |
| NFR-01 Só navegador, nada para instalar | Página web na Vercel |
| NFR-02 Acesso por perfil | Simulado com o seletor Profile |
| NFR-03 Dados a cada hora | Leituras horárias simuladas |
| NFR-04 Registro de mudanças (trilha de auditoria) | Tela Associations |
| NFR-05 Sinalizar dado ausente ou antigo | Status *Stale*, previsão oculta |
| US-01 a US-06 | Cobertas pelas quatro telas acima |

#### Campos e o que significam

| Campo | Significado |
| --- | --- |
| Site | O site de produção. Filtra tanques, poços e ligações |
| Profile | Quem está usando: Sales ou Field Technician (login simulado) |
| Simulated time | O relógio da demonstração. Só o *Behind the curtain* avança |
| Tank ID · Pump | O tanque de químico e a bomba que injeta a partir dele |
| Product | O químico do tanque (A, B, C ou D) |
| Capacity (L) | Quanto o tanque comporta |
| Volume (L) · Level | A última leitura horária e quanto o tanque está cheio |
| Construction material | Do que o tanque é feito (lista de exemplo) |
| Injection rate (L/day) | Quantos litros saem do tanque por dia, medidos nos últimos 7 dias, sem contar os reabastecimentos |
| Days to 20% | Quantos dias faltam até o tanque chegar ao limite de reposição |
| Reorder horizon | Com quantos dias de antecedência Vendas quer ser avisada (sugestão: 7) |
| Production (m³/day) | Quanto cada poço produz por dia |
| Consumption by product / Total | Químico estimado que cada poço recebe por dia |
| Chemical per m³ | Consumo total ÷ produção (KPI sugerido) |
| Rule check | Aponta poços que já quebram a BR-04 ou a BR-05 |
| Audit trail | Quem mudou uma ligação, quando e o quê |

**Status:** *Stale* – sem leitura há mais de 2 horas, por isso a previsão fica oculta · *Critical* – em 20% ou menos, ou até 3 dias · *Attention* – dentro do horizonte de aviso · *OK* – acima dele. Os limites de 2 horas, 3 dias e 7 dias são sugestões a combinar com o cliente.

**Fórmulas:**

```
Taxa de injeção (L/dia) = queda de volume nos últimos 7 dias ÷ dias cobertos   (reabastecimentos ficam de fora)
Dias até 20%            = (volume − 0,20 × capacidade) ÷ taxa de injeção
Consumo do poço         = Σ taxa do tanque × (produção do poço ÷ produção de todos os poços que esse tanque atende)
```

#### Controles do Behind the curtain

| Controle | O que simula |
| --- | --- |
| +1 hour · +1 day · +7 days | Novas leituras horárias de volume chegando |
| Seletor de tanque | Escolhe o tanque em que os controles abaixo agem |
| Refill to capacity | Uma entrega de químico |
| Stop / Resume sensor | Um tanque que para de mandar dados (ele continua usando químico) |
| Real consumption (hidden) | Quanto o tanque realmente usa; as telas nunca leem esse valor |
| Well production | A produção informada para cada poço |
| Event log | Tudo o que o sistema de dados simulado enviou |
| Reset demo | Volta ao início |

![Painel Behind the curtain](docs/screenshots/behind-the-curtain.png)

### Como o protótipo foi construído

**A ideia.** Mostrar a proposta funcionando sem construir as integrações reais. Essa é a técnica do Mágico de Oz: a lógica do produto é real, e só o sistema de dados de fora é feito por um painel escondido.

**Os passos.**

1. **Design** – escrevi o objetivo, as telas, o painel, os dados de exemplo e as fórmulas ([spec de design](docs/spec/2026-11-12-wizard-of-oz-prototype-design.md)).
2. **Plano** – dividi o trabalho em quatro tarefas pequenas ([plano](docs/plan/2026-11-12-wizard-of-oz-prototype.md)).
3. **Testes primeiro** – escrevi os testes das regras e das fórmulas antes do código.
4. **Construção** – lógica de negócio, depois a simulação, depois as telas e o guia dentro do app.
5. **Conferência** – 22 testes automáticos, mais um teste no navegador que percorre a demonstração.
6. **Publicação** – o código está no GitHub, e cada atualização entra no ar sozinha na Vercel.

**As ferramentas.**

| Parte | Ferramenta | Por quê |
| --- | --- | --- |
| Telas | HTML e CSS, sem framework | Fácil de abrir, ler e explicar; nada para compilar |
| Lógica | JavaScript puro | Roda direto no navegador; um arquivo para cada função |
| Dados | Guardados na memória do navegador | Todo mundo começa da mesma demonstração; recarregue para recomeçar |
| Testes | Test runner do Node.js | 22 testes de regras, fórmulas e simulação, sem instalar nada a mais |
| Teste no navegador | Playwright | Clica pela demonstração como um usuário faria |
| Hospedagem | Vercel, ligada ao GitHub | Cada mudança no código entra no ar automaticamente |

**Três escolhas que deixam tudo simples.** As regras ficam num arquivo só delas (`src/logic.js`), então dá para testar sem navegador. A simulação fica em outro arquivo (`src/oz.js`), então uma ligação real com os dados substituiria só esse arquivo. E nada é aleatório: os mesmos cliques sempre dão o mesmo resultado.

### Arquivos deste repositório

```
index.html, style.css      Página e visual
src/data.js                Dados de exemplo (Site 1 = Figura 1, Site 2 para mostrar o filtro)
src/logic.js               Regras de negócio e fórmulas
src/oz.js                  Behind the curtain: o sistema de dados simulado
src/app.js                 Telas, perfis, formulários, registro de mudanças, guia
tests/                     Testes automáticos e o teste no navegador
docs/specification/        Especificação em PDF, telas lo-fi, roadmap de releases
docs/guides/               Guia rápido de teste (inglês e português)
docs/spec/, docs/plan/     Design e plano do protótipo
docs/screenshots/          Telas do protótipo
```

### Como rodar no seu computador

Nada para compilar nem instalar. A página só precisa de um servidor local simples:

```bash
python3 -m http.server 8000      # depois abra http://localhost:8000
npm test                          # 22 testes automáticos (Node 18 ou mais novo)
npm run smoke                     # teste no navegador (precisa do Playwright com Chromium)
```

### O que não está incluído

Back-end ou API reais, guardar dados depois de recarregar a página, login real, cadastro de sites e produtos, edição ou exclusão de equipamentos, ligação com ERP ou logística.
