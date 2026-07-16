// ==========================================================================
// SISTEMA: ESCALA DIÁRIA DE PLANTONISTAS (HOSPITAL)
// ==========================================================================
// Este arquivo gerencia o formulário step-by-step de preenchimento dos turnos
// (Manhã, Tarde, Noite), o salvamento local automático (localStorage) dos plantões,
// a barra de progresso visual, e a renderização final do PDF preenchido
// exportando em imagem JPEG de alta definição.
// ==========================================================================

let escalaDados = {}; // Guarda os valores digitados indexados pelo nome do campo
try {
    const hoje = new Date().toDateString(); // Formato padrão estável sem fuso horário: "Tue Jul 14 2026"
    const dataSalva = localStorage.getItem('escala_diaria_data_salvamento');

    if (dataSalva && dataSalva === hoje) {
        // Mesmo dia: recupera os dados salvos
        const dadosSalvos = localStorage.getItem('escala_diaria_dados');
        if (dadosSalvos) {
            escalaDados = JSON.parse(dadosSalvos);
        }
    } else {
        // Mudança de data ou primeiro acesso: purga os registros do dia anterior
        localStorage.removeItem('escala_diaria_dados');
        localStorage.removeItem('escala_diaria_data_salvamento');
        localStorage.removeItem('escala_diaria_persistir_ativo');
    }
} catch (e) {
    console.warn("Erro ao carregar dados da escala do localStorage:", e);
}

// Banco de dados dinâmico de sugestões de profissionais (salvo localmente no navegador)
let profissionaisCadastrados = {
    clinicos: [],
    cirurgiao: [],
    cardiologista: [],
    ortopedista: [],
    recepcao: [],
    agente: [],
    caixa: [],
    gesso: [],
    raio_x: [],
    enfermagem: []
};

// Carrega os profissionais aprendidos do localStorage
try {
    const dadosCadastrados = localStorage.getItem('escala_diaria_profissionais');
    if (dadosCadastrados) {
        profissionaisCadastrados = JSON.parse(dadosCadastrados);
        
        // Higienização automática do banco de profissionais (remove nomes curtos ou fragmentos)
        let higienizado = false;
        const prefixosProibidos = ['dr', 'dra', 'dr.', 'dra.', 'enf', 'enf.', 'tec', 'tec.', 'enfa', 'enfa.'];
        for (const grupo in profissionaisCadastrados) {
            if (Array.isArray(profissionaisCadastrados[grupo])) {
                const originalLength = profissionaisCadastrados[grupo].length;
                profissionaisCadastrados[grupo] = profissionaisCadastrados[grupo].filter(nome => {
                    const nomeLimpo = nome.trim();
                    const nomeMin = nomeLimpo.toLowerCase();
                    return nomeLimpo.length >= 3 && nomeLimpo.length <= 17 && !prefixosProibidos.includes(nomeMin);
                });
                if (profissionaisCadastrados[grupo].length !== originalLength) {
                    higienizado = true;
                }
            }
        }
        if (higienizado) {
            localStorage.setItem('escala_diaria_profissionais', JSON.stringify(profissionaisCadastrados));
        }
    }
} catch (e) {
    console.warn("Erro ao carregar banco de profissionais:", e);
}

// Analisa os nomes digitados na escala e os cadastra permanentemente no banco local
function aprenderProfissionaisDaEscala() {
    let alterado = false;
    const prefixosProibidos = ['dr', 'dra', 'dr.', 'dra.', 'enf', 'enf.', 'tec', 'tec.', 'enfa', 'enfa.'];
    for (const turno of ['manha', 'tarde', 'noite']) {
        const campos = escalaCamposConfig[turno];
        if (!campos) continue;
        for (const campo of campos) {
            const valor = escalaDados[campo.id];
            if (valor) {
                const nomeLimpo = valor.trim();
                const nomeMin = nomeLimpo.toLowerCase();
                if (nomeLimpo.length >= 3 && nomeLimpo.length <= 17 && !prefixosProibidos.includes(nomeMin)) {
                    const grupo = campo.grupo;
                    if (!profissionaisCadastrados[grupo]) {
                        profissionaisCadastrados[grupo] = [];
                    }
                    if (!profissionaisCadastrados[grupo].includes(nomeLimpo)) {
                        profissionaisCadastrados[grupo].push(nomeLimpo);
                        profissionaisCadastrados[grupo].sort();
                        alterado = true;
                    }
                }
            }
        }
    }
    if (alterado) {
        try {
            localStorage.setItem('escala_diaria_profissionais', JSON.stringify(profissionaisCadastrados));
        } catch (e) {
            console.warn("Erro ao salvar banco de profissionais aprendido:", e);
        }
    }
}

// Dispara um pulso visual brilhante na linha conectora que corre do formulário ao PDF
function dispararPulsoLinhaConectora() {
    const linha = document.querySelector('.linha-conectora-escala');
    if (linha) {
        linha.classList.add('pulso-ativo-linha');
        if (linha.timeoutId) clearTimeout(linha.timeoutId);
        linha.timeoutId = setTimeout(() => {
            linha.classList.remove('pulso-ativo-linha');
        }, 450);
    }
}

// Exclui um profissional específico de um grupo no localStorage de sugestões
function excluirSugestaoDaMemoria(grupo, nome, botaoElemento) {
    try {
        const chave = 'escala_diaria_profissionais';
        const dadosLocais = localStorage.getItem(chave);
        if (!dadosLocais) return;

        let profissionais = JSON.parse(dadosLocais);
        if (profissionais[grupo]) {
            // Remove o nome exato da lista do grupo
            profissionais[grupo] = profissionais[grupo].filter(n => n.trim().toLowerCase() !== nome.trim().toLowerCase());
            
            // Grava de volta no localStorage
            localStorage.setItem(chave, JSON.stringify(profissionais));
            
            // Atualiza o objeto de memória ativa
            profissionaisCadastrados = profissionais;

            // Remove a pílula do DOM com um efeito suave de fade
            const tagPai = botaoElemento.closest('.tag-sugestao-inline');
            if (tagPai) {
                tagPai.style.opacity = '0';
                tagPai.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    // Seleciona o container das sugestões
                    const container = tagPai.parentElement;
                    tagPai.remove();
                    
                    // Se não sobrou nenhuma pílula visível, oculta o container
                    if (container && container.querySelectorAll('.tag-sugestao-inline').length === 0) {
                        container.classList.add('d-none');
                        container.innerHTML = '';
                    }
                }, 150);
            }

            if (typeof exibirToastLembrete === 'function') {
                exibirToastLembrete('success', `"${nome}" foi removido do banco local.`);
            }
        }
    } catch (e) {
        console.error("Erro ao excluir sugestão específica do localStorage:", e);
    }
}

let escalaPassoAtual = 0;
let escalaTurnoSelecionado = null; // Inicialmente desativado, nenhum selecionado por padrão

// Agrupamento das perguntas de forma detalhada e label curta para o visual
const escalaCamposConfig = {
    'manha': [
        { id: 'medicos_clinicoM', label: 'Médico Clínico 1 (Manhã)', labelCurta: 'Clínico 1', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico2M', label: 'Médico Clínico 2 (Manhã)', labelCurta: 'Clínico 2', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico3M', label: 'Médico Clínico 3 (Manhã)', labelCurta: 'Clínico 3', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medico_cirurgiaoM', label: 'Médico Cirurgião (Manhã)', labelCurta: 'Cirurgião', icone: 'prescription2', grupo: 'cirurgiao' },
        { id: 'medico_cardiologistaM', label: 'Médico Cardiologista (Manhã)', labelCurta: 'Cardio', icone: 'activity', grupo: 'cardiologista' },
        { id: 'medico_ortopedistaM', label: 'Médico Ortopedista 1 (Manhã)', labelCurta: 'Ortopedista 1', icone: 'bandaid', grupo: 'ortopedista' },
        { id: 'medico_ortopedista2M', label: 'Médico Ortopedista 2 (Manhã)', labelCurta: 'Ortopedista 2', icone: 'bandaid', grupo: 'ortopedista' },
        { id: 'plant_admM', label: 'Recepcionista 1 (Manhã)', labelCurta: 'Recepção 1', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm2M', label: 'Recepcionista 2 (Manhã)', labelCurta: 'Recepção 2', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm3M', label: 'Recepcionista 3 (Manhã)', labelCurta: 'Recepção 3', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm4M', label: 'Recepcionista 4 (Manhã)', labelCurta: 'Recepção 4', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_agenteM', label: 'Agente de Emergência (Manhã)', labelCurta: 'Agente', icone: 'shield-check', grupo: 'agente' },
        { id: 'plant_caixaM', label: 'Caixa (Manhã)', labelCurta: 'Caixa', icone: 'cash-coin', grupo: 'caixa' },
        { id: 'plant_imobiM', label: 'Técnico de Gesso (Manhã)', labelCurta: 'Gesso', icone: 'layers-half', grupo: 'gesso' },
        { id: 'plant_raioM', label: 'Técnico de Raio-X (Manhã)', labelCurta: 'Raio-X', icone: 'lightning-charge', grupo: 'raio_x' },
        { id: 'plant_enfermM', label: 'Enfermagem 1 (Manhã)', labelCurta: 'Enferm. 1', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm2M', label: 'Enfermagem 2 (Manhã)', labelCurta: 'Enferm. 2', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm3M', label: 'Enfermagem 3 (Manhã)', labelCurta: 'Enferm. 3', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm4M', label: 'Enfermagem 4 (Manhã)', labelCurta: 'Enferm. 4', icone: 'capsule', grupo: 'enfermagem' }
    ],
    'tarde': [
        { id: 'medicos_clinicoT', label: 'Médico Clínico 1 (Tarde)', labelCurta: 'Clínico 1', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico2T', label: 'Médico Clínico 2 (Tarde)', labelCurta: 'Clínico 2', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico3T', label: 'Médico Clínico 3 (Tarde)', labelCurta: 'Clínico 3', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medico_cirurgiaoT', label: 'Médico Cirurgião (Tarde)', labelCurta: 'Cirurgião', icone: 'prescription2', grupo: 'cirurgiao' },
        { id: 'medico_cardiologistaT', label: 'Médico Cardiologista (Tarde)', labelCurta: 'Cardio', icone: 'activity', grupo: 'cardiologista' },
        { id: 'medico_ortopedistaT', label: 'Médico Ortopedista 1 (Tarde)', labelCurta: 'Ortopedista 1', icone: 'bandaid', grupo: 'ortopedista' },
        { id: 'medico_ortopedista2T', label: 'Médico Ortopedista 2 (Tarde)', labelCurta: 'Ortopedista 2', icone: 'bandaid', grupo: 'ortopedista' },
        { id: 'plant_admT', label: 'Recepcionista 1 (Tarde)', labelCurta: 'Recepção 1', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm2T', label: 'Recepcionista 2 (Tarde)', labelCurta: 'Recepção 2', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm3T', label: 'Recepcionista 3 (Tarde)', labelCurta: 'Recepção 3', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm4T', label: 'Recepcionista 4 (Tarde)', labelCurta: 'Recepção 4', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_agenteT', label: 'Agente de Emergência (Tarde)', labelCurta: 'Agente', icone: 'shield-check', grupo: 'agente' },
        { id: 'plant_caixaT', label: 'Caixa (Tarde)', labelCurta: 'Caixa', icone: 'cash-coin', grupo: 'caixa' },
        { id: 'plant_imobiT', label: 'Técnico de Gesso (Tarde)', labelCurta: 'Gesso', icone: 'layers-half', grupo: 'gesso' },
        { id: 'plant_raioT', label: 'Técnico de Raio-X (Tarde)', labelCurta: 'Raio-X', icone: 'lightning-charge', grupo: 'raio_x' },
        { id: 'plant_enfermT', label: 'Enfermagem 1 (Tarde)', labelCurta: 'Enferm. 1', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm2T', label: 'Enfermagem 2 (Tarde)', labelCurta: 'Enferm. 2', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm3T', label: 'Enfermagem 3 (Tarde)', labelCurta: 'Enferm. 3', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm4T', label: 'Enfermagem 4 (Tarde)', labelCurta: 'Enferm. 4', icone: 'capsule', grupo: 'enfermagem' }
    ],
    'noite': [
        { id: 'medicos_clinicoN', label: 'Médico Clínico 1 (Noite)', labelCurta: 'Clínico 1', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico2N', label: 'Médico Clínico 2 (Noite)', labelCurta: 'Clínico 2', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medicos_clinico3N', label: 'Médico Clínico 3 (Noite)', labelCurta: 'Clínico 3', icone: 'heart-pulse', grupo: 'clinicos' },
        { id: 'medico_cirurgiaoN', label: 'Médico Cirurgião (Noite)', labelCurta: 'Cirurgião', icone: 'prescription2', grupo: 'cirurgiao' },
        { id: 'medico_cardiologistaN', label: 'Médico Cardiologista (Noite)', labelCurta: 'Cardio', icone: 'activity', grupo: 'cardiologista' },
        { id: 'medico_ortopedistaN', label: 'Médico Ortopedista (Noite)', labelCurta: 'Ortopedista', icone: 'bandaid', grupo: 'ortopedista' },
        { id: 'plant_admN', label: 'Recepcionista 1 (Noite)', labelCurta: 'Recepção 1', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_adm2N', label: 'Recepcionista 2 (Noite)', labelCurta: 'Recepção 2', icone: 'person-badge', grupo: 'recepcao' },
        { id: 'plant_agenteN', label: 'Agente de Emergência (Noite)', labelCurta: 'Agente', icone: 'shield-check', grupo: 'agente' },
        { id: 'plant_caixaN', label: 'Caixa (Noite)', labelCurta: 'Caixa', icone: 'cash-coin', grupo: 'caixa' },
        { id: 'plant_imobiN', label: 'Técnico de Gesso (Noite)', labelCurta: 'Gesso', icone: 'layers-half', grupo: 'gesso' },
        { id: 'plant_raioN', label: 'Técnico de Raio-X (Noite)', labelCurta: 'Raio-X', icone: 'lightning-charge', grupo: 'raio_x' },
        { id: 'plant_enfermN', label: 'Enfermagem 1 (Noite)', labelCurta: 'Enferm. 1', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm2N', label: 'Enfermagem 2 (Noite)', labelCurta: 'Enferm. 2', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm3N', label: 'Enfermagem 3 (Noite)', labelCurta: 'Enferm. 3', icone: 'capsule', grupo: 'enfermagem' },
        { id: 'plant_enferm4N', label: 'Enfermagem 4 (Noite)', labelCurta: 'Enferm. 4', icone: 'capsule', grupo: 'enfermagem' }
    ]
};

// Nomes amigáveis dos grupos profissionais para o botão de pular dinâmico
const escalaGrupoNomes = {
    'clinicos': 'Clínicos',
    'cirurgiao': 'Cirurgiões',
    'cardiologista': 'Cardiologistas',
    'ortopedista': 'Ortopedistas',
    'recepcao': 'Recepcionistas',
    'agente': 'Agentes de Emergência',
    'caixa': 'Caixas',
    'gesso': 'Técnicos de Gesso',
    'raio_x': 'Técnicos de Raio-X',
    'enfermagem': 'Enfermagem'
};

// Variáveis adicionais para renderização do PDF no Canvas
let escalaPdfOriginalBytes = null;
let renderTaskAtiva = null;
let timeoutRenderEscala = null;

// Inicialização da Escala Diária
async function inicializarEscalaDiaria() {
    try {
        // Inicializa a data atual automaticamente
        if (!escalaDados['data_atual']) {
            const agora = new Date();
            const dia = String(agora.getDate()).padStart(2, '0');
            const mes = String(agora.getMonth() + 1).padStart(2, '0');
            const ano = agora.getFullYear();
            escalaDados['data_atual'] = `${dia}/${mes}/${ano}`;
        }

        // Auto-seleciona o turno se houver dados preenchidos na memória
        let turnoAuto = null;
        for (const turno of ['manha', 'tarde', 'noite']) {
            const campos = escalaCamposConfig[turno];
            if (campos) {
                const temDados = campos.some(campo => escalaDados[campo.id] && escalaDados[campo.id].trim() !== '');
                if (temDados) {
                    turnoAuto = turno;
                    break;
                }
            }
        }
        if (turnoAuto) {
            escalaTurnoSelecionado = turnoAuto;
        } else {
            escalaTurnoSelecionado = null;
        }

        // 1. Carrega o PDF original em segundo plano
        await carregarPdfOriginal();

        // 2. Monta o formulário step-by-step
        criarFormularioPassoAPasso();

        // 3. Configura seletores de turno do topo
        configurarSeletoresTurno();

        // 4. Configura o botão de persistência permanente
        configurarBotaoPersistencia();

        // 5. Renderiza o PDF inicial no canvas
        await atualizarVisualPDF();

    } catch (erro) {
        console.error("Erro ao inicializar Escala Diária:", erro);
    }
}

// Configura o comportamento do botão de salvamento persistente da escala
function configurarBotaoPersistencia() {
    const btnPersistir = document.getElementById('btn-persistir-escala');
    if (!btnPersistir) return;

    // Recupera o estado de persistência ativo
    const persistenteAtivo = localStorage.getItem('escala_diaria_persistir_ativo') === 'true';
    if (persistenteAtivo) {
        btnPersistir.classList.add('salvo');
    } else {
        btnPersistir.classList.remove('salvo');
    }

    // Configura o evento de clique
    btnPersistir.addEventListener('click', () => {
        const estaSalvo = btnPersistir.classList.contains('salvo');
        try {
            if (estaSalvo) {
                // Desativa salvamento persistente
                btnPersistir.classList.remove('salvo');
                localStorage.removeItem('escala_diaria_persistir_ativo');
            } else {
                // Ativa salvamento persistente e grava dados atuais
                btnPersistir.classList.add('salvo');
                localStorage.setItem('escala_diaria_persistir_ativo', 'true');
                localStorage.setItem('escala_diaria_dados', JSON.stringify(escalaDados));
                localStorage.setItem('escala_diaria_data_salvamento', new Date().toDateString());
            }
        } catch (e) {
            console.warn("Erro ao alterar configuracao de persistencia:", e);
        }
    });
}

// Carrega o PDF modelo do servidor para a memória
async function carregarPdfOriginal() {
    if (escalaPdfOriginalBytes) return;

    const loader = document.getElementById('escala-pdf-loader');
    if (loader) loader.classList.remove('d-none');

    try {
        const url = 'assets/escala_diaria/Escala_diária_Aovivo_view.pdf?v=' + Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error("Erro ao baixar o PDF modelo");
        escalaPdfOriginalBytes = await response.arrayBuffer();

        // Define o worker do PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    } catch (e) {
        console.error("Falha ao carregar PDF modelo:", e);
    } finally {
        if (loader) loader.classList.add('d-none');
    }
}

// Agenda a renderização do PDF com debounce para suavizar a digitação
function agendarAtualizacaoVisualPDF() {
    if (timeoutRenderEscala) clearTimeout(timeoutRenderEscala);
    timeoutRenderEscala = setTimeout(atualizarVisualPDF, 250);
}

// Atualiza o PDF aplicando os dados e renderiza no canvas
async function atualizarVisualPDF() {
    if (!escalaPdfOriginalBytes) {
        await carregarPdfOriginal();
    }
    if (!escalaPdfOriginalBytes) return;

    const loader = document.getElementById('escala-pdf-loader');
    if (loader) loader.classList.remove('d-none');

    try {
        // 1. Carrega no pdf-lib
        const pdfDoc = await PDFLib.PDFDocument.load(escalaPdfOriginalBytes);
        const form = pdfDoc.getForm();

        // 2. Preenche os campos
        for (const [idCampo, valor] of Object.entries(escalaDados)) {
            try {
                const field = form.getTextField(idCampo);
                if (field) {
                    field.setText(valor || '');
                }
            } catch (e) {
                // Campo inexistente no PDF modelo
            }
        }

        // 3. Salva os bytes
        const pdfBytes = await pdfDoc.save();

        // 4. Renderiza no canvas usando PDF.js
        await renderizarPdfBytesNoCanvas(pdfBytes);

    } catch (e) {
        console.error("Erro ao atualizar PDF ao vivo:", e);
    } finally {
        if (loader) loader.classList.add('d-none');
    }
}

// Renderiza os bytes do PDF no elemento canvas usando a API do PDF.js (com Double Buffering anti-flicker)
async function renderizarPdfBytesNoCanvas(pdfBytes) {
    if (renderTaskAtiva) {
        try {
            renderTaskAtiva.cancel();
        } catch (e) { }
    }

    try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        const canvasVisivel = document.getElementById('escala-pdf-canvas');
        if (!canvasVisivel) return;

        const container = document.getElementById('escala-pdf-container');
        const containerWidth = container ? container.clientWidth - 40 : 600;

        const viewportOriginal = page.getViewport({ scale: 1 });
        const escalaCalculada = containerWidth / viewportOriginal.width;
        const viewport = page.getViewport({ scale: escalaCalculada });

        // Criamos um canvas oculto na memória (offscreen buffer)
        const canvasOculto = document.createElement('canvas');
        canvasOculto.width = viewport.width;
        canvasOculto.height = viewport.height;
        const contextOculto = canvasOculto.getContext('2d');

        const renderContext = {
            canvasContext: contextOculto,
            viewport: viewport
        };

        // Renderiza no buffer em background
        renderTaskAtiva = page.render(renderContext);
        await renderTaskAtiva.promise;
        renderTaskAtiva = null;

        // Copia instantaneamente o desenho pronto para o canvas da tela (Flicker-Free!)
        canvasVisivel.width = viewport.width;
        canvasVisivel.height = viewport.height;
        const contextVisivel = canvasVisivel.getContext('2d');
        contextVisivel.drawImage(canvasOculto, 0, 0);

        // Sincroniza a largura da barra de turnos com o tamanho real do PDF renderizado
        const barraTurnos = document.getElementById('escala-turno-external-bar');
        if (barraTurnos) {
            barraTurnos.style.width = `${viewport.width}px`;
            barraTurnos.style.maxWidth = `${viewport.width}px`;
        }

        // --- Geração Automática de Botões Invisíveis (Hotspots) para Foco Rápido ---
        const overlay = document.getElementById('escala-pdf-overlay');
        if (overlay) {
            overlay.innerHTML = '';
            overlay.style.width = `${viewport.width}px`;
            overlay.style.height = `${viewport.height}px`;

            const annotations = await page.getAnnotations();
            annotations.forEach(annotation => {
                if (annotation.fieldType === 'Tx' && annotation.fieldName) {
                    // Verifica se o ID do campo está em algum dos turnos configurados
                    const campoExiste = Object.values(escalaCamposConfig).some(turnoCampos =>
                        turnoCampos.some(c => c.id === annotation.fieldName)
                    );

                    if (campoExiste) {
                        const rect = viewport.convertToViewportRectangle(annotation.rect);
                        const hotspot = document.createElement('div');
                        hotspot.className = 'escala-hotspot-botao';
                        hotspot.setAttribute('data-campo-id', annotation.fieldName);
                        hotspot.style.position = 'absolute';

                        const x = Math.min(rect[0], rect[2]);
                        const y = Math.min(rect[1], rect[3]);
                        const w = Math.abs(rect[2] - rect[0]);
                        const h = Math.abs(rect[3] - rect[1]);

                        hotspot.style.left = `${x}px`;
                        hotspot.style.top = `${y}px`;
                        hotspot.style.width = `${w}px`;
                        hotspot.style.height = `${h}px`;
                        hotspot.style.pointerEvents = 'auto';
                        hotspot.style.cursor = 'pointer';
                        hotspot.title = `Clique para focar na digitação deste campo`;

                        hotspot.addEventListener('click', (e) => {
                            e.preventDefault();
                            focarCampoPeloId(annotation.fieldName);
                        });

                        overlay.appendChild(hotspot);
                    }
                }
            });
            // Atualiza o destaque visual do campo ativo no PDF
            atualizarFocoHotspotPdf();
        }

    } catch (e) {
        if (e.name !== 'RenderingCancelledException') {
            console.error("Erro ao renderizar PDF no canvas:", e);
        }
    }
}

// Localiza o campo no formulário da direita, altera o turno se necessário, e foca o input correspondente
function focarCampoPeloId(idCampo) {
    // 1. Identifica o turno correspondente com base no sufixo do ID do campo
    let turno = 'manha';
    if (idCampo.endsWith('T')) {
        turno = 'tarde';
    } else if (idCampo.endsWith('N')) {
        turno = 'noite';
    } else if (idCampo.endsWith('M') || idCampo === 'text_46') {
        turno = 'manha';
    }

    // 2. Se o turno selecionado for diferente do atual, muda o turno e recria o formulário
    if (escalaTurnoSelecionado !== turno) {
        escalaTurnoSelecionado = turno;

        // Atualiza a visualização dos botões de turno no topo
        const botoes = document.querySelectorAll('.btn-turno');
        botoes.forEach(b => {
            if (b.getAttribute('data-turno') === turno) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        criarFormularioPassoAPasso();
        rolarPdfParaTurno();
    }

    // 3. Encontra o índice correspondente ao passo no turno selecionado
    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    const indexPasso = camposAtuais.findIndex(c => c.id === idCampo);

    if (indexPasso !== -1) {
        const stepAtual = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);
        const targetStep = document.querySelector(`.escala-step[data-step="${indexPasso}"]`);

        if (stepAtual && targetStep) {
            // Transiciona visualmente os passos no formulário da direita
            stepAtual.classList.remove('active');
            stepAtual.style.display = 'none';

            escalaPassoAtual = indexPasso;

            targetStep.classList.add('active');
            targetStep.style.display = 'block';

            const input = targetStep.querySelector('input');
            if (input) {
                input.focus();
                // Coloca o cursor no final do texto preexistente
                const length = input.value.length;
                input.setSelectionRange(length, length);
            }

            atualizarBotoesNavegacao();
        }
    }
}

// Rola o container do PDF suavemente para a seção do turno selecionado
function rolarPdfParaTurno() {
    const container = document.getElementById('escala-pdf-container');
    if (!container) return;

    let targetScroll = 0;
    if (escalaTurnoSelecionado === 'manha') {
        targetScroll = 0;
    } else if (escalaTurnoSelecionado === 'tarde') {
        targetScroll = container.scrollHeight * 0.32; // Seção intermediária
    } else if (escalaTurnoSelecionado === 'noite') {
        targetScroll = container.scrollHeight; // Base
    }

    container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
    });
}

// Atualiza o título grande no topo do formulário conforme o turno selecionado
function atualizarTituloTurnoGrande() {
    const tituloEl = document.getElementById('escala-turno-titulo-grande');
    const containerPdf = document.getElementById('escala-pdf-container');
    const cardForm = document.querySelector('.card-formulario-escala');

    // Atualização da Prancheta Dinâmica do PDF e do Card de Formulário (Foco Imersivo)
    if (containerPdf) {
        containerPdf.classList.remove('bg-prancheta-manha', 'bg-prancheta-tarde', 'bg-prancheta-noite');
        if (cardForm) {
            cardForm.classList.remove('escala-card-manha', 'escala-card-tarde', 'escala-card-noite');
        }

        if (escalaTurnoSelecionado === 'manha') {
            containerPdf.classList.add('bg-prancheta-manha');
            if (cardForm) cardForm.classList.add('escala-card-manha');
        } else if (escalaTurnoSelecionado === 'tarde') {
            containerPdf.classList.add('bg-prancheta-tarde');
            if (cardForm) cardForm.classList.add('escala-card-tarde');
        } else if (escalaTurnoSelecionado === 'noite') {
            containerPdf.classList.add('bg-prancheta-noite');
            if (cardForm) cardForm.classList.add('escala-card-noite');
        }
    }

    if (!tituloEl) return;

    if (!escalaTurnoSelecionado) {
        tituloEl.innerHTML = '<i class="bi bi-calendar3 me-2" style="color: #6c757d;"></i>Novo Plantão';
        tituloEl.className = "fw-extrabold mb-0 text-secondary d-flex align-items-center";
        return;
    }

    if (escalaTurnoSelecionado === 'manha') {
        tituloEl.innerHTML = '<i class="bi bi-sun me-2" style="color: #0ea5e9;"></i>Plantão Matutino';
        tituloEl.className = "fw-extrabold mb-0 text-manha-gradient d-flex align-items-center";
    } else if (escalaTurnoSelecionado === 'tarde') {
        tituloEl.innerHTML = '<i class="bi bi-sun-fill me-2" style="color: #f59e0b;"></i>Plantão Vespertino';
        tituloEl.className = "fw-extrabold mb-0 text-tarde-gradient d-flex align-items-center";
    } else if (escalaTurnoSelecionado === 'noite') {
        tituloEl.innerHTML = '<i class="bi bi-moon-stars-fill me-2" style="color: #6366f1;"></i>Plantão Noturno';
        tituloEl.className = "fw-extrabold mb-0 text-noite-gradient d-flex align-items-center";
    }
}

// Cria os passos do formulário step-by-step
function criarFormularioPassoAPasso() {
    const container = document.getElementById('escala-step-form');
    const tituloContainer = document.getElementById('escala-titulo-container');
    const navegacaoContainer = document.getElementById('escala-navegacao-container');

    // Atualiza o título em destaque do turno
    atualizarTituloTurnoGrande();

    if (!container) return;
    container.innerHTML = '';

    if (!escalaTurnoSelecionado) {
        if (tituloContainer) tituloContainer.style.display = 'none';
        if (navegacaoContainer) navegacaoContainer.style.display = 'none';

        container.innerHTML = `
            <div class="text-center d-flex flex-column align-items-center justify-content-center h-100" style="min-height: 180px; font-family: 'Plus Jakarta Sans', sans-serif;">
                <div class="icon-circle bg-light text-secondary mb-3 opacity-75" style="width: 54px; height: 54px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; background-color: rgba(30, 58, 95, 0.04) !important; transition: background-color 0.3s ease;">
                    <i class="bi bi-calendar3-week" style="color: #0ea5e9 !important;"></i>
                </div>
                <h4 class="fw-bold mb-2 text-dark" style="font-size: 1rem; font-family: 'Outfit', sans-serif; transition: color 0.3s ease;">Selecione um Plantão</h4>
                <p class="text-muted px-4 mb-0" style="font-size: 0.74rem; max-width: 300px; line-height: 1.45; transition: color 0.3s ease;">
                    Ative um dos turnos no cabeçalho do PDF
                </p>
            </div>
        `;
        atualizarBotoesNavegacao();
        return;
    }

    // Restaura exibição dos elementos do topo ao selecionar um turno
    if (tituloContainer) tituloContainer.style.display = 'block';
    if (navegacaoContainer) navegacaoContainer.style.display = 'flex';

    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    escalaPassoAtual = 0;

    camposAtuais.forEach((campo, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.className = `escala-step ${index === 0 ? 'active' : ''}`;
        stepDiv.setAttribute('data-step', index);

        // Estrutura com suporte a sugestões horizontais inline alinhadas abaixo do input
        stepDiv.innerHTML = `
            <div class="text-start">
                <label for="input-${campo.id}" class="form-label fw-bold d-block text-dark mb-2" style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; color: #1e3a5f;">
                    ${campo.label}
                </label>
                <div class="input-group input-group-lg shadow-sm rounded-4 mt-2">
                    <span class="input-group-text bg-white border-end-0 text-muted" style="border-radius: 12px 0 0 12px;">
                        <i class="bi bi-${campo.icone || 'person-fill'} text-primary opacity-75"></i>
                    </span>
                    <input type="text" class="form-control border-start-0 py-3" id="input-${campo.id}" 
                           placeholder="Digite o nome do plantonista..." 
                           style="border-radius: 0 12px 12px 0 !important; font-size: 0.95rem;"
                           value="${escalaDados[campo.id] || ''}" autocomplete="off" maxlength="17">
                </div>
                <div class="container-sugestoes-inline" id="container-sugestoes-${campo.id}"></div>
            </div>
        `;

        // Manipuladores de eventos para atualização em tempo real
        const input = stepDiv.querySelector('input');
        const containerSugestoes = stepDiv.querySelector('.container-sugestoes-inline');

        // Função interna para preencher o campo com a sugestão e avançar
        function preencherCampoComSugestao(nome) {
            input.value = nome;
            escalaDados[campo.id] = nome;
            containerSugestoes.innerHTML = '';
            
            try {
                localStorage.setItem('escala_diaria_dados', JSON.stringify(escalaDados));
                localStorage.setItem('escala_diaria_data_salvamento', new Date().toDateString());
            } catch (err) { }
            
            agendarAtualizacaoVisualPDF();
            aprenderProfissionaisDaEscala();
            
            // Avança após 150ms para ficar visualmente bonito
            setTimeout(avancarPassoEscala, 150);
        }

        // Evento de digitação para filtrar e mostrar sugestões horizontais inline
        input.addEventListener('input', (e) => {
            const valor = e.target.value;
            escalaDados[campo.id] = valor;
            
            // Grava o valor na memória e persiste no localStorage (Auto-Save)
            try {
                localStorage.setItem('escala_diaria_dados', JSON.stringify(escalaDados));
                localStorage.setItem('escala_diaria_data_salvamento', new Date().toDateString());
            } catch (err) {
                console.warn("Erro ao salvar dados no localStorage:", err);
            }

            // Filtra sugestões da categoria exata se o usuário digitou pelo menos 2 letras
            const grupo = campo.grupo;
            const listaProfissionais = profissionaisCadastrados[grupo] || [];
            
            if (valor.trim().length >= 2 && listaProfissionais.length > 0) {
                const termo = valor.toLowerCase().trim();
                // Filtramos os correspondentes e limitamos a no máximo 2 ou 3 sugestões
                const filtrados = listaProfissionais.filter(nome => nome.toLowerCase().includes(termo)).slice(0, 3);
                
                if (filtrados.length > 0) {
                    containerSugestoes.innerHTML = '';
                    
                    filtrados.forEach((nome) => {
                        const tag = document.createElement('div');
                        tag.className = 'tag-sugestao-inline';
                        tag.setAttribute('data-sugestao', nome);
                        
                        tag.innerHTML = `
                            <span class="sugestao-texto-wrapper d-flex align-items-center"><i class="bi bi-arrow-right-short me-1"></i>${nome}</span>
                            <button type="button" class="btn-excluir-sugestao" title="Excluir esta sugestão da memória" onclick="event.stopPropagation(); excluirSugestaoDaMemoria('${grupo}', '${nome.replace(/'/g, "\\'")}', this)">
                                <i class="bi bi-x"></i>
                            </button>
                        `;
                        
                        tag.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            preencherCampoComSugestao(nome);
                        });
                        
                        containerSugestoes.appendChild(tag);
                    });
                } else {
                    containerSugestoes.innerHTML = '';
                }
            } else {
                containerSugestoes.innerHTML = '';
            }
        });

        // Renderiza o PDF apenas quando o usuário confirmar/sair do campo
        input.addEventListener('change', () => {
            agendarAtualizacaoVisualPDF();
            aprenderProfissionaisDaEscala();
        });

        // Atalhos de teclado (Tab ou ArrowRight aceita a primeira sugestão se houver)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Tab') {
                const primeiraTag = containerSugestoes.querySelector('.tag-sugestao-inline');
                if (primeiraTag && containerSugestoes.children.length > 0 && input.selectionStart === input.value.length) {
                    const sugestao = primeiraTag.getAttribute('data-sugestao');
                    if (sugestao) {
                        e.preventDefault();
                        preencherCampoComSugestao(sugestao);
                    }
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                avancarPassoEscala();
            }
        });

        container.appendChild(stepDiv);
    });

    atualizarBotoesNavegacao();

    // Auto-focus no input ativo
    setTimeout(() => {
        const primeiroInput = container.querySelector('.escala-step.active input');
        if (primeiroInput) primeiroInput.focus();
    }, 150);
}

// Configura os botões de Turno no topo
function configurarSeletoresTurno() {
    const botoes = document.querySelectorAll('.btn-turno');
    botoes.forEach(botao => {
        const turno = botao.getAttribute('data-turno');
        // Inicializa o estado visual
        if (escalaTurnoSelecionado && turno === escalaTurnoSelecionado) {
            botao.classList.add('active');
        } else {
            botao.classList.remove('active');
        }

        // Evita listeners duplicados clonando o nó
        const novoBotao = botao.cloneNode(true);
        botao.parentNode.replaceChild(novoBotao, botao);
    });

    const botoesLimpos = document.querySelectorAll('.btn-turno');
    botoesLimpos.forEach(botao => {
        botao.addEventListener('click', () => {
            const turno = botao.getAttribute('data-turno');

            if (turno === escalaTurnoSelecionado) return;

            // Transição visual de botão ativo
            botoesLimpos.forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            escalaTurnoSelecionado = turno;

            // Recria o formulário step-by-step
            criarFormularioPassoAPasso();

            // Rola o PDF para a seção correta
            rolarPdfParaTurno();
        });
    });
}

// Avança o formulário step-by-step
function avancarPassoEscala() {
    agendarAtualizacaoVisualPDF();
    dispararPulsoLinhaConectora();
    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    if (escalaPassoAtual >= camposAtuais.length - 1) {
        // Fim do formulário: pisca o botão de imprimir para guiar o usuário
        const btnImprimir = document.getElementById('btn-escala-imprimir');
        if (btnImprimir) {
            btnImprimir.classList.add('btn-github-sidebar');
            setTimeout(() => btnImprimir.classList.remove('btn-github-sidebar'), 1500);
        }
        return;
    }

    const stepAtual = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);
    escalaPassoAtual++;
    const proxStep = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);

    if (stepAtual && proxStep) {
        // Passo atual ganha a classe de saída
        stepAtual.classList.add('exit-up');

        // Preparamos o próximo passo para iniciar com blur
        proxStep.style.display = 'block';
        proxStep.style.opacity = '0';
        proxStep.style.filter = 'blur(10px)';
        proxStep.offsetHeight; // Força o reflow do navegador

        setTimeout(() => {
            // Limpamos o estado do anterior
            stepAtual.classList.remove('active', 'exit-up');
            stepAtual.style.display = 'none';

            // Ativamos o próximo com blur sumindo
            proxStep.classList.add('active');
            proxStep.style.opacity = '';
            proxStep.style.filter = '';

            const input = proxStep.querySelector('input');
            if (input) {
                input.focus();
                // Coloca o cursor no final do texto digitado
                const length = input.value.length;
                input.setSelectionRange(length, length);
            }

            atualizarBotoesNavegacao();
        }, 300);
    }
}

// Retrocede o formulário step-by-step com animação elástica suave
function retrocederPassoEscala() {
    agendarAtualizacaoVisualPDF();
    if (escalaPassoAtual <= 0) return;

    const stepAtual = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);
    escalaPassoAtual--;
    const anteriorStep = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);

    if (stepAtual && anteriorStep) {
        // Step atual ganha classe de saída
        stepAtual.style.filter = 'blur(10px)';
        stepAtual.style.opacity = '0';

        // Preparamos o anterior para surgir com blur
        anteriorStep.style.display = 'block';
        anteriorStep.style.opacity = '0';
        anteriorStep.style.filter = 'blur(10px)';
        anteriorStep.offsetHeight; // Força reflow do navegador

        setTimeout(() => {
            // Limpamos o estado do anterior que saiu
            stepAtual.classList.remove('active');
            stepAtual.style.display = 'none';
            stepAtual.style.filter = '';
            stepAtual.style.opacity = '';

            // Ativamos o anterior removendo o blur
            anteriorStep.classList.add('active');
            anteriorStep.style.opacity = '';
            anteriorStep.style.filter = '';

            const input = anteriorStep.querySelector('input');
            if (input) {
                input.focus();
                // Coloca o cursor no final do texto
                const length = input.value.length;
                input.setSelectionRange(length, length);
            }

            atualizarBotoesNavegacao();
        }, 300);
    }
}

// Pula toda a seção profissional atual indo direto para o primeiro campo da próxima seção
function pularSecaoEscala() {
    agendarAtualizacaoVisualPDF();
    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    const campoAtual = camposAtuais[escalaPassoAtual];
    const grupoAtual = campoAtual.grupo;

    // Encontra o índice do primeiro campo do próximo grupo diferente
    let proximoIndice = escalaPassoAtual + 1;
    while (proximoIndice < camposAtuais.length) {
        if (camposAtuais[proximoIndice].grupo !== grupoAtual) {
            break;
        }
        proximoIndice++;
    }

    if (proximoIndice < camposAtuais.length) {
        const stepAtual = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);
        escalaPassoAtual = proximoIndice;
        const proxStep = document.querySelector(`.escala-step[data-step="${escalaPassoAtual}"]`);

        if (stepAtual && proxStep) {
            // Passo atual ganha a classe de saída
            stepAtual.classList.add('exit-up');

            // Preparamos o próximo passo para iniciar com blur
            proxStep.style.display = 'block';
            proxStep.style.opacity = '0';
            proxStep.style.filter = 'blur(10px)';
            proxStep.offsetHeight; // Força reflow

            setTimeout(() => {
                // Limpamos o estado do anterior
                stepAtual.classList.remove('active', 'exit-up');
                stepAtual.style.display = 'none';

                // Ativamos o próximo removendo o blur
                proxStep.classList.add('active');
                proxStep.style.opacity = '';
                proxStep.style.filter = '';

                const input = proxStep.querySelector('input');
                if (input) {
                    input.focus();
                    const length = input.value.length;
                    input.setSelectionRange(length, length);
                }

                atualizarBotoesNavegacao();
            }, 300);
        }
    } else {
        // Se não houver próxima seção, avança normal para o fim
        avancarPassoEscala();
    }
}

// Atualiza o estado dos botões de navegação
function atualizarBotoesNavegacao() {
    const btnAnterior = document.getElementById('btn-escala-anterior');
    const btnProximo = document.getElementById('btn-escala-proximo');

    if (!escalaTurnoSelecionado) {
        if (btnAnterior) btnAnterior.style.display = 'none';
        if (btnProximo) btnProximo.style.display = 'none';
        return;
    }

    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    if (btnAnterior) {
        btnAnterior.style.display = escalaPassoAtual > 0 ? 'block' : 'none';
    }

    if (btnProximo) {
        if (escalaPassoAtual === camposAtuais.length - 1) {
            btnProximo.innerHTML = `Concluído <i class="bi bi-check-circle-fill ms-1"></i>`;
            btnProximo.classList.remove('btn-primary');
            btnProximo.classList.add('btn-success');
        } else {
            btnProximo.innerHTML = `Avançar <i class="bi bi-chevron-right ms-1"></i>`;
            btnProximo.classList.remove('btn-success');
            btnProximo.classList.add('btn-primary');
        }
    }

    // Sincroniza o foco visual do campo ativo na folha do PDF
    atualizarFocoHotspotPdf();
}

// Controla qual campo (hotspot) no PDF brilha indicando o foco da digitação
function atualizarFocoHotspotPdf() {
    // Remove destaque de todos os hotspots
    const hotspots = document.querySelectorAll('.escala-hotspot-botao');
    hotspots.forEach(h => {
        h.classList.remove('hotspot-focado');
    });

    if (!escalaTurnoSelecionado) return;
    const camposAtuais = escalaCamposConfig[escalaTurnoSelecionado];
    if (!camposAtuais || !camposAtuais[escalaPassoAtual]) return;

    const idCampoAtivo = camposAtuais[escalaPassoAtual].id;

    // Destaca o hotspot ativo
    const hotspotAtivo = document.querySelector(`.escala-hotspot-botao[data-campo-id="${idCampoAtivo}"]`);
    if (hotspotAtivo) {
        hotspotAtivo.classList.add('hotspot-focado');
    }
}

// Limpa todos os dados salvos da escala
function limparEscalaDiaria() {
    escalaDados = {};
    escalaPassoAtual = 0;
    escalaTurnoSelecionado = null; // Reseta o turno ativo
    try {
        localStorage.removeItem('escala_diaria_dados');
        localStorage.removeItem('escala_diaria_data_salvamento');
        localStorage.removeItem('escala_diaria_persistir_ativo');
        
        const btnPersistir = document.getElementById('btn-persistir-escala');
        if (btnPersistir) {
            btnPersistir.classList.remove('salvo');
        }
    } catch (e) {
        console.warn("Erro ao limpar dados do localStorage:", e);
    }

    // Limpa o formulário, reseta os botões de turno e atualiza o PDF visual
    configurarSeletoresTurno();
    criarFormularioPassoAPasso();
    agendarAtualizacaoVisualPDF();
}

// Exibe o popover de confirmação de limpeza da escala (cabeçalho)
function mostrarPopoverConfirmacao(event) {
    if (event) {
        event.stopPropagation();
    }
    const popover = document.getElementById('popover-confirmacao-escala');
    if (popover) {
        popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
    }
}

// Oculta o popover de confirmação de limpeza
function ocultarPopoverConfirmacao() {
    const popover = document.getElementById('popover-confirmacao-escala');
    if (popover) {
        popover.style.display = 'none';
    }
}

// Executa a limpeza total após confirmação no popover
function executarLimparEscalaCompleta() {
    limparEscalaDiaria();
    ocultarPopoverConfirmacao();
    if (typeof exibirToastLembrete === 'function') {
        exibirToastLembrete('success', 'Todos os dados da escala foram apagados com sucesso!');
    }
}

// Fecha o popover automaticamente caso o usuário clique em qualquer outra área externa
document.addEventListener('click', (event) => {
    const popover = document.getElementById('popover-confirmacao-escala');
    const btnLimpar = document.getElementById('btn-limpar-escala');
    if (popover && popover.style.display === 'block') {
        if (!popover.contains(event.target) && event.target !== btnLimpar && !btnLimpar.contains(event.target)) {
            ocultarPopoverConfirmacao();
        }
    }
});

// Mantido para compatibilidade e integridade histórica do roteamento
function mostrarConfirmacaoLimparInline() {
    mostrarPopoverConfirmacao();
}
function ocultarConfirmacaoLimparInline() {
    ocultarPopoverConfirmacao();
}
function confirmarLimparEscalaCompleta() {
    mostrarPopoverConfirmacao();
}

// Exporta a escala final preenchida no formato JPG de alta qualidade
async function exportarEscalaComoImagem() {
    const btnExportar = document.getElementById('btn-escala-imprimir-imagem') || document.getElementById('btn-escala-imprimir');
    if (!btnExportar) return;

    const originalText = btnExportar.innerHTML;

    try {
        btnExportar.disabled = true;
        btnExportar.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Exportando...`;

        // 1. Carrega o PDF original do hospital
        const url = 'assets/escala_diaria/EscalaFinal.pdf?v=' + Date.now();
        const pdfBytes = await fetch(url).then(res => res.arrayBuffer());

        // 2. Carrega os bytes no pdf-lib
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        // 3. Preenche todos os campos AcroForm com os dados do objeto escalaDados (100% seguro contra minificação)
        for (const [idCampo, valor] of Object.entries(escalaDados)) {
            try {
                const field = form.getTextField(idCampo);
                if (field) {
                    field.setText(valor || '');
                }
            } catch (e) {
                // Ignora campos que não existem no PDF
            }
        }

        // 4. Achata o formulário (flatten) para que o texto inserido seja rasterizado e se misture ao PDF
        form.flatten();

        // 5. Salva o PDF preenchido e achatado
        const pdfBytesSalvos = await pdfDoc.save();

        // 6. Carrega os bytes gerados usando o PDF.js para renderizar como imagem no canvas
        const pdfData = new Uint8Array(pdfBytesSalvos);
        const carregamentoPdf = pdfjsLib.getDocument({ data: pdfData });
        const pdfJsDoc = await carregamentoPdf.promise;

        // Pegamos a primeira página (escala diária tem apenas 1 página)
        const pagina = await pdfJsDoc.getPage(1);

        // Renderizamos com escala 2.5 para garantir uma resolução de exportação super nítida (Full HD/4K)
        const scaleExportacao = 2.5;
        const viewport = pagina.getViewport({ scale: scaleExportacao });

        // Criamos um canvas temporário e anexamos temporariamente ao DOM (fora da tela)
        // Isso evita que navegadores cortem a renderização offscreen por restrição de GPU
        const canvasExport = document.createElement('canvas');
        canvasExport.width = viewport.width;
        canvasExport.height = viewport.height;
        canvasExport.style.position = 'fixed';
        canvasExport.style.left = '-9999px';
        canvasExport.style.top = '-9999px';
        canvasExport.style.visibility = 'hidden';
        document.body.appendChild(canvasExport);

        const ctxExport = canvasExport.getContext('2d');

        // Configura o fundo branco antes do render para evitar fundos transparentes em formato JPEG
        ctxExport.fillStyle = '#ffffff';
        ctxExport.fillRect(0, 0, canvasExport.width, canvasExport.height);

        const renderContext = {
            canvasContext: ctxExport,
            viewport: viewport
        };

        // Renderiza a página no canvas temporário
        await pagina.render(renderContext).promise;

        // 7. Converte o canvas temporário em um Blob JPEG de alta qualidade (95%)
        const blob = await new Promise((resolve) => {
            canvasExport.toBlob(resolve, 'image/jpeg', 0.95);
        });

        // Gera a imagem em Base64 para o evento de integração do Tampermonkey antes de remover o canvas
        const imgBase64 = canvasExport.toDataURL('image/jpeg', 0.95);

        // Remove o canvas temporário do DOM para limpeza de memória
        if (canvasExport.parentNode) {
            document.body.removeChild(canvasExport);
        }

        if (!blob) {
            throw new Error("Não foi possível rasterizar o canvas em imagem.");
        }

        // 8. Cria a URL do Blob
        const urlBlob = URL.createObjectURL(blob);

        // 9. Dispara o download automático do arquivo JPEG no navegador
        const dataSalva = escalaDados['data_atual'] || '';
        const dataFormatada = dataSalva.replace(/\//g, '-');
        const agora = new Date();
        const horas = String(agora.getHours()).padStart(2, '0');
        const minutos = String(agora.getMinutes()).padStart(2, '0');
        const horaFormatada = `${horas}-${minutos}`;
        const turnosMap = { 'manha': 'Manha', 'tarde': 'Tarde', 'noite': 'Noite' };
        const turnoFormatado = turnosMap[escalaTurnoSelecionado] || 'Escala';
        const nomeArquivo = `Escala_Emergencia_${dataFormatada}_${horaFormatada}_${turnoFormatado}`;

        const linkDownload = document.createElement('a');
        linkDownload.href = urlBlob;
        linkDownload.download = `${nomeArquivo}.jpg`;
        document.body.appendChild(linkDownload);
        linkDownload.click();
        document.body.removeChild(linkDownload);

        // Libera a URL do Blob da memória após o download
        setTimeout(() => {
            URL.revokeObjectURL(urlBlob);
        }, 1000);

        // Fecha o modal de opções se estiver aberto
        const modalEl = document.getElementById('modal-gerar-escala-opcoes');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }

    } catch (erro) {
        console.error("Erro ao exportar escala como imagem:", erro);
        alert(`Opa! Não foi possível exportar a escala como imagem.\n\nDetalhes: ${erro.message}`);
    } finally {
        btnExportar.disabled = false;
        btnExportar.innerHTML = originalText;
    }
}

// Exporta a escala final preenchida no formato PDF oficial
async function exportarEscalaComoPdf() {
    const btnExportarPdf = document.getElementById('btn-escala-baixar-pdf');
    const originalText = btnExportarPdf ? btnExportarPdf.innerHTML : 'Baixar PDF';

    try {
        if (btnExportarPdf) {
            btnExportarPdf.disabled = true;
            btnExportarPdf.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando...`;
        }

        // 1. Carrega o PDF original do hospital
        const url = 'assets/escala_diaria/EscalaFinal.pdf?v=' + Date.now();
        const pdfBytes = await fetch(url).then(res => res.arrayBuffer());

        // 2. Carrega os bytes no pdf-lib
        const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        // 3. Preenche todos os campos AcroForm com os dados do objeto escalaDados
        for (const [idCampo, valor] of Object.entries(escalaDados)) {
            try {
                const field = form.getTextField(idCampo);
                if (field) {
                    field.setText(valor || '');
                }
            } catch (e) {
                // Ignora campos inexistentes
            }
        }

        // 4. Achata o formulário (flatten) para que o texto se misture de forma segura
        form.flatten();

        // 5. Salva o PDF preenchido e achatado
        const pdfBytesSalvos = await pdfDoc.save();
        const blobPDF = new Blob([pdfBytesSalvos], { type: 'application/pdf' });
        const urlBlob = URL.createObjectURL(blobPDF);

        // 6. Dispara o download automático do arquivo PDF no navegador
        const dataSalva = escalaDados['data_atual'] || '';
        const dataFormatada = dataSalva.replace(/\//g, '-');
        const agora = new Date();
        const horas = String(agora.getHours()).padStart(2, '0');
        const minutos = String(agora.getMinutes()).padStart(2, '0');
        const horaFormatada = `${horas}-${minutos}`;
        const turnosMap = { 'manha': 'Manha', 'tarde': 'Tarde', 'noite': 'Noite' };
        const turnoFormatado = turnosMap[escalaTurnoSelecionado] || 'Escala';
        const nomeArquivo = `Escala_Emergencia_${dataFormatada}_${horaFormatada}_${turnoFormatado}`;

        const linkDownload = document.createElement('a');
        linkDownload.href = urlBlob;
        linkDownload.download = `${nomeArquivo}.pdf`;
        document.body.appendChild(linkDownload);
        linkDownload.click();
        document.body.removeChild(linkDownload);

        // Libera a URL do Blob da memória após o download
        setTimeout(() => {
            URL.revokeObjectURL(urlBlob);
        }, 1000);

        // Fecha o modal de opções se estiver aberto
        const modalEl = document.getElementById('modal-gerar-escala-opcoes');
        if (modalEl) {
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
        }

    } catch (erro) {
        console.error("Erro ao exportar escala como PDF:", erro);
        alert(`Opa! Não foi possível exportar a escala como PDF.\n\nDetalhes: ${erro.message}`);
    } finally {
        if (btnExportarPdf) {
            btnExportarPdf.disabled = false;
            btnExportarPdf.innerHTML = originalText;
        }
    }
}



