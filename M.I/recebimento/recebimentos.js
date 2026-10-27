
import ExcelJS from 'exceljs';
import readlineSync from 'readline-sync';
import fs from 'node:fs/promises';
import path from 'node:path';

const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

const caminhoJson = path.join(
    pastaProjeto,
    'mercado-interno.json'
);

const produtos = {
    OLEO: {
        contrato: 'OLEO26.xlsx',
        recebimento: 'OLEO26RC.xlsx'
    },
    FARELO: {
        contrato: 'FARE26.xlsx',
        recebimento: 'FARE26RC.xlsx'
    },
    GRAOS: {
        contrato: 'SOJA26.xlsx',
        recebimento: 'SOJA26RC.xlsx'
    }
};

// Padroniza nomes de campos e produtos para comparação.
function normalizar(valor) {
    return String(valor ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
}

function obterColuna(planilha, nomesPossiveis, linhaCabecalho) {
    const nomes = nomesPossiveis.map(normalizar);

    for (let coluna = 1; coluna <= planilha.columnCount; coluna++) {
        const cabecalho = normalizar(
            planilha.getRow(linhaCabecalho).getCell(coluna).value
        );

        if (nomes.includes(cabecalho)) {
            return coluna;
        }
    }

    return null;
}

// Procura a linha de cabeçalho que contém NUMERO e ANO.
function encontrarCabecalho(planilha) {
    for (let linha = 1; linha <= Math.min(planilha.rowCount, 30); linha++) {
        const numero = obterColuna(planilha, ['NUMERO'], linha);
        const ano = obterColuna(planilha, ['ANO'], linha);

        if (numero && ano) {
            return linha;
        }
    }

    throw new Error(
        `Não encontrei os cabeçalhos NUMERO e ANO na planilha "${planilha.name}".`
    );
}

function valorNormalizado(valor) {
    return normalizar(valor);
}

function localizarContrato(planilha, numero, ano, linhaCabecalho) {
    const colunaNumero = obterColuna(
        planilha,
        ['NUMERO'],
        linhaCabecalho
    );

    const colunaAno = obterColuna(
        planilha,
        ['ANO'],
        linhaCabecalho
    );

    for (
        let linha = linhaCabecalho + 1;
        linha <= planilha.rowCount;
        linha++
    ) {
        const registro = planilha.getRow(linha);

        const numeroPlanilha = registro.getCell(colunaNumero).value;
        const anoPlanilha = registro.getCell(colunaAno).value;

        if (
            valorNormalizado(numeroPlanilha) === valorNormalizado(numero) &&
            valorNormalizado(anoPlanilha) === valorNormalizado(ano)
        ) {
            return registro;
        }
    }

    return null;
}

function obterConfiguracaoRecebimento(json) {
    // Aceita o mapeamento na raiz ou dentro de "mercado-interno".
    const configuracao =
        json.recebimento ??
        json['mercado-interno']?.recebimento;

    if (
        !configuracao ||
        typeof configuracao !== 'object' ||
        Array.isArray(configuracao)
    ) {
        throw new Error(
            'Não encontrei o objeto "recebimento" no mercado-interno.json.'
        );
    }

    return configuracao;
}

function dividirNumeroAno(numeroAno) {
    const partes = String(numeroAno).trim().match(/^(.+)-(\d{2,4})$/);

    if (!partes) {
        throw new Error(
            'Formato inválido. Informe o contrato como numero-ano, por exemplo 123-26.'
        );
    }

    return {
        numero: partes[1].trim(),
        ano: partes[2].trim().slice(-2)
    };
}

function obterProduto(produto) {
    const chave = normalizar(produto);

    const aliases = {
        OLEO: 'OLEO',
        FARELO: 'FARELO',
        SOJA: 'GRAOS'
    };

    const chaveProduto = aliases[chave];

    if (!chaveProduto) {
        throw new Error(
            'Produto inválido. Utilize OLEO, FARELO ou GRAOS.'
        );
    }

    return produtos[chaveProduto];
}

function listarCabecalhos(planilha, linhaCabecalho) {
    const cabecalhos = new Map();

    for (
        let coluna = 1;
        coluna <= planilha.columnCount;
        coluna++
    ) {
        const nome = normalizar(
            planilha.getRow(linhaCabecalho).getCell(coluna).value
        );

        if (nome && !cabecalhos.has(nome)) {
            cabecalhos.set(nome, coluna);
        }
    }

    return cabecalhos;
}

export async function incluirRecebimento(produto, numeroAno) {
    try {
        // 1. Identificar produto e separar número/ano.
        const arquivos = obterProduto(produto);
        const { numero, ano } = dividirNumeroAno(numeroAno);

        // 2. Ler a configuração de perguntas e colunas.
        const json = JSON.parse(
            await fs.readFile(caminhoJson, 'utf8')
        );

        const configuracao = obterConfiguracaoRecebimento(json);

        // 3. Abrir a planilha de contratos.
        const caminhoContrato = path.join(
            pastaProjeto,
            'db',
            arquivos.contrato
        );

        const workbookContrato = new ExcelJS.Workbook();
        await workbookContrato.xlsx.readFile(caminhoContrato);

        const planilhaContrato = workbookContrato.worksheets[0];

        if (!planilhaContrato) {
            throw new Error('A planilha de contratos não possui uma aba.');
        }

        const linhaCabecalhoContrato =
            encontrarCabecalho(planilhaContrato);

        // 4. Localizar o contrato pelo número e pelo ano.
        const linhaContrato = localizarContrato(
            planilhaContrato,
            numero,
            ano,
            linhaCabecalhoContrato
        );

        if (!linhaContrato) {
            console.log(
                `Contrato ${numero}-${ano} não encontrado na planilha de ${produto}.`
            );
            return;
        }

        // 5. Abrir a planilha existente de recebimentos.
        const caminhoRecebimento = path.join(
            pastaProjeto,
            'db',
            arquivos.recebimento
        );

        const workbookRecebimento = new ExcelJS.Workbook();
        await workbookRecebimento.xlsx.readFile(caminhoRecebimento);

        const planilhaRecebimento =
            workbookRecebimento.worksheets[0];

        if (!planilhaRecebimento) {
            throw new Error(
                'A planilha de recebimentos não possui uma aba.'
            );
        }

        const linhaCabecalhoRecebimento =
            encontrarCabecalho(planilhaRecebimento);

        const cabecalhosRecebimento = listarCabecalhos(
            planilhaRecebimento,
            linhaCabecalhoRecebimento
        );

        // 6. Criar a nova linha e copiar os cinco primeiros campos
        // da linha original do contrato para as cinco primeiras colunas.
        const novaLinha = planilhaRecebimento.addRow([]);

        for (let coluna = 1; coluna <= 5; coluna++) {
            novaLinha.getCell(coluna).value =
                linhaContrato.getCell(coluna).value;
        }

        // 7. Perguntar os dados na ordem em que aparecem no JSON.
        for (const [campo, destinos] of Object.entries(configuracao)) {
            const resposta = readlineSync.question(
                `${campo}: `
            );

            // Os nomes separados por vírgula são alternativas de cabeçalho.
            // O texto digitado não será dividido entre células.
            const nomesDestino = String(destinos)
                .split(',')
                .map(nome => normalizar(nome.trim()))
                .filter(Boolean);

            const colunaDestino = nomesDestino
                .map(nome => cabecalhosRecebimento.get(nome))
                .find(coluna => coluna !== undefined);

            if (!colunaDestino) {
                throw new Error(
                    `Não encontrei uma coluna correspondente ao campo "${campo}". ` +
                    `Destinos configurados: ${destinos}`
                );
            }

            novaLinha.getCell(colunaDestino).value = resposta;
        }

        // 8. Salvar na mesma planilha de recebimentos.
        await workbookRecebimento.xlsx.writeFile(caminhoRecebimento);

        console.log(
            `Recebimento do contrato ${numero}-${ano} cadastrado com sucesso.`
        );
    } catch (erro) {
        console.error(
            `Erro ao incluir recebimento: ${erro.message}`
        );
    }
}
