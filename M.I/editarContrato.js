
import ExcelJS from 'exceljs';
import readlineSync from 'readline-sync';
import path from 'node:path';

const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

const produtos = {
    OLEO: 'OLEO26.xlsx',
    FARELO: 'FARE26.xlsx',
    GRAOS: 'SOJA26.xlsx'
};

function normalizar(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
}

function obterArquivo(produto) {
    const chave = normalizar(produto);

    const aliases = {
        OLEO: 'OLEO',
        FARELO: 'FARELO',
        GRAOS: 'GRAOS',
        SOJA: 'GRAOS'
    };

    const produtoNormalizado = aliases[chave];

    if (!produtoNormalizado) {
        throw new Error(
            'Produto inválido. Utilize OLEO, FARELO ou GRAOS.'
        );
    }

    return produtos[produtoNormalizado];
}

function encontrarCabecalho(planilha) {
    for (
        let linha = 1;
        linha <= Math.min(planilha.rowCount, 30);
        linha++
    ) {
        const cabecalhos = [];

        for (
            let coluna = 1;
            coluna <= planilha.columnCount;
            coluna++
        ) {
            cabecalhos.push(
                normalizar(
                    planilha.getRow(linha).getCell(coluna).value
                )
            );
        }

        if (
            cabecalhos.includes('NUMERO') &&
            cabecalhos.includes('ANO')
        ) {
            return linha;
        }
    }

    throw new Error(
        'Não foi possível encontrar os cabeçalhos NUMERO e ANO.'
    );
}

function separarNumeroAno(numeroAno) {
    const partes = String(numeroAno)
        .trim()
        .match(/^(.+)-(\d{2,4})$/);

    if (!partes) {
        throw new Error(
            'Informe o contrato no formato numero-ano, por exemplo 123-26.'
        );
    }

    return {
        numero: partes[1].trim(),
        ano: partes[2].trim().slice(-2)
    };
}

function encontrarColuna(planilha, cabecalho, nomeCampo) {
    for (
        let coluna = 1;
        coluna <= planilha.columnCount;
        coluna++
    ) {
        if (
            normalizar(
                planilha.getRow(cabecalho).getCell(coluna).value
            ) === normalizar(nomeCampo)
        ) {
            return coluna;
        }
    }

    return null;
}

// Formata datas sem aplicar conversão de fuso horário local.
function formatarValor(valor) {
    if (valor === null || valor === undefined) {
        return '';
    }

    if (valor instanceof Date) {
        const dia = String(valor.getUTCDate()).padStart(2, '0');
        const mes = String(valor.getUTCMonth() + 1).padStart(2, '0');
        const ano = valor.getUTCFullYear();

        return `${dia}/${mes}/${ano}`;
    }

    if (typeof valor === 'object') {
        if (valor.text !== undefined) {
            return String(valor.text);
        }

        if (valor.result !== undefined) {
            return String(valor.result);
        }

        if (valor.richText) {
            return valor.richText
                .map(parte => parte.text)
                .join('');
        }

        return JSON.stringify(valor);
    }

    return String(valor);
}

function localizarContrato(
    planilha,
    linhaCabecalho,
    numero,
    ano
) {
    const colunaNumero = encontrarColuna(
        planilha,
        linhaCabecalho,
        'NUMERO'
    );

    const colunaAno = encontrarColuna(
        planilha,
        linhaCabecalho,
        'ANO'
    );

    for (
        let linha = linhaCabecalho + 1;
        linha <= planilha.rowCount;
        linha++
    ) {
        const registro = planilha.getRow(linha);

        const numeroPlanilha = normalizar(
            registro.getCell(colunaNumero).value
        );

        const anoPlanilha = normalizar(
            registro.getCell(colunaAno).value
        );

        if (
            numeroPlanilha === normalizar(numero) &&
            anoPlanilha.slice(-2) === normalizar(ano).slice(-2)
        ) {
            return registro;
        }
    }

    return null;
}

export async function editarContrato(produto, numeroAno) {
    try {
        // 1. Identificar a planilha.
        const arquivo = obterArquivo(produto);

        // 2. Solicitar o contrato, caso não tenha sido informado.
        if (!numeroAno) {
            numeroAno = readlineSync.question(
                'Informe o contrato (numero-ano): '
            );
        }

        const { numero, ano } = separarNumeroAno(numeroAno);

        const caminhoPlanilha = path.join(
            pastaProjeto,
            'db',
            arquivo
        );

        // 3. Abrir a planilha existente.
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.readFile(caminhoPlanilha);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error('A planilha não possui uma aba.');
        }

        const linhaCabecalho = encontrarCabecalho(planilha);

        // 4. Localizar o contrato.
        const registro = localizarContrato(
            planilha,
            linhaCabecalho,
            numero,
            ano
        );

        if (!registro) {
            console.log(
                `Contrato ${numero}-${ano} não encontrado.`
            );
            return;
        }

        console.log(`\nContrato ${numero}-${ano} encontrado.`);
        console.log(
            'Revise os campos. Pressione Enter para manter o valor atual.\n'
        );

        // 5. Percorrer os campos na ordem das colunas.
        const alteracoes = [];

        for (
            let coluna = 1;
            coluna <= planilha.columnCount;
            coluna++
        ) {
            const nomeCampo = planilha
                .getRow(linhaCabecalho)
                .getCell(coluna)
                .value;

            if (
                nomeCampo === null ||
                nomeCampo === undefined ||
                String(nomeCampo).trim() === ''
            ) {
                continue;
            }

            const campoNormalizado = normalizar(nomeCampo);
            const celula = registro.getCell(coluna);
            const valorAtual = celula.value;

            // Impedir alterações na identificação do contrato.
            if (
                campoNormalizado === 'NUMERO' ||
                campoNormalizado === 'ANO'
            ) {
                console.log(
                    `${nomeCampo}: ${formatarValor(valorAtual)} (bloqueado)`
                );
                continue;
            }

            // Preservar fórmulas.
            if (
                valorAtual &&
                typeof valorAtual === 'object' &&
                valorAtual.formula
            ) {
                console.log(
                    `${nomeCampo}: ${formatarValor(valorAtual)} (fórmula preservada)`
                );
                continue;
            }

            const resposta = readlineSync.question(
                `${nomeCampo} [${formatarValor(valorAtual)}]: `
            );

            // Enter mantém o valor original.
            if (resposta === '') {
                continue;
            }

            alteracoes.push({
                coluna,
                valorAnterior: valorAtual,
                novoValor: resposta
            });

            celula.value = resposta;
        }

        // 6. Salvar somente se houve alterações.
        if (alteracoes.length === 0) {
            console.log('\nNenhuma alteração realizada.');
            return;
        }

        await workbook.xlsx.writeFile(caminhoPlanilha);

        console.log('\nContrato atualizado com sucesso!');
        console.log(`Campos alterados: ${alteracoes.length}`);

        for (const alteracao of alteracoes) {
            const nomeCampo = planilha
                .getRow(linhaCabecalho)
                .getCell(alteracao.coluna)
                .value;

            console.log(
                `${nomeCampo}: "${formatarValor(alteracao.valorAnterior)}" -> "${alteracao.novoValor}"`
            );
        }
    } catch (erro) {
        console.error(
            `Erro ao editar contrato: ${erro.message}`
        );
    }
}
