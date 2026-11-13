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

Technical task for a Product Owner / Business Analyst selection process: specify a web platform that lets a chemical supplier register tanks and wells per site, associate them under safety rules, and forecast each tank's autonomy so Sales can plan deliveries.

### What was done

| Challenge item | Where |
| --- | --- |
| Project deliverables list | Specification, section 5 |
| Project activities by phase (Discovery, Detailing, + Planning) | Specification, section 6 · Miro board |
| Requirements and business rules | Specification, section 7 (sections 1–4 are the discovery that feeds it) |
| Lo-fi prototype | Specification, section 8 · [docs/specification/lo-fi](docs/specification/lo-fi) |
| Suggested features and KPIs | Specification, section 9 |
| Development methodology and prioritization simulation | Specification, section 10 (MoSCoW, WSJF – what to build first, release roadmap) |
| Working prototype (extra) | This repository, deployed on Vercel |
| Test guide for evaluators (extra) | [docs/guides](docs/guides) – English and Portuguese |

### Approach

The work follows the order a Product Owner uses on a real project: **understand the problem → define requirements → design → plan delivery**, with a decision gate between phases. Development is planned in Scrum sprints, compatible with SAFe at program level.

1. **Discovery** – problem statement, How Might We, scope in/out, stakeholder map, personas with Jobs-to-be-Done, OKR, assumptions ranked by risk, open questions.
2. **Specification** – deliverables with acceptance criteria, activities per phase, business rules → functional and non-functional requirements → use cases → user stories, Gherkin acceptance criteria.
3. **Design** – lo-fi wireframes, then this working Wizard of Oz prototype.
4. **Planning** – KPIs, suggested features, method choice, MoSCoW, WSJF, release roadmap.

Key choices:

- **Every item is traced to its source:** *Brief* (challenge text), *Diagram* (Figure 1) or *Proposed* (a decision to confirm with the client). Nothing is presented as fact unless it comes from the material provided.
- **The diagram was read critically:** Figure 1 shows Well-1 receiving products A and C, which breaks the rule in the brief, and product D injected into flowlines. Both are open questions and both appear in the prototype.
- **Riskiest assumption first:** consumption per well is estimated, not measured (assumption A1). This drives the roadmap: the MVP delivers the autonomy forecast; consumption per well follows once A1 is validated.
- **Rules are enforced, not just warned:** the brief says the system must not allow them.

### The prototype (Wizard of Oz)

A Wizard of Oz prototype shows a product working before its integrations exist. Here the **screens and business rules are real**; the **external real-time data system is simulated** by a hidden operator panel called *Behind the curtain*.

- Open it with **Shift + O**, the link in the footer, or the URL [`?oz=1`](https://po-struture-task-desafio-ba.vercel.app/?oz=1).
- The panel holds each tank's "real" consumption, but **the screens never read it**: they measure the injection rate from volume readings, exactly as the real system would.
- All numbers are **fictional demonstration data**. Tank, pump, well and product names and the tank–well links of Site 1 come from Figure 1.
- Data lives only in the browser tab; reloading the page resets the demo.

#### Demo in 5 steps

The full 10-step test route is in the [quick guide](docs/guides/Prototype-Quick-Guide.pdf).

1. **Autonomy:** C-TK-3 is *Critical* (≈ 2.2 days to 20%) and C-TK-1 needs *Attention* (5.0 days).
2. **Associations:** pick Well-2 and try to add C-TK-1 (product A). It is blocked: Well-2 already has product C (BR-05).
3. **Profile → Field Technician:** the Equipment tab disappears (BR-01); associations still work (BR-02).
4. **Shift + O → +7 days:** statuses change as volumes fall. Refill C-TK-3 and it returns to *OK*.
5. **Stop sensor** on a tank and advance 3 hours: it turns *Stale* and its forecast is hidden (NFR-05).

![Association blocked by BR-05](docs/screenshots/associations-blocked.png)

#### Screens

| Screen | What it does | Requirements |
| --- | --- | --- |
| Autonomy | Tanks sorted by days to 20%, with level, volume, injection rate and status; editable reorder horizon | FR-07, FR-09, FR-10 |
| Equipment | Register tanks and wells with validation; visible only to Sales | FR-02, FR-03, BR-01 |
| Associations | Link and unlink tanks and wells; rules checked before saving; audit trail | FR-05, BR-02–BR-05, NFR-04 |
| Consumption per well | Estimated consumption by product and total, chemical per m³, rule check | FR-08 |
| Guide | Rules, field meanings, formulas and panel controls, inside the prototype | — |

#### Business rules

| Rule | What it says | Where you see it |
| --- | --- | --- |
| BR-01 | Only Sales registers equipment | Equipment tab hidden for Field Technician |
| BR-02 | Sales and Field Technicians associate tanks to wells | Associations, both profiles |
| BR-03 | A tank feeds many wells; a well receives many products | Associations, Consumption per well |
| BR-04 | Maximum 3 chemical products per well | Counter "n of 3 products". With products A–D, a 4th product always also breaks BR-05, so that message is shown; BR-04 is covered by unit tests |
| BR-05 | Products A and C never on the same well | Blocked association; Well-1 conflict flagged |
| BR-06 | Equipment belongs to one site; many sites supported | Site selector filters every screen |
| BR-07 | Autonomy is counted until 20% of capacity | Days to 20%, dashed line on the level bar |
| BR-08 | Each tank stores one product and has one pump (Figure 1) | Tank registry |

#### Specification coverage

How each requirement of the specification appears in the prototype.

| Requirement | In the prototype |
| --- | --- |
| FR-01 Register sites | Not in the prototype: Site 1 and Site 2 are pre-loaded |
| FR-02 Register tanks | Equipment screen |
| FR-03 Register wells | Equipment screen |
| FR-04 Register pumps and products | Partly: the pump is a field of the tank; products A–D are pre-loaded |
| FR-05 Link and unlink tanks and wells, checking the rules | Associations screen |
| FR-06 Receive hourly tank volume and well production | Simulated by *Behind the curtain* |
| FR-07 Injection rate per tank | Autonomy screen |
| FR-08 Estimated consumption per well | Consumption per well screen |
| FR-09 Days until 20% capacity | Autonomy screen |
| FR-10 Filter by site | Site selector |
| NFR-01 Browser only, no installation | Web page on Vercel |
| NFR-02 Access by profile | Simulated with the Profile selector |
| NFR-03 Hourly data | Simulated hourly readings |
| NFR-04 Audit trail | Associations screen |
| NFR-05 Flag missing or stale data | *Stale* status, forecast hidden |
| US-01 to US-06 | Covered by the four screens above |

#### Fields and functions

| Field / function | Meaning |
| --- | --- |
| Site | Production site; filters tanks, wells and associations |
| Profile | User role, Sales or Field Technician (simulated login) |
| Simulated time | Clock of the simulation, moved only by *Behind the curtain* |
| Tank ID · Pump | Chemical tank and its dedicated injection pump |
| Product | Chemical stored in the tank (A, B, C or D) |
| Capacity (L) | Maximum volume of the tank |
| Volume (L) · Level | Last hourly reading from the real-time system and its share of capacity |
| Construction material | Basic characteristic of the tank (fictional list) |
| Injection rate (L/day) | Average daily volume drop over the last 7 days, refills excluded |
| Days to 20% | Autonomy: days until the tank reaches the reorder limit |
| Reorder horizon | How many days ahead Sales wants to be warned (proposed, default 7) |
| Production (m³/day) | Individual well production from the real-time system |
| Consumption by product / Total | Estimated chemical each well receives per day |
| Chemical per m³ | Total consumption ÷ production (suggested KPI) |
| Rule check | Flags wells that already break BR-04 or BR-05 |
| Audit trail | Who changed an association, when and what |

**Status:** *Stale* – no reading for more than 2 hours (forecast hidden) · *Critical* – at or below 20%, or ≤ 3 days · *Attention* – within the reorder horizon · *OK* – beyond it. The 2-hour, 3-day and 7-day thresholds are proposed parameters to agree with the client.

**Formulas:**

```
Injection rate (L/day) = volume drop over the last 7 days ÷ days covered   (increases = refills, excluded)
Days to 20%            = (volume − 0.20 × capacity) ÷ injection rate
Well consumption       = Σ tank rate × (well production ÷ production of all wells fed by that tank)
```

#### Behind the curtain controls

| Control | Simulates |
| --- | --- |
| +1 hour · +1 day · +7 days | Hourly tank volume readings arriving |
| Tank selector | Chooses the tank the controls below act on |
| Refill to capacity | A chemical delivery |
| Stop / Resume sensor | Missing data from one tank (it keeps consuming meanwhile) |
| Real consumption (hidden) | What the tank truly consumes; never read by the screens |
| Well production | Production reported for each well |
| Event log | Everything the simulated data system sent |
| Reset demo | Back to the initial state |

![Behind the curtain panel](docs/screenshots/behind-the-curtain.png)

### Tech stack

| Layer | Technology | Why |
| --- | --- | --- |
| Interface | HTML5 + CSS3, no framework | Simple to open, read and explain; nothing to compile |
| Logic | Plain JavaScript (ES modules) | Runs directly in the browser; one module per responsibility |
| Data | In memory, in the browser | Every evaluator starts from the same demo; reload = reset |
| Unit tests | Node.js built-in test runner (`node --test`) | 22 tests of rules, formulas and simulation, no dependencies |
| Browser test | Playwright (Chromium) | Walks through the demo route like a user |
| Hosting | Vercel, linked to GitHub | Static site; every push to `main` publishes a new version |

Architecture decisions: business rules live in pure functions (`src/logic.js`), testable without a browser; the simulation is isolated (`src/oz.js`), so a real integration would replace only that module; the simulation is deterministic (no randomness), so the same clicks always give the same result.

### Repository structure

```
index.html, style.css      Page and visual style
src/data.js                Fictional seed data (Site 1 = Figure 1, Site 2 for the filter)
src/logic.js               Business rules and formulas (pure functions)
src/oz.js                  Behind the curtain: simulated real-time data system
src/app.js                 Screens, profiles, forms, audit trail, guide
tests/                     Unit tests (logic, simulation) and a browser smoke test
docs/specification/        Specification PDF, lo-fi wireframes, release roadmap
docs/guides/               Quick test guide for evaluators (English and Portuguese)
docs/spec/, docs/plan/     Prototype design spec and implementation plan
docs/screenshots/          Screens of the working prototype
```

### Run locally

No build and no dependencies. ES modules need a local server:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
npm test                          # 22 unit tests (Node 18+)
npm run smoke                     # browser smoke test (needs Playwright with Chromium)
```

### Out of scope

Real backend or API, persistence across reloads, real authentication, registering sites and products, editing or deleting registered equipment, ERP or logistics integration.

---

<a id="português"></a>

## Português

Tarefa técnica de um processo seletivo para Product Owner / Business Analyst: especificar uma plataforma web que permita a um fornecedor de químicos cadastrar tanques e poços por site, associá-los respeitando regras de segurança e prever a autonomia de cada tanque, para que a área de Vendas planeje as entregas.

### O que foi feito

| Item do desafio | Onde está |
| --- | --- |
| Lista de entregáveis do projeto | Especificação, seção 5 |
| Atividades do projeto por etapa (Discovery, Detalhamento, + Planejamento) | Especificação, seção 6 · quadro do Miro |
| Requisitos e regras de negócio | Especificação, seção 7 (as seções 1 a 4 são o discovery que a alimenta) |
| Protótipo lo-fi | Especificação, seção 8 · [docs/specification/lo-fi](docs/specification/lo-fi) |
| Funcionalidades sugeridas e KPIs | Especificação, seção 9 |
| Metodologia de desenvolvimento e simulação de priorização | Especificação, seção 10 (MoSCoW, WSJF – o que construir primeiro, roadmap de releases) |
| Protótipo funcional (extra) | Este repositório, publicado na Vercel |
| Guia de teste para avaliadores (extra) | [docs/guides](docs/guides) – inglês e português |

### Abordagem

O trabalho segue a ordem que um Product Owner usa num projeto real: **entender o problema → definir os requisitos → desenhar → planejar a entrega**, com um gate de decisão entre as fases. O desenvolvimento é planejado em sprints Scrum, compatível com SAFe no nível de programa.

1. **Discovery** – problem statement, How Might We, escopo dentro/fora, mapa de stakeholders, personas com Jobs-to-be-Done, OKR, premissas ordenadas por risco, perguntas em aberto.
2. **Especificação** – entregáveis com critério de aceite, atividades por fase, regras de negócio → requisitos funcionais e não funcionais → casos de uso → user stories, critérios de aceite em Gherkin.
3. **Design** – wireframes lo-fi e, depois, este protótipo funcional Mágico de Oz.
4. **Planejamento** – KPIs, funcionalidades sugeridas, escolha da metodologia, MoSCoW, WSJF, roadmap de releases.

Escolhas principais:

- **Cada item indica sua origem:** *Brief* (texto do desafio), *Diagram* (Figura 1) ou *Proposed* (decisão a confirmar com o cliente). Nada é apresentado como fato se não vier do material fornecido.
- **O diagrama foi lido com olhar crítico:** a Figura 1 mostra o Well-1 recebendo os produtos A e C, o que viola a regra do enunciado, e o produto D injetado nas linhas de escoamento (flowlines). As duas questões estão em aberto e aparecem no protótipo.
- **A premissa de maior risco vem primeiro:** o consumo por poço é estimado, não medido (premissa A1). Isso define o roadmap: o MVP entrega a previsão de autonomia; o consumo por poço vem depois que a A1 for validada.
- **As regras bloqueiam, não só avisam:** o enunciado diz que o sistema não deve permitir as combinações proibidas.

### O protótipo (Mágico de Oz)

Um protótipo Mágico de Oz mostra o produto funcionando antes de as integrações existirem. Aqui as **telas e as regras de negócio são reais**; o **sistema externo de dados em tempo real é simulado** por um painel de operador escondido, chamado *Behind the curtain*.

- Abra o painel com **Shift + O**, pelo link no rodapé ou pelo endereço [`?oz=1`](https://po-struture-task-desafio-ba.vercel.app/?oz=1).
- O painel guarda o consumo "real" de cada tanque, mas **as telas nunca leem esse valor**: elas medem a taxa de injeção pelas leituras de volume, exatamente como o sistema real faria.
- Todos os números são **dados fictícios de demonstração**. Os nomes de tanques, bombas, poços e produtos e as ligações tanque–poço do Site 1 vêm da Figura 1.
- Os dados ficam só na aba do navegador; recarregar a página reinicia a demonstração.

#### Demonstração em 5 passos

O roteiro completo, com 10 passos, está no [guia rápido](docs/guides/Guia-Rapido-do-Prototipo.pdf).

1. **Autonomy:** o C-TK-3 está *Critical* (≈ 2,2 dias até 20%) e o C-TK-1 precisa de *Attention* (5,0 dias).
2. **Associations:** escolha o Well-2 e tente adicionar o C-TK-1 (produto A). É bloqueado: o Well-2 já tem o produto C (BR-05).
3. **Profile → Field Technician:** a aba Equipment some (BR-01); as associações continuam funcionando (BR-02).
4. **Shift + O → +7 days:** os status mudam conforme os volumes caem. Faça o Refill do C-TK-3 e ele volta a *OK*.
5. **Stop sensor** em um tanque e avance 3 horas: ele fica *Stale* e a previsão é ocultada (NFR-05).

![Associação bloqueada pela BR-05](docs/screenshots/associations-blocked.png)

#### Telas

| Tela | O que faz | Requisitos |
| --- | --- | --- |
| Autonomy | Tanques ordenados pelos dias até 20%, com nível, volume, taxa de injeção e status; horizonte de reposição editável | FR-07, FR-09, FR-10 |
| Equipment | Cadastro de tanques e poços com validação; visível só para Sales | FR-02, FR-03, BR-01 |
| Associations | Liga e desliga tanques e poços; regras verificadas antes de salvar; trilha de auditoria | FR-05, BR-02–BR-05, NFR-04 |
| Consumption per well | Consumo estimado por produto e total, químico por m³, verificação de regras | FR-08 |
| Guide | Regras, significado dos campos, fórmulas e controles do painel, dentro do protótipo | — |

#### Regras de negócio

| Regra | O que diz | Onde você vê |
| --- | --- | --- |
| BR-01 | Só Sales cadastra equipamentos | Aba Equipment oculta para Field Technician |
| BR-02 | Sales e Field Technician associam tanques a poços | Associations, nos dois perfis |
| BR-03 | Um tanque alimenta vários poços; um poço recebe vários produtos | Associations, Consumption per well |
| BR-04 | No máximo 3 produtos químicos por poço | Contador "n of 3 products". Com os produtos A a D, um 4º produto sempre viola também a BR-05, e é essa mensagem que aparece; a BR-04 é coberta pelos testes automáticos |
| BR-05 | Produtos A e C nunca no mesmo poço | Associação bloqueada; conflito do Well-1 sinalizado |
| BR-06 | Cada equipamento pertence a um site; o sistema tem vários sites | Seletor de site filtra todas as telas |
| BR-07 | A autonomia é contada até 20% da capacidade | Days to 20% e linha tracejada na barra de nível |
| BR-08 | Cada tanque guarda um produto e tem uma bomba (Figura 1) | Cadastro de tanque |

#### Cobertura da especificação

Como cada requisito da especificação aparece no protótipo.

| Requisito | No protótipo |
| --- | --- |
| FR-01 Cadastrar sites | Fora do protótipo: o Site 1 e o Site 2 já vêm carregados |
| FR-02 Cadastrar tanques | Tela Equipment |
| FR-03 Cadastrar poços | Tela Equipment |
| FR-04 Cadastrar bombas e produtos | Em parte: a bomba é um campo do tanque; os produtos A a D já vêm carregados |
| FR-05 Ligar e desligar tanques e poços, verificando as regras | Tela Associations |
| FR-06 Receber volume dos tanques e produção dos poços a cada hora | Simulado pelo *Behind the curtain* |
| FR-07 Taxa de injeção por tanque | Tela Autonomy |
| FR-08 Consumo estimado por poço | Tela Consumption per well |
| FR-09 Dias até 20% da capacidade | Tela Autonomy |
| FR-10 Filtrar por site | Seletor de site |
| NFR-01 Só navegador, sem instalação | Página web na Vercel |
| NFR-02 Acesso por perfil | Simulado com o seletor Profile |
| NFR-03 Dados a cada hora | Leituras horárias simuladas |
| NFR-04 Trilha de auditoria | Tela Associations |
| NFR-05 Sinalizar dado ausente ou desatualizado | Status *Stale*, previsão oculta |
| US-01 a US-06 | Cobertas pelas quatro telas acima |

#### Campos e funções

| Campo / função | Significado |
| --- | --- |
| Site | Site de produção; filtra tanques, poços e associações |
| Profile | Perfil do usuário, Sales ou Field Technician (login simulado) |
| Simulated time | Relógio da simulação, avançado só pelo *Behind the curtain* |
| Tank ID · Pump | Tanque de químico e sua bomba de injeção dedicada |
| Product | Químico armazenado no tanque (A, B, C ou D) |
| Capacity (L) | Volume máximo do tanque |
| Volume (L) · Level | Última leitura horária do sistema de tempo real e seu percentual da capacidade |
| Construction material | Característica básica do tanque (lista fictícia) |
| Injection rate (L/day) | Queda média diária de volume nos últimos 7 dias, sem os reabastecimentos |
| Days to 20% | Autonomia: dias até o tanque chegar ao limite de reposição |
| Reorder horizon | Com quantos dias de antecedência Vendas quer ser avisada (proposto, padrão 7) |
| Production (m³/day) | Produção individual do poço, vinda do sistema de tempo real |
| Consumption by product / Total | Químico estimado que cada poço recebe por dia |
| Chemical per m³ | Consumo total ÷ produção (KPI sugerido) |
| Rule check | Sinaliza poços que já violam a BR-04 ou a BR-05 |
| Audit trail | Quem alterou uma associação, quando e o quê |

**Status:** *Stale* – sem leitura há mais de 2 horas (previsão oculta) · *Critical* – em 20% ou menos, ou até 3 dias · *Attention* – dentro do horizonte de reposição · *OK* – acima dele. Os limites de 2 horas, 3 dias e 7 dias são parâmetros propostos, a combinar com o cliente.

**Fórmulas:**

```
Taxa de injeção (L/dia) = queda de volume nos últimos 7 dias ÷ dias cobertos   (aumentos = reabastecimentos, ignorados)
Dias até 20%            = (volume − 0,20 × capacidade) ÷ taxa de injeção
Consumo do poço         = Σ taxa do tanque × (produção do poço ÷ produção de todos os poços que esse tanque atende)
```

#### Controles do Behind the curtain

| Controle | O que simula |
| --- | --- |
| +1 hour · +1 day · +7 days | Chegada das leituras horárias de volume dos tanques |
| Seletor de tanque | Escolhe o tanque em que os controles abaixo vão agir |
| Refill to capacity | Uma entrega de químico |
| Stop / Resume sensor | Falta de dados de um tanque (ele continua consumindo) |
| Real consumption (hidden) | Quanto o tanque realmente consome; nunca é lido pelas telas |
| Well production | Produção informada para cada poço |
| Event log | Tudo o que o sistema de dados simulado enviou |
| Reset demo | Volta ao estado inicial |

![Painel Behind the curtain](docs/screenshots/behind-the-curtain.png)

### Stack

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Interface | HTML5 + CSS3, sem framework | Simples de abrir, ler e explicar; nada para compilar |
| Lógica | JavaScript puro (ES modules) | Roda direto no navegador; um módulo por responsabilidade |
| Dados | Em memória, no navegador | Todo avaliador começa da mesma demonstração; recarregar = reiniciar |
| Testes unitários | Test runner nativo do Node.js (`node --test`) | 22 testes de regras, fórmulas e simulação, sem dependências |
| Teste de navegador | Playwright (Chromium) | Percorre o roteiro de demonstração como um usuário |
| Hospedagem | Vercel, ligada ao GitHub | Site estático; cada push no `main` publica uma nova versão |

Decisões de arquitetura: as regras de negócio ficam em funções puras (`src/logic.js`), testáveis sem navegador; a simulação é isolada (`src/oz.js`), então uma integração real substituiria só esse módulo; a simulação é determinística (sem valores aleatórios), então os mesmos cliques geram sempre o mesmo resultado.

### Estrutura do repositório

```
index.html, style.css      Página e estilo visual
src/data.js                Dados fictícios (Site 1 = Figura 1, Site 2 para o filtro)
src/logic.js               Regras de negócio e fórmulas (funções puras)
src/oz.js                  Behind the curtain: sistema de dados em tempo real simulado
src/app.js                 Telas, perfis, formulários, trilha de auditoria, guia
tests/                     Testes unitários (lógica, simulação) e teste de navegador
docs/specification/        Especificação em PDF, wireframes lo-fi, roadmap de releases
docs/guides/               Guia rápido de teste para avaliadores (inglês e português)
docs/spec/, docs/plan/     Spec de design e plano de implementação do protótipo
docs/screenshots/          Telas do protótipo funcional
```

### Como rodar localmente

Sem build e sem dependências. Os ES modules precisam de um servidor local:

```bash
python3 -m http.server 8000      # depois abra http://localhost:8000
npm test                          # 22 testes unitários (Node 18+)
npm run smoke                     # teste de navegador (precisa do Playwright com Chromium)
```

### Fora do escopo

Back-end ou API reais, dados persistentes entre recarregamentos, autenticação real, cadastro de sites e produtos, edição ou exclusão de equipamentos cadastrados, integração com ERP ou logística.
