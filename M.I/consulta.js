import path from 'node:path';
import { readFile } from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

export async function consultarContrato() {
    try {
        // 1. Escolher o produto
        console.log('\n=== CONSULTA MERCADO INTERNO ===');
        console.log('1 - Óleo');
        console.log('2 - Farelo');
        console.log('3 - Grãos');

        const opcao = readlineSync.question(
            '\nQual produto deseja consultar? '
        ).trim();

        const produtos = {
            '1': { nome: 'ÓLEO', arquivo: 'OLEO26.xlsx' },
            '2': { nome: 'FARELO', arquivo: 'FARELO26.xlsx' },
            '3': { nome: 'GRÃOS', arquivo: 'GRAOS26.xlsx' }
        };

        const produto = produtos[opcao];

        if (!produto) {
            console.log('Opção inválida.');
            return;
        }

        // 2. Abrir a planilha
        const caminhoExcel = path.join(
            pastaProjeto,
            'db',
            produto.arquivo
        );

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(caminhoExcel);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error('Nenhuma planilha encontrada.');
        }

        // 3. Ler o JSON
        const caminhoJson = path.join(
            pastaProjeto,
            'mercado-interno.json'
        );

        const conteudoJson = await readFile(caminhoJson, 'utf8');
        const configuracao = JSON.parse(conteudoJson);
        const camposJson = configuracao['mercado-interno'];

        if (!camposJson) {
            throw new Error(
                'Configuração "mercado-interno" não encontrada no JSON.'
            );
        }

        // 4. Identificar as colunas pelo cabeçalho
        const cabecalho = planilha.getRow(1);
        const colunas = {};

        cabecalho.eachCell((celula, numeroColuna) => {
            const nome = String(celula.value ?? '')
                .trim()
                .toUpperCase();

            if (nome) {
                colunas[nome] = numeroColuna;
            }
        });

        if (!colunas.NUMERO || !colunas.ANO) {
            throw new Error(
                'As colunas NUMERO e ANO precisam existir na planilha.'
            );
        }

        // 5. Solicitar o contrato
        const codigoBusca = readlineSync.question(
            '\nDigite o contrato (ex.: 001-26): '
        ).trim();

        const partes = codigoBusca.split('-');

        if (
            partes.length !== 2 ||
            !/^\d+$/.test(partes[0]) ||
            !/^\d+$/.test(partes[1])
        ) {
            console.log(
                'Formato inválido. Use, por exemplo, 001-26.'
            );
            return;
        }

        const [numeroBusca, anoBusca] = partes;

        const normalizarNumero = valor =>
            String(valor ?? '')
                .trim()
                .replace(/\.0+$/, '')
                .padStart(3, '0');

        const normalizarAno = valor => {
            let ano = String(valor ?? '')
                .trim()
                .replace(/\.0+$/, '');

            if (/^\d{4}$/.test(ano)) {
                ano = ano.slice(-2);
            }

            return ano.padStart(2, '0');
        };

        const numeroProcurado = normalizarNumero(numeroBusca);
        const anoProcurado = normalizarAno(anoBusca);

        // 6. Buscar os registros pelo NUMERO e ANO
        const resultados = [];

        for (
            let numeroLinha = 2;
            numeroLinha <= planilha.rowCount;
            numeroLinha++
        ) {
            const linha = planilha.getRow(numeroLinha);

            const numero = normalizarNumero(
                linha.getCell(colunas.NUMERO).text
            );

            const ano = normalizarAno(
                linha.getCell(colunas.ANO).text
            );

            if (
                numero === numeroProcurado &&
                ano === anoProcurado
            ) {
                resultados.push(linha);
            }
        }

        if (resultados.length === 0) {
            console.log(
                `\nContrato ${numeroProcurado}-${anoProcurado} não encontrado.`
            );
            return;
        }

        console.log(
            `\nEncontrados ${resultados.length} resultado(s).`
        );

        // 7. Exibir os resultados
        for (let i = 0; i < resultados.length; i++) {
            const linha = resultados[i];

            console.log('\n================================');
            console.log(`PRODUTO: ${produto.nome}`);
            console.log(
                `CONTRATO: ${numeroProcurado}-${anoProcurado}`
            );
            console.log(
                `RESULTADO ${i + 1} DE ${resultados.length}`
            );
            console.log(`LINHA NO EXCEL: ${linha.number}`);
            console.log('================================');

            // Índice lógico iniciado em zero
            let indiceColuna = 0;

            for (const [nomeCampo, mapeamento] of Object.entries(
                camposJson
            )) {
                const nomesCampos = String(mapeamento).split(',');
                const valores = [];

                // ExcelJS utiliza índices físicos começando em 1.
                // O índice lógico começa em 0.
                for (let j = 0; j < nomesCampos.length; j++) {
                    const indiceExcel = indiceColuna + j + 1;
                    const valor = linha.getCell(indiceExcel).value;

                    if (
                        valor === null ||
                        valor === undefined ||
                        valor === ''
                    ) {
                        continue;
                    }

                    let texto;

                    if (valor instanceof Date) {
                        const dia = String(valor.getDate())
                            .padStart(2, '0');

                        const mes = String(valor.getMonth() + 1)
                            .padStart(2, '0');

                        texto = `${dia}/${mes}/${valor.getFullYear()}`;
                    } else if (
                        typeof valor === 'object' &&
                        valor.result !== undefined
                    ) {
                        texto = String(valor.result ?? '').trim();
                    } else {
                        texto = String(valor).trim();
                    }

                    if (texto) {
                        valores.push(texto);
                    }
                }

                console.log(
                    `${nomeCampo}: ${valores.join(' | ')}`
                );

                // Avança de acordo com a quantidade de colunas
                // declaradas para esse campo no JSON
                indiceColuna += nomesCampos.length;
            }
            
            // 8. Navegar entre resultados duplicados
            if (i < resultados.length - 1) {
                const resposta = readlineSync.question(
                    '\nEnter = próximo resultado | Q = encerrar: '
                ).trim().toLowerCase();

                if (resposta === 'q') {
                    break;
                }
            }
        }

        console.log('\nFim da consulta.');

    } catch (erro) {
        console.error('\nErro na consulta:', erro.message);
    }
}
