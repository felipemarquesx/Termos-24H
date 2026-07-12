# Termos 24H — Automação de Termos Hospitalares (FUSMA e FUSEX)

> Sistema web desenvolvido para otimizar o fluxo de preenchimento de guias e termos de responsabilidade no setor de **Emergência 24H**, voltado especificamente para os convênios militares **FUSMA** e **FUSEX**.

O preenchimento manual dessas guias no dia a dia da recepção hospitalar exige atenção constante e consome tempo que poderia ser dedicado ao atendimento do paciente.  
O sistema **Termos 24H** foi desenvolvido para otimizar esse processo e reduzir erros de digitação em campos críticos, como número do cartão, data de nascimento e dados do atendimento, proporcionando maior agilidade e confiabilidade ao fluxo de trabalho.

> [!NOTE]
> **Visão de Futuro e Evolução:** Embora a ferramenta tenha sido concebida inicialmente para os fluxos exclusivos de **FUSMA** e **FUSEX**, ela acabou abrindo as portas para novas ideias de otimização administrativa no setor. Outras automações já estão sendo ativamente trabalhadas e implementadas para integrar e simplificar cada vez mais os processos do faturamento e atendimento.

## Acesso / Demo ao Vivo

O sistema está hospedado no **GitHub Pages** e pode ser acessado diretamente de qualquer computador da recepção:

## O que o projeto faz

1. **Preenchimento Automatizado de PDFs**  
   O operador preenche um formulário digital limpo com os dados do paciente (cartão, atendimento, nome, nascimento, telefone e especialidade). O sistema gera automaticamente o PDF oficial com os dados perfeitamente posicionados, pronto para impressão e assinatura.

2. **Cópia Rápida FUSEX**  
   Botão de validação que copia os dados básicos do atendimento em formato de texto estruturado para a área de transferência, evitando digitação repetida.

3. **Cronologia com 1 Clique**  
   Botões de atalho que capturam automaticamente a data e hora atuais do computador.

4. **Checklist de Protocolo de Segurança**  
   Modal de fechamento que impede o encerramento do atendimento até que o operador confirme o envio de e-mails e anexos exigidos, garantindo a conformidade com os protocolos internos.

5. **Painel de Emissão de Guias SADT**  
   Painel inteligente que permite o preenchimento de guias SADT de 16 operadoras de saúde diferentes. Os botões ficam **sempre habilitados** (por solicitação da recepção), permitindo que o operador imprima guias pré-preenchidas na tela ou totalmente em branco para preenchimento manual quando requisitado pelo médico. O clique em uma operadora aciona a **impressão silenciosa direta e automática** via iframe oculto.

6. **Assistente Postal e Integração de E-mail**  
   Mecanismo integrado ao checklist que detecta dinamicamente o convênio ativo (FUSMA com Valentin ou FUSEX com Gmail) e trava os endereços de destino corretos. Isso **evita falhas de envio e elimina erros operacionais**. Um clique no botão dispara a abertura do Webmail Seguro (Roundcube) em uma nova aba com o assunto formatado de forma profissional e marca automaticamente a conclusão da tarefa no checklist.

7. **Página de Emissão de Guias de Internação (Novo!)**  
   Página dedicada para a emissão rápida e direta de guias de internação de urgência de 15 operadoras de saúde (incluindo o SUS). Sem burocracia ou campos obrigatórios de preenchimento, basta um clique sobre o logotipo do convênio para disparar a **impressão silenciosa direta e automática** da respectiva guia pelo iframe oculto, otimizando o tempo no atendimento de pacientes graves.

8. **Módulo de Escala Diária (Futuro / Em Desenvolvimento!)**  
   Atalho configurado no menu principal e na sidebar com sinalização visual de manutenção (tag `MANUT`). O clique no botão exibe um aviso informativo explicando que o módulo trará uma **nova forma ágil e eficaz de preencher** as escalas de médicos e recepcionistas do plantão da emergência 24H.

## Evolução Recente: Antes vs. Depois

Para elevar a experiência do usuário e garantir conformidade rígida de segurança, o layout e o comportamento do formulário foram completamente otimizados:

| Recurso / Área | Como Era (Antes) | Como Ficou (Depois) |
| :--- | :--- | :--- |
| **Visualização de Data e Hora** | Exibia os números brutos (`DD/MM/AAAA` e `HH:MM`), ocupando colunas excessivamente largas sem feedback contextual. | **Frases Humanizadas Inline!** Exibe frases amigáveis como *"Hoje, Dia 10 de Julho de 2026"* e *"Hoje às 20:48 da Noite"*. O cursor revela os números brutos para digitação; ao clicar fora, o texto volta a ser amigável. O PDF final continua recebendo a data técnica de forma invisível. |
| **Limpeza e Privacidade** | Navegar entre convênios (FUSMA/FUSEX) ou sair do formulário mantinha as informações preenchidas nos campos, correndo risco de vazar dados do paciente anterior. | **Limpeza Inteligente por Eclusa!** Sair do formulário por qualquer meio (seta de voltar, menu lateral, sidebar) ativa uma limpeza profunda preventiva, resetando 100% dos inputs e excluindo dados temporários da memória. |
| **Preenchimento Automático (Autofill)** | O Chrome e outros navegadores bloqueavam a tela com popups oferecendo dados antigos de outros pacientes e davam alertas de "conexão insegura" no campo de validade. | **Bloqueio Total de Heurísticas!** Renomeamos o ID do campo de validade para evitar alertas falsos de cartão e alteramos a propriedade de autocomplete de todos os campos para `one-time-code`, desativando qualquer dropdown intrusivo do navegador. |
| **Design dos Inputs (Cápsulas)** | Usavam caixas de texto separadas de seus botões de atalho, com divisão visual marcada e sem destaque do foco do usuário. | **Cápsula Unificada!** Inputs e botões integrados se fundem em um visual elegante de "pílula única", com destaque de foco por brilho na cor tema correspondente a cada convênio (Azul para FUSMA, Verde para FUSEX). |
| **Ergonomia e Área de Trabalho** | O botão de cópia rápida do FUSEX ocupava um espaço gigante no rodapé, mudando o layout e forçando o operador a scrollar a tela constantemente. | **Foco e Ergonomia!** Os 4 campos necessários para cópia foram agrupados lado a lado no início. O botão de copiar dados retornou ao cabeçalho em tamanho discreto, destravando e mudando de cor dinamicamente com base nas validações. |
| **Limite de Digitação** | Campos de data e hora do atendimento permitiam digitação infinita de caracteres, desconfigurando os PDFs finais. | **Travas de Comprimento e Máscara!** Inclusão de `maxlength` rígido (10 para data, 5 para hora) combinados com máscara automática de hora no JS (insere `:` automaticamente ao digitar). |
| **Responsividade Vertical** | O Dashboard inicial exigia barra de rolagem vertical em monitores antigos ou telas menores como 1366x768. | **Compactação Responsiva sem Scroll!** Media queries baseadas na altura do monitor encolhem os ícones e margens de forma inteligente para que o painel principal caiba 100% na tela de qualquer monitor sem barra de rolagem. |

### Comparação Visual de Telas (Antes vs. Depois)
#### 1. Painel de Controle (Dashboard)
*Esta tela de controle centraliza as estatísticas, o relógio e a navegação do sistema.*

![Dashboard](assets/screenshots/InitialPage.png)

#### 2. Página de Seleção de Termos (FUSMA / FUSEX)
| Como Era (Antes) | Como Ficou (Depois) |
| :---: | :---: |
| ![Menu Antes](assets/screenshots/InitialPage_old.png) | ![Menu Depois](assets/screenshots/NewPageTerms.png) |

#### 3. Formulário FUSEX
| Como Era (Antes) | Como Ficou (Depois) |
| :---: | :---: |
| ![FUSEX Antes](assets/screenshots/PageFusex_old.png) | ![FUSEX Depois](assets/screenshots/PageFusex.png) |

#### 4. Formulário FUSMA
| Como Era (Antes) | Como Ficou (Depois) |
| :---: | :---: |
| ![FUSMA Antes](assets/screenshots/PageFusma_old.png) | ![FUSMA Depois](assets/screenshots/PageFusma.png) |

#### 5. Painel SADT
| Como Era (Antes) | Como Ficou (Depois) |
| :---: | :---: |
| ![SADT Antes](assets/screenshots/SadtModal_old.png) | ![SADT Depois](assets/screenshots/SadtModal.png) |

#### 6. Página de Guias de Internação (Nova Funcionalidade)
*Esta tela de guias de internação de urgência permite a emissão rápida direta.*

![Guias de Internação](assets/screenshots/PageInternacao.png)

## Tecnologias Utilizadas

- **PDF24 Toolbox** — Ferramenta utilizada para criar e configurar os campos editáveis (formulários interativos) nos PDFs oficiais.

- **pdf-lib** — Biblioteca JavaScript para leitura dos templates PDF e injeção dos dados em tempo real.

- **Bootstrap 5 + Bootstrap Icons** — Interface limpa, responsiva e intuitiva.

- **HTML5 + CSS3 + JavaScript Vanilla** — Aplicação executada inteiramente no lado do cliente (client-side), sem dependências de servidor, compatível com navegadores modernos.

- **Google Antigravity** — ferramenta de assistência ao desenvolvimento e otimização do projeto.  
  [https://antigravity.google/](https://antigravity.google/)

## Conformidade com a LGPD

O sistema foi projetado para garantir a privacidade dos dados sensíveis dos pacientes, em conformidade com a LGPD. O **Termos 24H** opera com arquitetura de Processamento Local (Client-Side):

- **Sem banco de dados** — Nenhum dado é enviado ou armazenado em servidor.
- **Memória volátil** — Toda geração de PDF acontece apenas na memória do navegador.
- **Sem localStorage clínico** — Os dados são descartados assim que a página é recarregada ou o atendimento é concluído.
- **Criptografia HTTPS de ponta a ponta** — A integração de e-mail e comunicação com o Webmail é feita exclusivamente através do protocolo seguro HTTPS.

## Estrutura do Projeto

```
termos-24h/
├── index.html          # Página principal
├── script.js           # Lógica de preenchimento, validação, geração de PDF, impressão e roteamento
├── style.css           # Estilos, responsividade vertical e animações
└── assets/
    ├── fusma/          # Capa FUSMA.jpg, favicon FusmaPage.png e template termo_fusma_preenchivel.pdf
    ├── fusex/          # Capa FUSEX.jpg, favicon FusexPage.png e template termo_fusex_preenchivel.pdf
    ├── guias internacao/ # Templates oficiais PDF das 15 operadoras de internação de urgência
    ├── guias sadt/     # Templates oficiais PDF preenchíveis das 16 operadoras de saúde
    ├── icons_operadoras_de_saude/ # Logotipos das operadoras (incluindo as novas SUS.jpg e EMBRATEL.jpg)
    ├── Initial.png     # Logotipo/Favicon padrão do site
    └── screenshots/    # Capturas de tela da aplicação para o README
```

## Como executar localmente

1. Mantenha a estrutura de pastas acima.
2. Abra o arquivo `index.html` diretamente no navegador, ou
3. Use a extensão **Live Server** do VS Code para melhor experiência.

> Não é necessário build, servidor backend ou instalação de dependências. Tudo roda no navegador.

## Autor

**Felipe Marques Argemiro**  
Matrícula: 14660  
Setor: Emergência 24H 
HOSPITAL SANTA CASA DE MISERICORDIA DE MACEIÓ

## Capturas de Tela

### Painel de Controle (Dashboard)

![Painel de Controle](assets/screenshots/InitialPage.png)

### Página de Seleção de Termos (FUSMA / FUSEX)

![Seleção de Termos](assets/screenshots/NewPageTerms.png)

### Página FUSEX

![Página Fusex](assets/screenshots/PageFusex.png)

### Página FUSMA

![Página Fusma](assets/screenshots/PageFusma.png)

### Modal Guias SADT

![Modal Guias SADT](assets/screenshots/SadtModal.png)

### Prompt de Impressão Direta (Exemplo Unimed)

![Prompt de Impressão Direta](assets/screenshots/SadtPrintPreview.png)

### Página de Guias de Internação (Nova Funcionalidade!)

![Página de Guias de Internação](assets/screenshots/PageInternacao.png)
---

*Ferramenta desenvolvida para uso interno no Setor de Emergência 24H, com foco na otimização de processos e na proteção de dados sensíveis.*