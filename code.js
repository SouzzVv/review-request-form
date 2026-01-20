const inputsData = document.querySelectorAll('.data-mask');

inputsData.forEach(function(input) {
    input.addEventListener('input', function(e) {
        var valor = e.target.value;
        
    valor = valor.replace(/\D/g, ""); 
    
    valor = valor.replace(/(\d{2})(\d)/, "$1/$2"); 
    
    valor = valor.replace(/(\d{2})(\d)/, "$1/$2"); 
    
    e.target.value = valor;
    });
});
function gerarExcel() {
    try {
        // --- FUNÇÕES AJUDANTES ---
        // Pega valor pelo ID ou Classe de forma segura
        function getVal(selector, index = 0) {
            let el;
            if (selector.startsWith('#')) {
                el = document.getElementById(selector.replace('#', ''));
            } else {
                el = document.querySelectorAll(selector)[index];
            }
            // Remove quebras de linha (Enter) para não quebrar o Excel
            return el ? el.value.replace(/(\r\n|\n|\r)/gm, " ").trim() : "";
        }

        // --- 1. CAPTURA DE DADOS ---
        
        // Vamos guardar tudo numa lista de objetos { titulo: "...", valor: "..." }
        let campos = [];

        // Cabeçalho Básico
        campos.push({ t: "SR N°", v: getVal('.input-date', 0) });
        campos.push({ t: "Data", v: getVal('.input-date', 1) });

        // Checkbox (Tipo de Doc)
        let tipoDoc = "";
        document.getElementsByName('tipo_doc').forEach(r => {
            if (r.checked) tipoDoc = r.parentElement.innerText.trim();
        });
        campos.push({ t: "Tipo Documento", v: tipoDoc });

        // Inputs do Header
        campos.push({ t: "Solicitado Por", v: getVal('.input-Fheader', 0) });
        campos.push({ t: "Cód. Docto", v: getVal('.input-Fheader', 1) });
        campos.push({ t: "Cód. Item", v: getVal('.input-Fheader', 2) });
        campos.push({ t: "Setor", v: getVal('.input-Fheader', 3) });
        campos.push({ t: "Revisão", v: getVal('.input-Fheader', 4) });

        // Textareas
        campos.push({ t: "Motivo", v: getVal('#motivo') });
        campos.push({ t: "Descrição", v: getVal('#descrição') });

        // --- 2. ANÁLISE CRÍTICA (ATUALIZADO PARA RADIOS) ---
        
        // Pega as colunas que ainda são de TEXTO (Nome, Data e Motivo caso reprove)
        let colNomes = document.querySelectorAll('#b1 .input-analise');
        let colDatas = document.querySelectorAll('#b4 .input-analise');
        let colMotivosNOK = document.querySelectorAll('#b5 .input-analise');

        // Loop para as 4 linhas da tabela
        for (let i = 0; i < 4; i++) {
            let nome = colNomes[i].value.trim();
            let data = colDatas[i].value.trim();
            
            // Verifica qual Radio está marcado na linha atual (names: a1, a2, a3, a4)
            let status = "";
            let radiosLinha = document.getElementsByName(`a${i+1}`); // a1, a2...
            
            radiosLinha.forEach(r => {
                if (r.checked) {
                    status = r.value; // Pega "OK" ou "NOK"
                }
            });

            // Lógica do Parecer Final
            let parecer = "";
            if (status === "OK") {
                parecer = "OK";
            } else if (status === "NOK") {
                // Se for NOK, pega o motivo escrito na última coluna
                let motivoTexto = colMotivosNOK[i].value.trim();
                parecer = `NOK: ${motivoTexto}`;
            }

            // Só adiciona no Excel se tiver algum dado na linha
            if (nome || parecer || data) {
                campos.push({ t: `Análise ${i+1} (Nome)`, v: nome });
                campos.push({ t: `Análise ${i+1} (Data)`, v: data });
                campos.push({ t: `Análise ${i+1} (Parecer)`, v: parecer });
            }
        }
        
        // --- 3. RODAPÉ ---
        // Verifica se marcou SIM ou NÃO no treinamento
        let necTreinamento = "";
        let radiosTreino = document.getElementsByName('nec-treinamento');
        if (radiosTreino[0].checked) necTreinamento = "SIM";
        if (radiosTreino[1].checked) necTreinamento = "NÃO";
        
        campos.push({ t: "Necessário Treinamento", v: necTreinamento });
        if(necTreinamento === "SIM"){
            campos.push({ t: "LNT", v: getVal('#treinamento') });
        }

        campos.push({ t: "Aprovado Por", v: getVal('.input-footer', 0) });
        campos.push({ t: "Data Aprovação", v: getVal('.input-footer', 1) });

        // --- 4. FILTRAGEM (A MÁGICA) ---
        // Cria uma nova lista SÓ com o que tem valor preenchido
        let camposPreenchidos = campos.filter(item => item.v !== "" && item.v !== "Não Informado");

        // Se não tiver nada preenchido (muito difícil), evita erro
        if (camposPreenchidos.length === 0) {
            alert("O formulário está vazio!");
            return;
        }

        // --- 5. GERAÇÃO DO CSV ---
        // Monta a linha de Títulos e a linha de Valores separadas
        let linhaTitulos = camposPreenchidos.map(c => c.t).join(";");
        let linhaValores = camposPreenchidos.map(c => c.v).join(";");

        let conteudoCsv = "\uFEFF" + linhaTitulos + "\n" + linhaValores + "\n";

        // --- 6. DOWNLOAD ---
        let blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' });
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        let nomeArquivo = campos[0].v ? `Solicitacao_${campos[0].v}.csv` : 'Solicitacao_Revisao.csv';
        
        link.setAttribute("href", url);
        link.setAttribute("download", nomeArquivo);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (erro) {
        console.error(erro);
        alert("Erro ao gerar! Veja o console (F12).");
    }
}