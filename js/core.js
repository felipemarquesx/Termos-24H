// ==========================================================================
// SISTEMA AUTOMATIZAR TERMOS - NÚCLEO CENTRAL (CORE)
// ==========================================================================
// Este arquivo é o "esqueleto" e o "guia de trânsito" do nosso aplicativo.
// Ele gerencia a troca de telas (SPA), as abas do navegador (título e favicon),
// o menu da barra lateral e o relógio digital do painel principal (Dashboard).
// ==========================================================================

// Estado global do formulário militar ativo (fusex ou fusma)
let termoAtual = '';

// --- Controle de Aba e Metadados do Navegador ---
// Atualização dinâmica de título e ícone de aba baseado na navegação interna
function atualizarAbaNavegador(titulo, faviconPath) {
    document.title = titulo;

    // Remoção de favicon anterior para evitar problemas de cache de renderização
    const faviconExistente = document.getElementById('favicon');
    if (faviconExistente) {
        faviconExistente.remove();
    }

    // Instanciação do novo favicon
    const novoFavicon = document.createElement('link');
    novoFavicon.id = 'favicon';
    novoFavicon.rel = 'icon';
    novoFavicon.type = 'image/png';
    // Anexo de timestamp (?t=...) para prevenção de cache do navegador
    novoFavicon.href = faviconPath + '?t=' + new Date().getTime();

    // Inserção do novo favicon no DOM
    document.head.appendChild(novoFavicon);
}

// --- Sistema de Roteamento de Telas (SPA) ---
let mudarTelaTimeoutId = null;
let mudarTelaEmTransicao = false;

function mudarTela(deId, paraId) {
    if (mudarTelaEmTransicao) return; // Bloqueia cliques rápidos concorrentes

    const deTela = document.getElementById(deId);
    const paraTela = document.getElementById(paraId);

    if (!deTela || !paraTela) return;

    // Cancela o timeout da transição anterior se houver
    if (mudarTelaTimeoutId) {
        clearTimeout(mudarTelaTimeoutId);
        mudarTelaTimeoutId = null;
    }

    mudarTelaEmTransicao = true;

    // Atualizações automáticas do título e favicon da aba
    if (paraId === 'tela-menu-principal') {
        atualizarAbaNavegador('Termos 24H', './assets/Initial.png');
    } else if (paraId === 'tela-sadt') {
        atualizarAbaNavegador('Guias SADT', './assets/Initial.png');
    } else if (paraId === 'tela-selecao-termos') {
        atualizarAbaNavegador('Termos 24H', './assets/Initial.png');
    } else if (paraId === 'tela-guias-internacao') {
        atualizarAbaNavegador('Guias de Internação', './assets/Initial.png');
    } else if (paraId === 'tela-escala-diaria') {
        atualizarAbaNavegador('Escala Diária', './assets/Initial.png');
        if (typeof inicializarEscalaDiaria === 'function') {
            inicializarEscalaDiaria();
        }
    }

    // Se estiver saindo da tela SADT, limpa os campos para o próximo uso
    if (deId === 'tela-sadt') {
        const inputCarteirinha = document.getElementById('sadt-carteirinha');
        const inputValidade = document.getElementById('sadt-vld-cart');
        const inputNome = document.getElementById('sadt-nome');
        if (inputCarteirinha && inputValidade && inputNome) {
            [inputCarteirinha, inputValidade, inputNome].forEach(input => {
                input.value = '';
            });
            if (typeof verificarCamposSadt === 'function') {
                verificarCamposSadt();
            }
        }
    }



    // Se estiver saindo da tela do formulário FUSMA/FUSEX, limpa para garantir segurança e privacidade
    if (deId === 'tela-formulario') {
        const form = document.getElementById('form-termos');
        if (form) {
            form.reset();
            form.querySelectorAll('[data-raw]').forEach(el => el.removeAttribute('data-raw'));
        }
        document.querySelectorAll('.campo-obrigatorio').forEach(input => {
            input.classList.remove('valido');
        });
        atualizarConformidadeFormulario();
    }

    // Atualiza a barra lateral ativa
    atualizarActiveSidebar(paraId);

    // Força qualquer outra tela concorrente (fantasmas) a ficar escondida imediatamente
    const todasTelas = ['tela-menu-principal', 'tela-selecao-termos', 'tela-sadt', 'tela-formulario', 'tela-guias-internacao', 'tela-escala-diaria'];
    todasTelas.forEach(id => {
        if (id !== paraId && id !== deId) {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = 'none';
                el.classList.add('escondida');
            }
        }
    });

    // 1. Coloca a nova tela no fluxo HTML
    paraTela.style.display = 'block';
    paraTela.classList.add('escondida');

    // Força reflow (recalculo de estilos pelo navegador) para registrar a classe .escondida
    paraTela.offsetHeight;

    // 2. Executa a transição suave de Fade + Zoom
    deTela.classList.add('escondida');
    paraTela.classList.remove('escondida');

    // 3. Oculta a tela anterior do fluxo após a animação (400ms) e libera o roteador
    mudarTelaTimeoutId = setTimeout(() => {
        deTela.style.display = 'none';
        mudarTelaEmTransicao = false;
    }, 400);
}

// --- Navegação Sidebar ---
function navegarMenu(paraId) {
    // Descobre qual tela está visível atualmente
    const telas = ['tela-menu-principal', 'tela-selecao-termos', 'tela-sadt', 'tela-formulario', 'tela-guias-internacao', 'tela-escala-diaria'];
    let deId = '';
    
    telas.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.display !== 'none') {
            deId = id;
        }
    });

    if (!deId) deId = 'tela-menu-principal';
    if (deId === paraId) return;

    mudarTela(deId, paraId);
}

function atualizarActiveSidebar(telaAtivaId) {
    const mapa = {
        'tela-menu-principal': 'menu-inicio',
        'tela-sadt': 'menu-sadt',
        'tela-selecao-termos': 'menu-termos',
        'tela-formulario': 'menu-termos', // Ativa "Termos Militares" quando preenchendo FUSMA/FUSEX
        'tela-guias-internacao': 'menu-internacao',
        'tela-escala-diaria': 'menu-escala'
    };

    const activeMenuId = mapa[telaAtivaId];
    
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(el => {
        el.classList.remove('active');
    });

    if (activeMenuId) {
        const activeLink = document.getElementById(activeMenuId);
        if (activeLink) activeLink.classList.add('active');
    }
}

// --- Inicializações Globais do DOM no Carregamento ---
document.addEventListener('DOMContentLoaded', () => {
    inicializarSadt();
    inicializarInternacao();
    iniciarRelogioDashboard();
    
    // Inicia o verificador de lembretes da escala
    verificarLembretesEscala();
    setInterval(verificarLembretesEscala, 30000); // Roda a cada 30 segundos
    
    // Restaura o modo escuro global se salvo
    const modoEscuroSalvo = localStorage.getItem('modo_escuro_global');
    if (modoEscuroSalvo === 'true') {
        modoEscuroGlobal = false;
        toggleModoEscuroGlobal();
    }
});

// --- Função: Relógio Digital em tempo real no Dashboard ---
function iniciarRelogioDashboard() {
    const clockEl = document.getElementById('dashboard-relogio');
    const dateEl = document.getElementById('dashboard-data');
    if (!clockEl || !dateEl) return;

    function atualizar() {
        const agora = new Date();
        const horas = String(agora.getHours()).padStart(2, '0');
        const minutos = String(agora.getMinutes()).padStart(2, '0');
        const segundos = String(agora.getSeconds()).padStart(2, '0');
        clockEl.innerText = `${horas}:${minutos}:${segundos}`;

        const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.innerText = agora.toLocaleDateString('pt-BR', opcoes);
    }
    atualizar();
    setInterval(atualizar, 1000);
}

// --- SISTEMA DE LEMBRETE INTELIGENTE DA ESCALA DIÁRIA ---
let intervalTituloAba = null;
let tituloOriginalAba = "";

function verificarLembretesEscala() {
    const agora = new Date();
    const horas = agora.getHours();
    const minutos = agora.getMinutes();
    
    // Converte a hora atual em minutos do dia para facilitar a comparação
    const minutosDoDia = horas * 60 + minutos;
    
    // Faixas de horários de lembrete (em minutos do dia)
    // Manhã: 07:00 (420) até 08:30 (510)
    const inicioManha = 7 * 60;
    const fimManha = 8 * 60 + 30;
    
    // Tarde: 13:00 (780) até 14:30 (870)
    const inicioTarde = 13 * 60;
    const fimTarde = 14 * 60 + 30;
    
    // Noite: 19:00 (1140) até 20:30 (1230)
    const inicioNoite = 19 * 60;
    const fimNoite = 20 * 60 + 30;
    
    let turnoAtual = null;
    let mensagem = "";
    
    if (minutosDoDia >= inicioManha && minutosDoDia <= fimManha) {
        turnoAtual = "manha";
        mensagem = "Preenchimento da escala do turno da Manhã pendente.";
    } else if (minutosDoDia >= inicioTarde && minutosDoDia <= fimTarde) {
        turnoAtual = "tarde";
        mensagem = "Preenchimento da escala do turno da Tarde pendente.";
    } else if (minutosDoDia >= inicioNoite && minutosDoDia <= fimNoite) {
        turnoAtual = "noite";
        mensagem = "Preenchimento da escala do turno da Noite pendente.";
    }
    
    if (!turnoAtual) {
        pararAlertaTituloAba(); // Desliga o piscar se estiver fora do horário
        const toastExistente = document.getElementById('toast-lembrete-escala');
        if (toastExistente) toastExistente.remove();
        return;
    }
    
    // Chave única para controle do dia (ex: lembrete_escala_14-7-2026_manha)
    const diaString = `${agora.getDate()}-${agora.getMonth() + 1}-${agora.getFullYear()}`;
    const chaveLembreteConcluido = `lembrete_escala_${diaString}_${turnoAtual}`;
    
    // 1. Verifica se o usuário já marcou como feito
    if (localStorage.getItem(chaveLembreteConcluido) === 'true') {
        pararAlertaTituloAba();
        const toastExistente = document.getElementById('toast-lembrete-escala');
        if (toastExistente) toastExistente.remove();
        return;
    }
    
    // 2. Verifica se já preencheu proativamente pelo menos algum plantonista desse turno
    let escalaDadosTemp = {};
    try {
        const dadosSalvos = localStorage.getItem('escala_diaria_dados');
        if (dadosSalvos) escalaDadosTemp = JSON.parse(dadosSalvos);
    } catch(e) {}
    
    const sufixoTurno = turnoAtual === 'manha' ? 'M' : (turnoAtual === 'tarde' ? 'T' : 'N');
    const jaPreencheuAlgum = Object.entries(escalaDadosTemp).some(([id, valor]) => {
        const coincideTurno = id.endsWith(sufixoTurno) || (turnoAtual === 'manha' && id === 'text_46');
        return coincideTurno && valor && valor.trim() !== '';
    });
    
    if (jaPreencheuAlgum) {
        localStorage.setItem(chaveLembreteConcluido, 'true');
        pararAlertaTituloAba();
        const toastExistente = document.getElementById('toast-lembrete-escala');
        if (toastExistente) toastExistente.remove();
        return;
    }
    
    // 3. Verifica o intervalo de 15 minutos (900000ms) desde o último lembrete disparado
    const chaveUltimoDisparo = `lembrete_ultimo_disparo_${turnoAtual}`;
    const ultimoDisparoStr = localStorage.getItem(chaveUltimoDisparo);
    const agoraTimestamp = agora.getTime();
    
    if (!ultimoDisparoStr || (agoraTimestamp - parseInt(ultimoDisparoStr, 10)) >= 15 * 60 * 1000) {
        exibirToastLembrete(turnoAtual, mensagem, chaveLembreteConcluido, chaveUltimoDisparo, agoraTimestamp);
    }
}

function exibirToastLembrete(turno, mensagem, chaveConcluido, chaveUltimoDisparo, timestamp) {
    localStorage.setItem(chaveUltimoDisparo, timestamp.toString());
    
    // Evita duplicados
    const toastExistente = document.getElementById('toast-lembrete-escala');
    if (toastExistente) toastExistente.remove();
    
    // Configurações visuais dinâmicas baseadas no turno
    let corIcone = "#6c757d";
    let bgIcone = "rgba(108, 117, 125, 0.15)";
    let icone = "bi-bell-fill";
    let classeTurnoToast = "toast-turno-manha";

    if (turno === "manha") {
        corIcone = "#0ea5e9";
        bgIcone = "rgba(14, 165, 233, 0.15)";
        icone = "bi-sun";
        classeTurnoToast = "toast-turno-manha";
    } else if (turno === "tarde") {
        corIcone = "#fd7e14";
        bgIcone = "rgba(253, 126, 20, 0.15)";
        icone = "bi-sun-fill";
        classeTurnoToast = "toast-turno-tarde";
    } else if (turno === "noite") {
        corIcone = "#6366f1";
        bgIcone = "rgba(99, 102, 241, 0.15)";
        icone = "bi-moon-stars-fill";
        classeTurnoToast = "toast-turno-noite";
    }

    const toast = document.createElement('div');
    toast.id = 'toast-lembrete-escala';
    toast.className = `toast-escala-lembrete-container shadow-lg border ${classeTurnoToast}`;
    
    toast.innerHTML = `
        <div class="toast-escala-body d-flex align-items-start gap-3">
            <div class="toast-escala-icon rounded-3 d-flex align-items-center justify-content-center" style="width: 42px; height: 42px; font-size: 1.3rem; flex-shrink: 0; color: ${corIcone}; background-color: ${bgIcone};">
                <i class="bi ${icone}"></i>
            </div>
            <div class="toast-escala-content text-start flex-grow-1">
                <span class="d-block fw-bold text-dark" style="font-size: 0.9rem; font-family: 'Outfit', sans-serif;">Lembrete de Escala</span>
                <span class="d-block text-muted mt-1" style="font-size: 0.8rem; line-height: 1.4;">${mensagem}</span>
                <div class="d-flex gap-2 mt-3">
                    <button type="button" class="btn btn-sm btn-escala-toast-preencher fw-bold" id="btn-lembrete-escrever" style="font-size: 0.72rem; border-radius: 8px; padding: 6px 12px;">
                        Preencher Escala
                    </button>
                    <button type="button" class="btn btn-sm btn-light border fw-bold text-secondary" id="btn-lembrete-concluido" style="font-size: 0.72rem; border-radius: 8px; padding: 6px 12px;">
                        Confirmar Conclusão
                    </button>
                </div>
            </div>
            <button type="button" class="btn-close ms-2" style="font-size: 0.75rem;"></button>
        </div>
        <div class="toast-progress-bar-container">
            <div id="toast-progress-bar" class="toast-progress-bar"></div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Inicia a redução da barra de progresso horizontal
    setTimeout(() => {
        const progressBar = toast.querySelector('#toast-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
    }, 100);

    // Configura o autodismiss automático em 15 segundos
    const autodismissTimeout = setTimeout(() => {
        toast.classList.add('toast-saida');
        setTimeout(() => {
            toast.remove();
            pararAlertaTituloAba();
        }, 400);
    }, 15000);
    
    // Event Listeners dos botões
    toast.querySelector('#btn-lembrete-escrever').addEventListener('click', () => {
        clearTimeout(autodismissTimeout);
        navegarMenu('tela-escala-diaria');
        setTimeout(() => {
            const botaoTurno = document.querySelector(`.btn-turno[data-turno="${turno}"]`);
            if (botaoTurno) botaoTurno.click();
        }, 150);
        toast.classList.add('toast-saida');
        setTimeout(() => {
            toast.remove();
            pararAlertaTituloAba();
        }, 400);
    });
    
    toast.querySelector('#btn-lembrete-concluido').addEventListener('click', () => {
        clearTimeout(autodismissTimeout);
        localStorage.setItem(chaveConcluido, 'true');
        toast.classList.add('toast-saida');
        setTimeout(() => {
            toast.remove();
            pararAlertaTituloAba();
        }, 400);
    });

    toast.querySelector('.btn-close').addEventListener('click', () => {
        clearTimeout(autodismissTimeout);
        toast.classList.add('toast-saida');
        setTimeout(() => {
            toast.remove();
            pararAlertaTituloAba();
        }, 400);
    });
    
    // Inicia alerta visual na aba do navegador
    iniciarAlertaTituloAba(`Pendente: Escala Diária`);
}

function iniciarAlertaTituloAba(mensagemAlerta) {
    pararAlertaTituloAba();
    if (!tituloOriginalAba) {
        tituloOriginalAba = document.title || "Termos 24H";
    }
    let mostrarAlerta = true;
    
    intervalTituloAba = setInterval(() => {
        document.title = mostrarAlerta ? mensagemAlerta : tituloOriginalAba;
        mostrarAlerta = !mostrarAlerta;
    }, 1200);
}

function pararAlertaTituloAba() {
    if (intervalTituloAba) {
        clearInterval(intervalTituloAba);
        intervalTituloAba = null;
    }
    if (tituloOriginalAba) {
        document.title = tituloOriginalAba;
    }
}

// --- SISTEMA DE MODO ESCURO GLOBAL ---
let modoEscuroGlobal = false;
function toggleModoEscuroGlobal() {
    modoEscuroGlobal = !modoEscuroGlobal;
    const body = document.body;
    const btnGlobal = document.getElementById('btn-modo-escuro-global');
    
    if (modoEscuroGlobal) {
        body.classList.add('modo-escuro-global');
        if (btnGlobal) {
            btnGlobal.innerHTML = '<i class="bi bi-sun"></i>';
        }
        localStorage.setItem('modo_escuro_global', 'true');
    } else {
        body.classList.remove('modo-escuro-global');
        if (btnGlobal) {
            btnGlobal.innerHTML = '<i class="bi bi-moon"></i>';
        }
        localStorage.setItem('modo_escuro_global', 'false');
    }
}

// --- TESTADOR TEMPORÁRIO DO LEMBRETE FLUTUANTE ---
function testarLembreteToast() {
    const agora = new Date();
    const diaString = `${agora.getDate()}-${agora.getMonth() + 1}-${agora.getFullYear()}`;
    
    // Limpa estados de conclusão anteriores para permitir o teste imediato
    localStorage.removeItem(`lembrete_escala_${diaString}_manha`);
    localStorage.removeItem(`lembrete_escala_${diaString}_tarde`);
    localStorage.removeItem(`lembrete_escala_${diaString}_noite`);
    localStorage.removeItem(`lembrete_ultimo_disparo_manha`);
    localStorage.removeItem(`lembrete_ultimo_disparo_tarde`);
    localStorage.removeItem(`lembrete_ultimo_disparo_noite`);
    
    const horas = agora.getHours();
    let turno = "manha";
    let mensagem = "Preenchimento da escala do turno da Manhã pendente.";
    
    if (horas >= 12 && horas < 18) {
        turno = "tarde";
        mensagem = "Preenchimento da escala do turno da Tarde pendente.";
    } else if (horas >= 18 || horas < 7) {
        turno = "noite";
        mensagem = "Preenchimento da escala do turno da Noite pendente.";
    }
    
    exibirToastLembrete(turno, mensagem, `lembrete_escala_${diaString}_${turno}`, `lembrete_ultimo_disparo_${turno}`, agora.getTime());
}

