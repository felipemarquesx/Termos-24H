# Termos 24H — Automação de Termos Hospitalares (FUSMA e FUSEX)

> Sistema web desenvolvido para otimizar o fluxo de preenchimento de guias e termos de responsabilidade no setor de **Emergência 24H**, voltado especificamente para os convênios militares **FUSMA** e **FUSEX**.

O preenchimento manual dessas guias no dia a dia da recepção hospitalar exige atenção constante e consome tempo que poderia ser dedicado ao atendimento do paciente.  
O sistema **Termos 24H** foi desenvolvido para otimizar esse processo e reduzir erros de digitação em campos críticos, como número do cartão, data de nascimento e dados do atendimento, proporcionando maior agilidade e confiabilidade ao fluxo de trabalho.

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

5. **Painel de Emissão de Guias SADT (Novo!)**  
   Painel inteligente que permite o preenchimento de guias SADT de 16 operadoras de saúde diferentes. Ao preencher a carteirinha, validade e nome do beneficiário, o sistema desbloqueia os planos. O clique em uma operadora aciona a **impressão silenciosa direta e automática** via iframe oculto, abrindo o prompt do Ctrl+P por cima do site atual sem abrir abas adicionais.

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

## Estrutura do Projeto

```
termos-24h/
├── index.html          # Página principal
├── script.js           # Lógica de preenchimento, validação, geração de PDF e impressão
├── style.css           # Estilos e responsividade
└── assets/
    ├── FUSEX.jpg       # Imagens de fundo
    ├── FUSMA.jpg       # Imagens de fundo
    ├── Initial.png     # Logotipo/Favicon padrão do site
    ├── guias sadt/     # Templates oficiais PDF preenchíveis das 16 operadoras de saúde
    ├── icons_operadoras_de_saude/ # Logotipos das operadoras de saúde
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

### Página inicial

![Página Inicial](assets/screenshots/InitialPage.png)

### Página FUSEX

![Página Fusex](assets/screenshots/PageFusex.png)

### Página FUSMA

![Página Fusma](assets/screenshots/PageFusma.png)

### Modal Guias SADT

![Modal Guias SADT](assets/screenshots/SadtModal.png)

### Prompt de Impressão Direta (Exemplo Unimed)

![Prompt de Impressão Direta](assets/screenshots/SadtPrintPreview.png)
---

*Ferramenta desenvolvida para uso interno no Setor de Emergência 24H, com foco na otimização de processos e na proteção de dados sensíveis.*