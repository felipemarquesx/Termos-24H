// ==========================================================================
// MÓDULO: GUIAS MÉDICAS (SADT / INTERNAÇÃO)
// ==========================================================================
// Este arquivo gerencia a validação de dados cadastrais das operadoras de saúde
// (Amil, Unimed, Bradesco, etc.), máscaras dinâmicas de input, e faz o preenchimento
// automático de guias do tipo SADT e guias de Internação Hospitalar.
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

        // E. Impressão sem abrir nova janela/aba: Atualiza o iframe invisível permanente na página
        const iframeOculto = obterIframeImpressao();
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
            }, 300);
        };

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

        // Usa o iframe invisível permanente
        const iframeOculto = obterIframeImpressao();
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
            }, 300);
        };

    } catch (erroGeral) {
        console.error("Erro ao imprimir a Guia de Internação:", erroGeral);
        alert(`Opa! Ocorreu um erro ao imprimir a guia da ${nomeOperadora}.\n\nDetalhes: ${erroGeral.message}`);
    } finally {
        // Restaura o estado visual original do logotipo
        logoElemento.style.pointerEvents = '';
        logoElemento.style.opacity = '';
    }
}

// Retorna ou cria o iframe permanente para impressões seguras (sem expirar)
function obterIframeImpressao() {
    let iframe = document.getElementById('iframe-impressao-permanente');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'iframe-impressao-permanente';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
    }
    return iframe;
}

