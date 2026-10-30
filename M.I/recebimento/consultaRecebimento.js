
import ExcelJS from 'exceljs';
import readlineSync from 'readline-sync';
import path from 'node:path';

const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

const produtos = {
    OLEO: 'OLEO26RC.xlsx',
    FARELO: 'FARE26RC.xlsx',
    GRAOS: 'SOJA26RC.xlsx'
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

function localizarRecebimentos(
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

    const recebimentos = [];

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
            recebimentos.push(registro);
        }
    }

    return recebimentos;
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

export async function consultarRecebimento(produto, contrato) {
    try {
        // 1. Identificar a planilha do produto.
        const arquivo = obterArquivo(produto);

        // 2. Solicitar o contrato, caso não tenha sido informado.
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

        // 3. Abrir a planilha de recebimentos.
        const workbook = new ExcelJS.Workbook();

        await workbook.xlsx.readFile(caminhoPlanilha);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error(
                'A planilha de recebimentos não possui uma aba.'
            );
        }

        const linhaCabecalho = encontrarCabecalho(planilha);

        // 4. Localizar os recebimentos do contrato.
        const recebimentos = localizarRecebimentos(
            planilha,
            linhaCabecalho,
            numero,
            ano
        );

        if (recebimentos.length === 0) {
            console.log(
                `\nNenhum recebimento encontrado para o contrato ${numero}-${ano}.`
            );
            return;
        }

        // 5. Exibir os recebimentos encontrados.
        console.log('\n====================================');
        console.log(` RECEBIMENTOS DO CONTRATO ${numero}-${ano}`);
        console.log('====================================');

        recebimentos.forEach((registro, indice) => {
            console.log(`\n--- RECEBIMENTO ${indice + 1} ---`);
            console.log(`Linha na planilha: ${registro.number}\n`);

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
        });

        console.log('\n====================================');
        console.log(
            `Total de recebimentos encontrados: ${recebimentos.length}`
        );
        console.log('====================================');

    } catch (erro) {
        console.error(
            `Erro ao consultar recebimento: ${erro.message}`
        );
    }
}
