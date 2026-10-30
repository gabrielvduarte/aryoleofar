
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

function encontrarColuna(planilha, linhaCabecalho, nomeCampo) {
    for (
        let coluna = 1;
        coluna <= planilha.columnCount;
        coluna++
    ) {
        const cabecalho = planilha
            .getRow(linhaCabecalho)
            .getCell(coluna).value;

        if (normalizar(cabecalho) === normalizar(nomeCampo)) {
            return coluna;
        }
    }

    return null;
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

export async function cancelarContrato(produto, contrato) {
    try {
        // 1. Identificar a planilha do produto.
        const arquivo = obterArquivo(produto);

        // 2. Separar número e ano.
        if (!contrato) {
            contrato = readlineSync.question(
                'Informe o contrato (numero-ano): '
            );
        }

        const { numero, ano } = separarNumeroAno(contrato);

        const caminhoPlanilha = path.join(
            pastaProjeto,
            'db',
            arquivo
        );

        // 3. Abrir a planilha.
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

        // 5. Mostrar os dados do contrato encontrado.
        console.log(`\nContrato ${numero}-${ano} encontrado.\n`);
        console.log('Dados do contrato:');

        for (
            let coluna = 1;
            coluna <= planilha.columnCount;
            coluna++
        ) {
            const nomeCampo = planilha
                .getRow(linhaCabecalho)
                .getCell(coluna).value;

            if (
                nomeCampo === null ||
                nomeCampo === undefined ||
                String(nomeCampo).trim() === ''
            ) {
                continue;
            }

            const valor = registro.getCell(coluna).value;

            console.log(
                `${nomeCampo}: ${formatarValor(valor)}`
            );
        }

        // 6. Confirmar o cancelamento.
        const confirmacao = readlineSync.question(
            '\nDeseja realmente cancelar este contrato? (s/n): '
        );

        if (confirmacao.trim().toLowerCase() !== 's') {
            console.log('\nCancelamento interrompido.');
            return;
        }

        // 7. Limpar todos os campos da linha.
        for (
            let coluna = 1;
            coluna <= planilha.columnCount;
            coluna++
        ) {
            registro.getCell(coluna).value = null;
        }

        // 8. Salvar a planilha.
        await workbook.xlsx.writeFile(caminhoPlanilha);

        console.log(
            `\nContrato ${numero}-${ano} cancelado com sucesso!`
        );

    } catch (erro) {
        console.error(
            `Erro ao cancelar contrato: ${erro.message}`
        );
    }
}
