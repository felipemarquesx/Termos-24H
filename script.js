// Estado global do formulário
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
function mudarTela(deId, paraId) {
    const deTela = document.getElementById(deId);
    const paraTela = document.getElementById(paraId);

    if (!deTela || !paraTela) return;

    // Atualizações automáticas do título e favicon da aba
    if (paraId === 'tela-menu-principal') {
        atualizarAbaNavegador('Termos 24H', './assets/Initial.png');
    } else if (paraId === 'tela-sadt') {
        atualizarAbaNavegador('Guias SADT', './assets/Initial.png');
    } else if (paraId === 'tela-selecao-termos') {
        atualizarAbaNavegador('Termos 24H', './assets/Initial.png');
    } else if (paraId === 'tela-guias-internacao') {
        atualizarAbaNavegador('Guias de Internação', './assets/Initial.png');
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

    // 1. Coloca a nova tela no fluxo HTML
    paraTela.style.display = 'block';
    paraTela.classList.add('escondida');

    // Força reflow (recalculo de estilos pelo navegador) para registrar a classe .escondida
    paraTela.offsetHeight;

    // 2. Executa a transição suave de Fade + Zoom
    deTela.classList.add('escondida');
    paraTela.classList.remove('escondida');

    // 3. Oculta a tela anterior do fluxo após a animação (400ms)
    setTimeout(() => {
        deTela.style.display = 'none';
    }, 400);
}

// --- Navegação Sidebar ---
function navegarMenu(paraId) {
    // Descobre qual tela está visível atualmente
    const telas = ['tela-menu-principal', 'tela-selecao-termos', 'tela-sadt', 'tela-formulario', 'tela-guias-internacao'];
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
        'tela-guias-internacao': 'menu-internacao'
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

// --- Navegação entre Telas ---
function abrirFormulario(tipo) {
    termoAtual = tipo;
    
    // Limpa qualquer dado residual do formulário antes de abrir o novo convênio para evitar vazamento
    const form = document.getElementById('form-termos');
    if (form) {
        form.reset();
        form.querySelectorAll('[data-raw]').forEach(el => el.removeAttribute('data-raw'));
    }
    document.querySelectorAll('.campo-obrigatorio').forEach(input => {
        input.classList.remove('valido');
    });
    atualizarConformidadeFormulario();
    
    // Transiciona da tela de seleção de termos para a tela do formulário
    mudarTela('tela-selecao-termos', 'tela-formulario');

    const titulo = document.getElementById('titulo-form');
    const labelCartao = document.getElementById('label-cartao');
    const camposFusex = document.querySelectorAll('.campos-fusex');
    
    // Altera a classe de tema do card do formulário para aplicar as cores corretas nos inputs
    const formCard = document.querySelector('#tela-formulario .card');
    if (formCard) {
        if (tipo === 'fusma') {
            formCard.classList.add('tema-fusma');
            formCard.classList.remove('tema-fusex');
        } else if (tipo === 'fusex') {
            formCard.classList.add('tema-fusex');
            formCard.classList.remove('tema-fusma');
        }
    }

    if (tipo === 'fusma') {
        titulo.innerText = 'Preenchendo Termo: FUSMA';
        labelCartao.innerText = 'N° do Cartão ou NIP:';
        // Ocultação de campos específicos do convênio FUSEX
        camposFusex.forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });
        atualizarAbaNavegador('Termo FUSMA', './assets/fusma/FusmaPage.png');
    } else if (tipo === 'fusex') {
        titulo.innerText = 'Preenchendo Termo: FUSEX';
        labelCartao.innerText = 'N° do Cartão ou Prec-CP:';
        // Exibição dos campos específicos do FUSEX
        camposFusex.forEach(el => {
            if (el.id === 'btn-copiar-whatsapp') {
                el.style.setProperty('display', 'flex', 'important');
            } else {
                el.style.display = 'block';
            }
        });
        atualizarAbaNavegador('Termo FUSEX', './assets/fusex/FusexPage.png');
    }

    // Validação de integridade inicial após navegação
    atualizarConformidadeFormulario();
}

function voltarInicio() {
    const form = document.getElementById('form-termos');
    if (form) {
        form.reset();
        form.querySelectorAll('[data-raw]').forEach(el => el.removeAttribute('data-raw'));
    }
    document.querySelectorAll('.campo-obrigatorio').forEach(input => {
        input.classList.remove('valido');
    });
    atualizarConformidadeFormulario();

    // Retorna para a tela de seleção de termos (FUSMA/FUSEX)
    mudarTela('tela-formulario', 'tela-selecao-termos');
}

// Reset de dados do atendimento
function limparDados() {
    if (confirm("Tem certeza que deseja limpar todos os campos para o próximo paciente?")) {
        const form = document.getElementById('form-termos');
        form.reset();
        form.querySelectorAll('[data-raw]').forEach(el => el.removeAttribute('data-raw'));
        // Limpeza de classes de validação do formulário
        document.querySelectorAll('.campo-obrigatorio').forEach(input => {
            input.classList.remove('valido');
        });
        // Atualização de conformidade cadastral
        atualizarConformidadeFormulario();
    }
}

// --- Tratamento de Saída da Página ---
window.addEventListener('beforeunload', function (e) {
    const temAlgoPreenchido = Array.from(document.querySelectorAll('.salva-local')).some(input => input.value !== '');

    if (temAlgoPreenchido) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// --- Geração Automática de Carimbo Cronológico ---
function obterPeriodoDia(horaStr) {
    if (!horaStr) return '';
    const partes = horaStr.split(':');
    if (partes.length < 2) return '';
    const horas = parseInt(partes[0], 10);
    if (isNaN(horas)) return '';
    if (horas >= 6 && horas < 12) return 'Manhã';
    if (horas >= 12 && horas < 18) return 'Tarde';
    if (horas >= 18 && horas < 24) return 'Noite';
    return 'Madrugada';
}

function obterNomeMes(mesNumero) {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[mesNumero - 1] || '';
}

function formatarCampoData(input) {
    const val = input.value.trim();
    if (val.length === 10) {
        const partes = val.split('/');
        if (partes.length === 3) {
            const dia = parseInt(partes[0], 10);
            const mes = parseInt(partes[1], 10);
            const ano = parseInt(partes[2], 10);
            const mesNome = obterNomeMes(mes);
            if (!isNaN(dia) && mesNome && !isNaN(ano)) {
                input.setAttribute('data-raw', val);
                const hoje = new Date();
                if (dia === hoje.getDate() && mes === (hoje.getMonth() + 1) && ano === hoje.getFullYear()) {
                    input.value = `Hoje, Dia ${dia} de ${mesNome} de ${ano}`;
                } else {
                    input.value = `Dia ${dia} de ${mesNome} de ${ano}`;
                }
            }
        }
    } else if (val === '') {
        input.removeAttribute('data-raw');
    }
}

function formatarCampoHora(input) {
    const val = input.value.trim();
    if (val.length === 5 && val.includes(':')) {
        const periodo = obterPeriodoDia(val);
        if (periodo) {
            input.setAttribute('data-raw', val);
            
            // Verifica se a data preenchida é a de hoje
            const dataInput = document.getElementById('data_atendimento');
            const dataRaw = dataInput ? dataInput.getAttribute('data-raw') : '';
            let eHoje = true;
            if (dataRaw) {
                const hoje = new Date();
                const dia = String(hoje.getDate()).padStart(2, '0');
                const mes = String(hoje.getMonth() + 1).padStart(2, '0');
                const ano = hoje.getFullYear();
                if (dataRaw !== `${dia}/${mes}/${ano}`) {
                    eHoje = false;
                }
            }
            
            if (eHoje) {
                input.value = `Hoje às ${val} da ${periodo}`;
            } else {
                input.value = `Às ${val} da ${periodo}`;
            }
        }
    } else if (val === '') {
        input.removeAttribute('data-raw');
    }
}

function preencherDataAtual() {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    
    const input = document.getElementById('data_atendimento');
    if (input) {
        input.value = `${dia}/${mes}/${ano}`;
        formatarCampoData(input);
        
        // Sincroniza o campo de hora caso ele já esteja preenchido
        const horaInput = document.getElementById('hora_atendimento');
        if (horaInput && horaInput.getAttribute('data-raw')) {
            horaInput.value = horaInput.getAttribute('data-raw');
            formatarCampoHora(horaInput);
        }
        atualizarConformidadeFormulario();
    }
}

function preencherHoraAtual() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    
    const input = document.getElementById('hora_atendimento');
    if (input) {
        input.value = `${horas}:${minutos}`;
        formatarCampoHora(input);
        atualizarConformidadeFormulario();
    }
}

// --- Processamento de Protocolo e Emissão de PDF ---
// Apresentação do checklist de conformidade administrativa
// Abre o modal de checklist real (ex: FUSMA ou FUSEX)
function exibirModalChecklistReal() {
    const modalEl = document.getElementById('modal-atencao');
    if (modalEl) {
        // Reset do estado dos checkboxes do checklist
        const checks = document.querySelectorAll('.check-protocolo');
        checks.forEach(chk => {
            chk.checked = false;
            const parentDiv = chk.closest('.form-check');
            if (parentDiv) {
                parentDiv.classList.remove('bg-success-subtle', 'border-success');
                parentDiv.classList.add('bg-light', 'border');
            }
        });

        // Tratamento condicional para o convênio FUSMA (não exige código GE)
        const containerCodigo = document.getElementById('container-chk-codigo');
        const chkCodigo = document.getElementById('chk-codigo-atend');
        if (containerCodigo && chkCodigo) {
            if (termoAtual === 'fusma') {
                containerCodigo.style.setProperty('display', 'none', 'important');
                chkCodigo.checked = true;
            } else {
                containerCodigo.style.setProperty('display', 'flex', 'important');
                chkCodigo.checked = false;
            }
        }

        // Desabilitação inicial do botão de conclusão de fluxo
        const btnFinalizar = document.getElementById('btn-concluir-atendimento');
        if (btnFinalizar) {
            btnFinalizar.setAttribute('disabled', 'true');
        }

        // Atualização de elementos textuais do modal com base no termo ativo
        const nomeForcaText = termoAtual.toUpperCase();
        document.querySelectorAll('.nome-forca').forEach(el => {
            el.innerText = nomeForcaText;
        });

        // Atualização dinâmica do e-mail destinatário do convênio no Checklist
        const emailDestinoTexto = document.getElementById('email-destino-texto');
        if (emailDestinoTexto) {
            if (termoAtual === 'fusma') {
                emailDestinoTexto.innerText = 'valentin.thiago@marinha.mil.br';
            } else if (termoAtual === 'fusex') {
                emailDestinoTexto.innerText = 'p.afusex59bimtz2026@gmail.com';
            } else {
                emailDestinoTexto.innerText = 'E-mail não configurado';
            }
        }

        const meuModal = new bootstrap.Modal(modalEl);
        meuModal.show();
    }
}

// Apresentação do checklist de conformidade administrativa
function abrirModalConfirmacao() {
    // 1. Buscamos todos os campos obrigatórios
    const camposObrigatorios = Array.from(document.querySelectorAll('.campo-obrigatorio'));

    // 2. Filtramos apenas os que estão visíveis na tela no momento
    const camposVisiveisIncompletos = camposObrigatorios.filter(input => {
        const parentFusex = input.closest('.campos-fusex');
        if (parentFusex && parentFusex.style.display === 'none') {
            return false; // Ignora se o campo for específico do outro convênio e estiver oculto
        }
        return !input.classList.contains('valido'); // Pega se não estiver preenchido corretamente
    });

    // 3. Se houver algum campo incompleto, mostramos o modal de alerta personalizado
    if (camposVisiveisIncompletos.length > 0) {
        const modalAlertaEl = document.getElementById('modal-alerta-preenchimento');
        if (modalAlertaEl) {
            const modalAlerta = new bootstrap.Modal(modalAlertaEl);

            // Configura o clique do botão de prosseguir mesmo incompleto
            const btnProsseguir = document.getElementById('btn-prosseguir-incompleto');
            if (btnProsseguir) {
                btnProsseguir.onclick = function () {
                    modalAlerta.hide();

                    // Pequeno atraso para o Bootstrap terminar a animação de esconder antes de abrir o outro
                    modalAlertaEl.addEventListener('hidden.bs.modal', function handler() {
                        exibirModalChecklistReal();
                        modalAlertaEl.removeEventListener('hidden.bs.modal', handler);
                    });
                };
            }

            modalAlerta.show();
        }
    } else {
        // Se tudo estiver 100% preenchido, abre direto o checklist de confirmação
        exibirModalChecklistReal();
    }
}

// Validação lógica do checklist de conformidade
function verificarChecklist() {
    const checks = document.querySelectorAll('.check-protocolo');
    let todosMarcados = true;

    checks.forEach(chk => {
        const parentDiv = chk.closest('.form-check');
        if (chk.checked) {
            if (parentDiv) {
                parentDiv.classList.remove('bg-light', 'border');
                parentDiv.classList.add('bg-success-subtle', 'border-success');
            }
        } else {
            todosMarcados = false;
            if (parentDiv) {
                parentDiv.classList.remove('bg-success-subtle', 'border-success');
                parentDiv.classList.add('bg-light', 'border');
            }
        }
    });

    const btnFinalizar = document.getElementById('btn-concluir-atendimento');
    if (btnFinalizar) {
        if (todosMarcados) {
            btnFinalizar.removeAttribute('disabled');
        } else {
            btnFinalizar.setAttribute('disabled', 'true');
        }
    }
}

// Dispara o download/processamento real do PDF
async function executarDownloadPDFReal() {
    let urlPDF = '';
    let listaCampos = [];
    let nomeTermoFormatado = '';

    // Define a configuração de campos e caminhos com base no termo atual
    if (termoAtual === 'fusex') {
        urlPDF = './assets/fusex/termo_fusex_preenchivel.pdf';
        nomeTermoFormatado = 'FUSEX';
        listaCampos = [
            'numero_cartao',
            'numero_atendimento',
            'numero_ge',
            'hora_atendimento',
            'data_atendimento',
            'militar_autorizou',
            'nome_paciente',
            'data_nascimento',
            'telefone',
            'especialidade'
        ];
    } else if (termoAtual === 'fusma') {
        urlPDF = './assets/fusma/termo_fusma_preenchivel.pdf';
        nomeTermoFormatado = 'FUSMA';
        listaCampos = [
            'numero_cartao',
            'numero_atendimento',
            'hora_atendimento',
            'data_atendimento',
            'nome_paciente',
            'data_nascimento',
            'telefone',
            'especialidade'
        ];
    } else {
        alert("Nenhum termo válido foi selecionado!");
        return;
    }

    // Selecionamos o botão de impressão para aplicar feedbacks visuais enquanto processa
    const btnImprimir = document.querySelector('#modal-atencao button[onclick="executarDownloadPDFReal()"]');
    let textoBotaoOriginal = "";
    if (btnImprimir) {
        textoBotaoOriginal = btnImprimir.innerHTML;
        btnImprimir.setAttribute('disabled', 'true');
        btnImprimir.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando Termo ${nomeTermoFormatado}...`;
    }

    try {
        // 1. Carrega o arquivo PDF que está na sua pasta assets
        const resposta = await fetch(urlPDF);

        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar o arquivo PDF do ${nomeTermoFormatado}. Status: ${resposta.status}`);
        }

        const arrayBufferPDF = await resposta.arrayBuffer();

        // 2. Desembrulha a biblioteca global PDFLib carregada via CDN
        const { PDFDocument } = PDFLib;
        const documentoPDF = await PDFDocument.load(arrayBufferPDF);

        // 3. Resgata o formulário interativo de dentro do arquivo PDF
        const formulario = documentoPDF.getForm();

        // 4. Mapeamento dos campos do HTML com os campos do PDF
        listaCampos.forEach(idCampo => {
            try {
                const elementoInput = document.getElementById(idCampo);
                if (elementoInput) {
                    const valorDigitado = elementoInput.getAttribute('data-raw') || elementoInput.value.trim();
                    const campoTextoPDF = formulario.getTextField(idCampo);

                    if (campoTextoPDF) {
                        campoTextoPDF.setText(valorDigitado);
                    }
                }
            } catch (erroCampo) {
                console.warn(`[PDF-LIB] Aviso no campo "${idCampo}": ele pode não existir exatamente no PDF ou no HTML.`, erroCampo);
            }
        });

        // 5. Salva o documento modificado gerando uma cadeia de bytes binários
        const bytesFinaisPDF = await documentoPDF.save();

        // 6. Transforma esses bytes brutos em um objeto URL temporário (Blob) no navegador
        const blobPDF = new Blob([bytesFinaisPDF], { type: 'application/pdf' });
        const urlBlobFinal = URL.createObjectURL(blobPDF);

        // 7. Abre o PDF em uma aba nova para que o navegador lide com a impressão padrão
        window.open(urlBlobFinal, '_blank');

    } catch (erroGeral) {
        console.error("Erro no processamento do PDF:", erroGeral);
        alert(`Eita! Ocorreu um erro ao gerar o PDF do ${nomeTermoFormatado}.\n\nDetalhe técnico: ${erroGeral.message}\n\nVerifique se o arquivo '${urlPDF}' está realmente dentro da pasta 'assets'.`);
    } finally {
        // Restaura o botão para o estado original
        if (btnImprimir) {
            btnImprimir.removeAttribute('disabled');
            btnImprimir.innerHTML = textoBotaoOriginal;
        }
    }
}

// Fluxo de encerramento do atendimento
function concluirAtendimentoFluxoFinal() {
    const modalEl = document.getElementById('modal-atencao');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
        modalInstance.hide();
    }

    const form = document.getElementById('form-termos');
    form.reset();
    form.querySelectorAll('[data-raw]').forEach(el => el.removeAttribute('data-raw'));
    voltarInicio();
}

// --- Máscara de Formatação de Data ---
// Formatação em tempo real no padrão DD/MM/AAAA para data de nascimento e atendimento
function configurarMascarasData() {
    const camposData = ['data_nascimento', 'data_atendimento'];
    camposData.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', (evento) => {
                let valor = evento.target.value;
                // Filtragem numérica e formatação estrutural do input
                let apenasNumeros = valor.replace(/\D/g, '').slice(0, 8);

                let formatado = '';
                if (apenasNumeros.length > 0) {
                    formatado += apenasNumeros.slice(0, 2);
                }
                if (apenasNumeros.length > 2) {
                    formatado += '/' + apenasNumeros.slice(2, 4);
                }
                if (apenasNumeros.length > 4) {
                    formatado += '/' + apenasNumeros.slice(4, 8);
                }

                evento.target.value = formatado;

            });
        }
    });
}

// --- Máscara de Formatação de Hora ---
// Formatação em tempo real no padrão HH:MM para hora do atendimento
function configurarMascaraHora() {
    const input = document.getElementById('hora_atendimento');
    if (input) {
        input.addEventListener('input', (evento) => {
            let valor = evento.target.value;
            // Filtra apenas números e limita a 4 dígitos (HHMM)
            let apenasNumeros = valor.replace(/\D/g, '').slice(0, 4);

            let formatado = '';
            if (apenasNumeros.length > 0) {
                formatado += apenasNumeros.slice(0, 2);
            }
            if (apenasNumeros.length > 2) {
                formatado += ':' + apenasNumeros.slice(2, 4);
            }

            evento.target.value = formatado;
        });
    }
}

// Inicializa a escuta dos campos de data e hora
configurarMascarasData();
configurarMascaraHora();

// --- Dropdown de Especialidades ---
function configurarDropdownEspecialidades() {
    const input = document.getElementById('especialidade');
    const dropdown = document.getElementById('dropdown-especialidades');

    if (!input || !dropdown) return;

    // Controle de exibição no evento focus
    input.addEventListener('focus', () => {
        dropdown.style.display = 'block';
    });

    dropdown.querySelectorAll('.dropdown-item-custom').forEach(item => {
        // Captura de valor no mousedown para evitar conflitos com blur
        item.addEventListener('mousedown', (evento) => {
            const valor = evento.target.getAttribute('data-valor');
            input.value = valor;

            dropdown.style.display = 'none';
            atualizarConformidadeFormulario();
        });
    });

    // Fechamento de menu no clique externo ao container
    document.addEventListener('mousedown', (evento) => {
        if (!input.contains(evento.target) && !dropdown.contains(evento.target)) {
            dropdown.style.display = 'none';
        }
    });
}

// Inicializa a escuta do dropdown de especialidades
configurarDropdownEspecialidades();

// --- Monitoramento de Conformidade do Prontuário ---
function configurarMonitoramentoConformidade() {
    const form = document.getElementById('form-termos');
    if (!form) return;

    form.addEventListener('input', atualizarConformidadeFormulario);

    const dataAtend = document.getElementById('data_atendimento');
    const horaAtend = document.getElementById('hora_atendimento');

    if (dataAtend) {
        dataAtend.addEventListener('focus', function() {
            const raw = this.getAttribute('data-raw');
            if (raw) {
                this.value = raw;
            }
        });
        
        dataAtend.addEventListener('blur', function() {
            formatarCampoData(this);
            // Sincroniza o campo de hora caso a data mude para hoje ou outro dia
            const horaInput = document.getElementById('hora_atendimento');
            if (horaInput && horaInput.getAttribute('data-raw')) {
                horaInput.value = horaInput.getAttribute('data-raw');
                formatarCampoHora(horaInput);
            }
            atualizarConformidadeFormulario();
        });
    }

    if (horaAtend) {
        horaAtend.addEventListener('focus', function() {
            const raw = this.getAttribute('data-raw');
            if (raw) {
                this.value = raw;
            }
        });

        horaAtend.addEventListener('blur', function() {
            formatarCampoHora(this);
            atualizarConformidadeFormulario();
        });
    }
}

// Processamento da métrica de preenchimento obrigatório
function atualizarConformidadeFormulario() {
    const campos = Array.from(document.querySelectorAll('.campo-obrigatorio'));

    // Filtragem dos inputs ativos sob a regra de exibição de cada convênio
    const camposVisiveis = campos.filter(input => {
        const parentFusex = input.closest('.campos-fusex');
        if (parentFusex && parentFusex.style.display === 'none') {
            return false;
        }
        return true;
    });

    let preenchidosValidos = 0;

    camposVisiveis.forEach(input => {
        const valor = input.getAttribute('data-raw') || input.value.trim();
        let campoValido = false;

        if (input.id === 'data_nascimento' || input.id === 'data_atendimento') {
            campoValido = valor.length === 10;
        } else if (input.id === 'hora_atendimento') {
            campoValido = valor.length === 5;
        } else if (input.id === 'telefone') {
            campoValido = valor.length >= 8;
        } else {
            campoValido = valor.length > 0;
        }

        if (campoValido) {
            preenchidosValidos++;
            input.classList.add('valido');
        } else {
            input.classList.remove('valido');
        }
    });

    const totalCampos = camposVisiveis.length;
    const percentual = totalCampos > 0 ? Math.round((preenchidosValidos / totalCampos) * 100) : 0;

    // Renderização de feedbacks visuais da barra de integridade
    const progressBar = document.getElementById('barra-progresso-form');
    const badgeStatus = document.getElementById('status-conformidade');

    if (progressBar) {
        progressBar.style.width = `${percentual}%`;
        progressBar.setAttribute('aria-valuenow', percentual);

        if (percentual < 50) {
            progressBar.className = 'progress-bar bg-danger';
            progressBar.style.backgroundColor = '';
        } else if (percentual < 100) {
            progressBar.className = 'progress-bar bg-warning text-dark';
            progressBar.style.backgroundColor = '';
        } else {
            progressBar.className = 'progress-bar bg-success';
            progressBar.style.backgroundColor = '';
        }
    }

    if (badgeStatus) {
        badgeStatus.innerText = `Conformidade: ${percentual}%`;
        if (percentual === 100) {
            badgeStatus.className = 'badge bg-success text-white fw-bold px-3 py-2';
        } else if (percentual >= 50) {
            badgeStatus.className = 'badge bg-warning text-dark fw-bold px-3 py-2';
        } else {
            badgeStatus.className = 'badge bg-danger text-white fw-bold px-3 py-2';
        }
    }

    // --- Liberação de Ações Baseada em Requisitos Cadastrais (FUSEX) ---
    const btnCopiar = document.getElementById('btn-copiar-whatsapp');
    if (btnCopiar) {
        const nome = document.getElementById('nome_paciente').value.trim();
        const nascimento = document.getElementById('data_nascimento').value.trim();
        const precCp = document.getElementById('numero_cartao').value.trim();
        const especialidade = document.getElementById('especialidade').value.trim();

        // Validação de requisitos de preenchimento para exportação
        const nomeValido = nome.length > 0;
        const nascimentoValido = nascimento.length === 10;
        const precCpValido = precCp.length > 0;
        const especialidadeValida = especialidade.length > 0;

        if (nomeValido && nascimentoValido && precCpValido && especialidadeValida) {
            btnCopiar.removeAttribute('disabled');
            btnCopiar.classList.remove('btn-secondary');
            btnCopiar.classList.add('btn-success');
            btnCopiar.title = "Clique para copiar os dados";

            const iconeSpan = document.getElementById('icone-copiar-whatsapp');
            if (iconeSpan) {
                iconeSpan.innerHTML = `<i class="bi bi-copy"></i>`;
            }
        } else {
            btnCopiar.setAttribute('disabled', 'true');
            btnCopiar.classList.remove('btn-success');
            btnCopiar.classList.add('btn-secondary');
            btnCopiar.title = "Preencha Nome, Nascimento, Prec-CP e Especialidade para liberar";

            const iconeSpan = document.getElementById('icone-copiar-whatsapp');
            if (iconeSpan) {
                iconeSpan.innerHTML = `<i class="bi bi-lock-fill"></i>`;
            }
        }
    }
}

// Inicializa a auditoria de conformidade
configurarMonitoramentoConformidade();

// --- Processamento de Cópia FUSEX ---
// Formatação e exportação dos dados de identificação para a área de transferência
function copiarDadosWhatsAppFUSEX() {
    const nome = document.getElementById('nome_paciente').value.trim();
    const nascimento = document.getElementById('data_nascimento').value.trim();
    const precCp = document.getElementById('numero_cartao').value.trim();
    const especialidade = document.getElementById('especialidade').value.trim();

    // Valida se os campos mínimos exigidos pelo soldado foram preenchidos
    if (!nome || !nascimento || !precCp || !especialidade) {
        exibirToastAvisoPreenchimento();
        return;
    }

    const mensagemWhatsApp = `*Solicitação de senha (GE) - FUSEX*\n\n` +
        `• *Nome completo:* ${nome}\n` +
        `• *Data de nascimento:* ${nascimento}\n` +
        `• *Prec-CP:* ${precCp}\n` +
        `• *Especialidade:* ${especialidade}\n` +
        `• *Nome do militar autorizador por favor?* `;

    navigator.clipboard.writeText(mensagemWhatsApp).then(() => {
        exibirToastWhatsApp();
    }).catch(err => {
        console.error('Erro ao copiar dados: ', err);
        alert("Não foi possível copiar automaticamente. Selecione e copie o texto abaixo:\n\n" + mensagemWhatsApp);
    });
}

// Exibição de feedback temporário (Toast de sucesso)
function exibirToastWhatsApp() {
    const toastAntigo = document.querySelector('.toast-whatsapp');
    if (toastAntigo) {
        toastAntigo.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-whatsapp';

    toast.innerHTML = `
        <span style="font-size: 0.9rem; color: #1e3a5f; font-weight: 600; text-align: left;">
            Dados coletados! Enviar para pedir senha pro FUSEX.
        </span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 6000);
}

// Exibição de feedback temporário (Toast de aviso)
function exibirToastAvisoPreenchimento() {
    const toastAntigo = document.querySelector('.toast-whatsapp');
    if (toastAntigo) {
        toastAntigo.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-whatsapp';

    toast.innerHTML = `
        <span style="font-size: 0.9rem; color: #a05000; font-weight: 600; text-align: left; display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-exclamation-triangle-fill" style="color: #a05000; font-size: 1.1rem; flex-shrink: 0;"></i>
            Preencha primeiramente antes de copiar.
        </span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 6000);
}

// ==========================================================================
// 🚀 LÓGICA E INTERATIVIDADE DO MODAL GUIAS SADT
// ==========================================================================

function inicializarSadt() {
    const inputCarteirinha = document.getElementById('sadt-carteirinha');
    const inputValidade = document.getElementById('sadt-vld-cart');
    const inputNome = document.getElementById('sadt-nome');
    const cardsOperadoras = document.querySelectorAll('.sadt-logo');

    if (!inputCarteirinha || !inputValidade || !inputNome) {
        console.warn("[SADT] Elementos do formulário não encontrados na página.");
        return;
    }

    // 1. MÁSCARA AUTOMÁTICA DE DATA (Validade)
    inputValidade.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não é número
        
        if (valor.length > 8) {
            valor = valor.substring(0, 8);
        }
        
        if (valor.length > 2 && valor.length <= 4) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2);
        } else if (valor.length > 4) {
            valor = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4, 8);
        }
        
        e.target.value = valor;
        verificarCamposSadt();
    });

    // Escuta eventos nos outros inputs para liberar os planos
    inputCarteirinha.addEventListener('input', verificarCamposSadt);
    inputNome.addEventListener('input', verificarCamposSadt);

    // 2. DETECTOR DE CLIQUES NOS CARDS
    cardsOperadoras.forEach(card => {
        card.addEventListener('click', async () => {
            const nomeOperadora = card.getAttribute('data-operadora');
            const nomeArquivoPDF = card.getAttribute('data-pdf');

            if (nomeOperadora && nomeArquivoPDF) {
                await gerarPdfSadt(card, nomeOperadora, nomeArquivoPDF);
            }
        });
    });

    // Os campos da tela SADT são limpos automaticamente ao sair da página, dentro da função mudarTela()
}

// 3. AUDITORIA DE PREENCHIMENTO DOS CAMPOS
function verificarCamposSadt() {
    // As operadoras ficam sempre disponíveis por solicitação da recepção (permite impressão em branco)
    const cardsOperadoras = document.querySelectorAll('.sadt-logo');
    cardsOperadoras.forEach(card => {
        card.classList.remove('disabled');
    });
}

// 4. PREENCHIMENTO INTELIGENTE DO PDF E IMPRESSÃO DIRETA (IFRAME OCULTO)
async function gerarPdfSadt(logoElemento, nomeOperadora, nomeArquivoPDF) {
    const urlPDF = `./assets/guias sadt/${nomeArquivoPDF}`;
    
    try {
        // Mostra estado de carregamento sutil na imagem do logotipo (opacidade piscando)
        logoElemento.style.pointerEvents = 'none';
        logoElemento.style.opacity = '0.3';

        // A. Carrega o arquivo template PDF da operadora de saúde
        const resposta = await fetch(urlPDF);
        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar o arquivo '${nomeArquivoPDF}' na pasta 'assets/guias sadt'.`);
        }

        const arrayBufferPDF = await resposta.arrayBuffer();

        // B. Instancia a biblioteca PDF-Lib e inicializa o formulário
        const { PDFDocument } = PDFLib;
        const documentoPDF = await PDFDocument.load(arrayBufferPDF);
        const formulario = documentoPDF.getForm();
        const campos = formulario.getFields();

        // Valores digitados
        const valorCarteirinha = document.getElementById('sadt-carteirinha').value.trim();
        const valorValidade = document.getElementById('sadt-vld-cart').value.trim();
        const valorNome = document.getElementById('sadt-nome').value.trim();

        // Garante que a data de validade seja enviada perfeitamente formatada (DD/MM/AAAA) para o PDF
        const apenasNumeros = valorValidade.replace(/\D/g, '');
        let valorValidadeFormatada = valorValidade;
        if (apenasNumeros.length === 8) {
            valorValidadeFormatada = apenasNumeros.substring(0, 2) + '/' + apenasNumeros.substring(2, 4) + '/' + apenasNumeros.substring(4, 8);
        }

        // C. Mapeamento Flexível Inteligente (evita que o usuário dependa de IDs exatos nos PDFs)
        campos.forEach(campo => {
            try {
                if (campo.constructor.name === 'PDFTextField' || typeof campo.setText === 'function') {
                    const nomeCampoRaw = campo.getName().toLowerCase();
                    // Remove acentos e caracteres especiais para comparação segura
                    const nomeCampo = nomeCampoRaw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                    // CASO 1: Nome do beneficiário (procura por "nome", "beneficiario", "paciente", "nomecompleto")
                    if (nomeCampo.includes('nome') || nomeCampo.includes('beneficiario') || nomeCampo.includes('paciente') || nomeCampo.includes('nomecompleto')) {
                        campo.setText(valorNome);
                    } 
                    // CASO 2: Validade da carteirinha (procura por "valid", "venc", "vcto", "val", "expira", "data_val")
                    // Colocado primeiro que o caso da carteirinha para não dar conflito com nomes compostos como "validade_carteira"
                    else if (nomeCampo.includes('valid') || nomeCampo.includes('venc') || nomeCampo.includes('vcto') || nomeCampo.includes('val') || nomeCampo.includes('expira')) {
                        campo.setText(valorValidadeFormatada);
                    } 
                    // CASO 3: Carteirinha (procura por "carteira", "num", "matricula", "codigo", "registro", "benef", "cartao")
                    // Evitamos que dê match em campos que tenham termos de nome ou validade
                    else if (nomeCampo.includes('carteira') || nomeCampo.includes('num') || nomeCampo.includes('matricula') || nomeCampo.includes('codigo') || nomeCampo.includes('registro') || nomeCampo.includes('benef') || nomeCampo.includes('cartao')) {
                        if (!nomeCampo.includes('nome') && !nomeCampo.includes('valid') && !nomeCampo.includes('venc') && !nomeCampo.includes('vcto') && !nomeCampo.includes('val')) {
                            campo.setText(valorCarteirinha);
                        }
                    }
                }
            } catch (erroCampo) {
                console.warn(`[PDF-LIB] Erro sutil ao tentar preencher o campo "${campo.getName()}":`, erroCampo);
            }
        });

        // D. Salva o PDF modificado na memória e gera o Blob URL
        const bytesFinaisPDF = await documentoPDF.save();
        const blobPDF = new Blob([bytesFinaisPDF], { type: 'application/pdf' });
        const urlBlobFinal = URL.createObjectURL(blobPDF);

        // Aponta para a imagem estática de documento fornecida pelo usuário na pasta de ícones
        const urlFavicon = `${window.location.origin}/assets/icons_operadoras_de_saude/DOCUMENTO.png`;

        // E. Impressão sem abrir nova janela/aba: Injeta um iframe invisível na página atual
        const iframeOculto = document.createElement('iframe');
        iframeOculto.style.position = 'fixed';
        iframeOculto.style.right = '0';
        iframeOculto.style.bottom = '0';
        iframeOculto.style.width = '0';
        iframeOculto.style.height = '0';
        iframeOculto.style.border = 'none';
        iframeOculto.style.visibility = 'hidden';
        iframeOculto.src = urlBlobFinal;

        // Dispara a impressão assim que o PDF for carregado no iframe oculto
        iframeOculto.onload = function() {
            setTimeout(function() {
                try {
                    iframeOculto.contentWindow.focus();
                    iframeOculto.contentWindow.print();
                } catch (e) {
                    console.error("[SADT] Falha ao tentar imprimir diretamente pelo iframe:", e);
                    // Fallback em caso extremo de bloqueio: abre em nova aba
                    window.open(urlBlobFinal, '_blank');
                }
                
                // Limpa o elemento do DOM depois de um tempo seguro (5 segundos)
                setTimeout(() => {
                    if (document.body.contains(iframeOculto)) {
                        document.body.removeChild(iframeOculto);
                    }
                }, 5000);
            }, 300);
        };

        document.body.appendChild(iframeOculto);

    } catch (erroGeral) {
        console.error("Erro no processamento do PDF da Guia SADT:", erroGeral);
        alert(`Opa! Ocorreu um erro ao preencher a guia da ${nomeOperadora}.\n\nDetalhes: ${erroGeral.message}`);
    } finally {
        // Restaura o estado visual original do logotipo limpando as propriedades inline
        logoElemento.style.pointerEvents = '';
        logoElemento.style.opacity = '';
    }
}

// 5. TOAST DE AVISO QUANDO TENTA CLICAR BLOQUEADO
function exibirToastAvisoSadtBloqueado() {
    const toastAntigo = document.querySelector('.toast-whatsapp');
    if (toastAntigo) {
        toastAntigo.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'toast-whatsapp';
    toast.style.border = '1.5px solid rgba(220, 53, 69, 0.15)'; // Borda leve vermelha de atenção

    toast.innerHTML = `
        <span style="font-size: 0.9rem; color: #dc3545; font-weight: 600; text-align: left; display: flex; align-items: center; gap: 8px;">
            <i class="bi bi-exclamation-circle-fill" style="color: #dc3545; font-size: 1.1rem; flex-shrink: 0;"></i>
            Insira a Carteirinha, Validade e Nome para desbloquear os planos de saúde!
        </span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// --- Função: Abrir Webmail Seguro e Enviar E-mail do Convênio ---
function abrirWebmailAutomatico() {
    // 1. Coleta o e-mail do destinatário correto dependendo do termo atual
    let emailDestinatario = '';
    if (termoAtual === 'fusma') {
        emailDestinatario = 'valentin.thiago@marinha.mil.br';
    } else if (termoAtual === 'fusex') {
        emailDestinatario = 'p.afusex59bimtz2026@gmail.com';
    } else {
        alert("Nenhum termo ativo foi detectado!");
        return;
    }

    // 2. Coleta as variáveis do formulário na tela
    const nomeInput = document.getElementById('nome_paciente');
    const dataInput = document.getElementById('data_atendimento');
    const horaInput = document.getElementById('hora_atendimento');

    // Nome com fallback caso não esteja preenchido
    const nome = (nomeInput && nomeInput.value.trim()) ? nomeInput.value.trim() : 'Paciente não identificado';

    // Gerador de data e hora do sistema para caso os inputs estejam em branco
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');

    const dataSistema = `${dia}/${mes}/${ano}`;
    const horaSistema = `${horas}:${minutos}`;

    const dataVal = (dataInput) ? (dataInput.getAttribute('data-raw') || dataInput.value.trim()) : '';
    const horaVal = (horaInput) ? (horaInput.getAttribute('data-raw') || horaInput.value.trim()) : '';

    const data = dataVal ? dataVal : dataSistema;
    const hora = horaVal ? horaVal : horaSistema;

    // 3. Descobre o período do dia com base nos plantões:
    // - Manhã: das 04:00 às 11:59
    // - Tarde: das 12:00 às 17:59
    // - Noite: das 18:00 às 23:59
    // - Madrugada: das 00:00 às 03:59
    let periodo = 'Dia';
    if (hora) {
        const partesHora = hora.split(':');
        const horaNum = parseInt(partesHora[0], 10);
        if (!isNaN(horaNum)) {
            if (horaNum >= 4 && horaNum < 12) {
                periodo = 'Manhã';
            } else if (horaNum >= 12 && horaNum < 18) {
                periodo = 'Tarde';
            } else if (horaNum >= 18 && horaNum < 24) {
                periodo = 'Noite';
            } else {
                periodo = 'Madrugada';
            }
        }
    }

    // 4. Monta o assunto: "Termo e Documentação - (Nome) - Atendido em [Data] às [Hora]H da/do [Período]"
    const artigo = (periodo === 'Dia') ? 'do' : 'da';
    const assuntoStr = `Termo e Documentação - (${nome}) - Atendido em ${data} às ${hora}H ${artigo} ${periodo}`;

    // 5. Codifica as informações de forma segura para caber na URL do e-mail
    const emailCodificado = encodeURIComponent(emailDestinatario);
    const assuntoCodificado = encodeURIComponent(assuntoStr);

    // URL do Webmail Seguro (Roundcube) conforme o exemplo fornecido
    const urlFinal = `https://webmail-seguro.com.br/v2/?_task=mail&_action=compose&_to=${emailCodificado}&_subject=${assuntoCodificado}`;

    // 5. Abre a aba com o webmail carregado e pronto
    window.open(urlFinal, '_blank');

    // 6. Automatização Extra: Marca o checklist de e-mail enviado automaticamente
    const chkEmail = document.getElementById('chk-email-enviado');
    if (chkEmail) {
        chkEmail.checked = true;
        verificarChecklist(); // Atualiza a cor verde e valida o botão final de conclusão
    }
}

// ==========================================================================
// 🚀 LÓGICA E IMPRESSÃO DE GUIAS DE INTERNAÇÃO (CLIQUE E IMPRIME)
// ==========================================================================

function inicializarInternacao() {
    const cardsInternacao = document.querySelectorAll('.internacao-logo');

    cardsInternacao.forEach(card => {
        card.addEventListener('click', async () => {
            const nomeOperadora = card.getAttribute('data-operadora');
            const nomeArquivoPDF = card.getAttribute('data-pdf');

            if (nomeOperadora && nomeArquivoPDF) {
                await imprimirGuiaInternacao(card, nomeOperadora, nomeArquivoPDF);
            }
        });
    });
}

async function imprimirGuiaInternacao(logoElemento, nomeOperadora, nomeArquivoPDF) {
    const urlPDF = `./assets/guias internacao/${nomeArquivoPDF}`;
    
    try {
        // Mostra estado de carregamento sutil no logotipo (opacidade piscando)
        logoElemento.style.pointerEvents = 'none';
        logoElemento.style.opacity = '0.3';

        // Cria o iframe invisível
        const iframeOculto = document.createElement('iframe');
        iframeOculto.style.position = 'fixed';
        iframeOculto.style.right = '0';
        iframeOculto.style.bottom = '0';
        iframeOculto.style.width = '0';
        iframeOculto.style.height = '0';
        iframeOculto.style.border = 'none';
        iframeOculto.style.visibility = 'hidden';
        iframeOculto.src = urlPDF;

        // Dispara a impressão assim que o PDF for carregado
        iframeOculto.onload = function() {
            setTimeout(function() {
                try {
                    iframeOculto.contentWindow.focus();
                    iframeOculto.contentWindow.print();
                } catch (e) {
                    console.error("[Internação] Falha ao tentar imprimir diretamente pelo iframe:", e);
                    // Fallback seguro em nova aba
                    window.open(urlPDF, '_blank');
                }
                
                // Limpa o DOM após 5 segundos
                setTimeout(() => {
                    if (document.body.contains(iframeOculto)) {
                        document.body.removeChild(iframeOculto);
                    }
                }, 5000);
            }, 300);
        };

        document.body.appendChild(iframeOculto);

    } catch (erroGeral) {
        console.error("Erro ao imprimir a Guia de Internação:", erroGeral);
        alert(`Opa! Ocorreu um erro ao imprimir a guia da ${nomeOperadora}.\n\nDetalhes: ${erroGeral.message}`);
    } finally {
        // Restaura o estado visual original do logotipo
        logoElemento.style.pointerEvents = '';
        logoElemento.style.opacity = '';
    }
}

// Inicializar a lógica da SADT, Internação e o Relógio do Dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    inicializarSadt();
    inicializarInternacao();
    iniciarRelogioDashboard();
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