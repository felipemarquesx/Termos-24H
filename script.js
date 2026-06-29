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

// --- Navegação entre Telas ---
function abrirFormulario(tipo) {
    termoAtual = tipo;
    document.getElementById('tela-inicial').style.display = 'none';
    document.getElementById('tela-formulario').style.display = 'block';

    const titulo = document.getElementById('titulo-form');
    const labelCartao = document.getElementById('label-cartao');
    const camposFusex = document.querySelectorAll('.campos-fusex');

    if (tipo === 'fusma') {
        titulo.innerText = 'Preenchendo Termo: FUSMA';
        labelCartao.innerText = 'N° do Cartão ou NIP:';
        // Ocultação de campos específicos do convênio FUSEX
        camposFusex.forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });
        atualizarAbaNavegador('Termo FUSMA', './assets/FusmaPage.png');
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
        atualizarAbaNavegador('Termo FUSEX', './assets/FusexPage.png');
    }
    
    // Validação de integridade inicial após navegação
    atualizarConformidadeFormulario();
}

function voltarInicio() {
    document.getElementById('tela-formulario').style.display = 'none';
    document.getElementById('tela-inicial').style.display = 'block';
    atualizarAbaNavegador('Termos 24H', './assets/Initial.png');
}

// Reset de dados do atendimento
function limparDados() {
    if (confirm("Tem certeza que deseja limpar todos os campos para o próximo paciente?")) {
        document.getElementById('form-termos').reset();
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
function preencherDataAtual() {
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    document.getElementById('data_atendimento').value = `${dia}/${mes}/${ano}`;
    atualizarConformidadeFormulario();
}

function preencherHoraAtual() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    document.getElementById('hora_atendimento').value = `${horas}:${minutos}`;
    atualizarConformidadeFormulario();
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
                btnProsseguir.onclick = function() {
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
        urlPDF = './assets/termo_fusex_preenchivel.pdf';
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
        urlPDF = './assets/termo_fusma_preenchivel.pdf';
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
                    const valorDigitado = elementoInput.value.trim();
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

    document.getElementById('form-termos').reset();
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

// Inicializa a escuta dos campos de data
configurarMascarasData();

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
        const valor = input.value.trim();
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

    const mensagemWhatsApp = `*Solicitação de Guia de Encaminhamento (GE) - FUSEX*\n\n` +
                             `• *Nome completo:* ${nome}\n` +
                             `• *Data de nascimento:* ${nascimento}\n` +
                             `• *Prec-CP:* ${precCp}\n` +
                             `• *Especialidade:* ${especialidade}`;

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