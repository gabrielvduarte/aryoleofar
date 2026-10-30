
import ExcelJS from 'exceljs';
import fs from 'node:fs/promises';
import path from 'node:path';
import readlineSync from 'readline-sync';
import { contratoMi } from './utils.js';


const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

const caminhoJSON = path.join(
    pastaProjeto,
    'mercado-interno.json'
);

const produtos = {
    1: { nome: 'OLEO', arquivo: 'OLEO26.xlsx' },
    2: { nome: 'FARELO', arquivo: 'FARE26.xlsx' },
    3: { nome: 'SOJA', arquivo: 'SOJA26.xlsx' }
};

// Normaliza nomes de cabeçalhos para compará-los.
function normalizarNome(nome) {
    return String(nome)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/_/g, '');
}

// Relaciona nomes usados no JSON aos cabeçalhos reais.
function nomeRealColuna(nome) {
    const nomeNormalizado = normalizarNome(nome);

    const aliases = {
        OBS: 'OBS1'
    };

    return aliases[nomeNormalizado] ?? nomeNormalizado;
}

// Retorna a data sem o deslocamento do fuso horário local.
function obterValorCelula(celula) {
    const valor = celula.value;

    if (valor === null || valor === undefined) {
        return '';
    }

    if (valor instanceof Date) {
        const dia = String(valor.getUTCDate()).padStart(2, '0');
        const mes = String(valor.getUTCMonth() + 1).padStart(2, '0');
        const ano = String(valor.getUTCFullYear()).slice(-2);

        return `${dia}/${mes}/${ano}`;
    }  

    if (typeof valor === 'object') {
        if ('richText' in valor) {
            return valor.richText.map(item => item.text).join('');
        }

        if ('text' in valor) {
            return String(valor.text);
        }

        if ('result' in valor) {
            return String(valor.result ?? '');
        }
    }

    return String(valor);
}

export async function consultarMercadoInterno() {
    try {
        // Lê o arquivo JSON.
        const conteudoJSON = await fs.readFile(caminhoJSON, 'utf8');
        const configuracao = JSON.parse(conteudoJSON);
        const campos = configuracao['mercado-interno'];

        if (!campos) {
            throw new Error(
                'A chave "mercado-interno" não foi encontrada no JSON.'
            );
        }

        // Seleciona o produto.
        console.log('\n=== CONSULTA MERCADO INTERNO ===');
        console.log('1 - Óleo');
        console.log('2 - Farelo');
        console.log('3 - Grãos');

        const opcao = readlineSync.question(
            '\nEscolha o produto: '
        ).trim();

        const produto = produtos[opcao];
        
        if (!produto) {
            console.log('Opção inválida.');
            return;
        }

        const caminhoExcel = path.join(
            pastaProjeto,
            'db',
            produto.arquivo
        );

        // Abre a planilha.
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(caminhoExcel);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error('Nenhuma planilha foi encontrada.');
        }

        // Mapeia cada cabeçalho real para o número da coluna.
        const colunas = {};
        const cabecalho = planilha.getRow(1);

        cabecalho.eachCell((celula, numeroColuna) => {
            const nome = nomeRealColuna(celula.value ?? '');
            colunas[nome] = numeroColuna;
        });

        const colunaNumero = colunas.NUMERO;
        const colunaAno = colunas.ANO;

        if (!colunaNumero || !colunaAno) {
            throw new Error(
                'Não foi possível localizar NUMERO e ANO nos cabeçalhos.'
            );
        }

        // Solicita o contrato.
        const contrato = readlineSync.question(
            '\nDigite o contrato (ex.: 001-26): '
        ).trim();

        const partesContrato = contrato.match(
            /^(\d+)\s*-\s*(\d{2})$/
        );

        if (!partesContrato) {
            console.log(
                'Contrato inválido. Utilize o formato 001-26.'
            );
            return;
        }

        const numeroProcurado = partesContrato[1].padStart(3, '0');
        const anoProcurado = partesContrato[2];

        // Pesquisa todas as linhas correspondentes.
        const resultados = [];

        for (let numeroLinha = 2; numeroLinha <= planilha.rowCount; numeroLinha++) {
            const linha = planilha.getRow(numeroLinha);

            const numero = obterValorCelula(
                linha.getCell(colunaNumero)
            ).trim().padStart(3, '0');

            const ano = obterValorCelula(
                linha.getCell(colunaAno)
            ).trim();

            if (
                numero === numeroProcurado &&
                ano === anoProcurado
            ) {
                resultados.push(linha);
            }
        }

        if (resultados.length === 0) {
            console.log(
                `\nContrato ${contrato} não encontrado em ${produto.nome}.`
            );
            return;
        }

        // Exibe os resultados encontrados.
        for (let indice = 0; indice < resultados.length; indice++) {
            const linha = resultados[indice];

            console.log('\n================================');
            console.log(`Produto: ${produto.nome}`);
            console.log(`Contrato: ${numeroProcurado}-${anoProcurado}`);
            console.log(`Resultado ${indice + 1} de ${resultados.length}`);
            console.log('================================\n');

            for (const [nomeCampo, mapeamento] of Object.entries(campos)) {
                const nomesColunas = String(mapeamento)
                    .split(',')
                    .map(nome => nome.trim());

                const valores = nomesColunas.map(nomeColuna => {
                    const nomeNormalizado = nomeRealColuna(nomeColuna);
                    const numeroColuna = colunas[nomeNormalizado];

                    if (!numeroColuna) {
                        throw new Error(
                            `A coluna "${nomeColuna}" (campo ${nomeCampo}) ` +
                            'não foi encontrada na primeira linha da planilha.'
                        );
                    }

                    return obterValorCelula(
                        linha.getCell(numeroColuna)
                    );
                });

                const valorFinal = valores
                    .filter(valor => valor !== '')
                    .join('  ');

                console.log(`${nomeCampo}: ${valorFinal}`);
            }

            console.log('\n================================');

            if (indice < resultados.length - 1) {
                const resposta = readlineSync.question(
                    '\nENTER para o próximo resultado ou Q para sair: '
                ).trim().toUpperCase();

                if (resposta === 'Q') {
                    break;
                }
            } else {
                console.log('\nNão existem mais resultados para esse contrato.');
            }
        };
        contratoMi(produto.nome, contrato)
    } catch (erro) {
        console.error(
            '\nErro ao consultar o Mercado Interno:',
            erro.message
        );
    }
}
