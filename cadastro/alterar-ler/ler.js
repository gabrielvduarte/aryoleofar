
import { alterarCampo } from './alterar.js';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const caminho =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar//db/CADCLI.xlsx';

async function abrirPlanilha() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(caminho);

    const planilha = workbook.worksheets[0];

    if (!planilha) {
        throw new Error('Nenhuma planilha encontrada no arquivo.');
    }

    return planilha;
}

async function buscarLinhasPorTexto(termoBusca, campoBusca) {
    const planilha = await abrirPlanilha();

    // A primeira linha contém os nomes dos campos.
    const cabecalho = planilha.getRow(1);
    const colunas = [];

    

    cabecalho.eachCell((celula, numeroColuna) => {
        const nome = String(celula.value ?? '').trim();

        if (nome) {
            colunas.push({
                nome,
                numeroColuna
            });
        }
    });

    const termoFormatado = String(termoBusca).toLowerCase().trim();
    const resultados = [];

    // Os registros começam na linha 2.
    for (let numeroLinha = 2; numeroLinha <= planilha.rowCount; numeroLinha++) {
        const linha = planilha.getRow(numeroLinha);

        if (!linha.hasValues) {
            continue;
        }

        const dados = {};

        for (const coluna of colunas) {
            dados[coluna.nome] = linha.getCell(coluna.numeroColuna).value;
        }

        const valores = campoBusca === '*'
            ? Object.values(dados)
            : [dados[campoBusca]];

        const encontrou = valores.some(valor =>
            valor !== null &&
            valor !== undefined &&
            String(valor).toLowerCase().includes(termoFormatado)
        );

        if (encontrou) {
            resultados.push({
                dados,
                // Compatível com alterar.js: primeiro registro = índice 0.
                indiceOriginal: numeroLinha - 2
            });
        }
    }

    return {
        resultados,
        campos: colunas.map(coluna => coluna.nome)
    };
}

async function desejaAlterar(campos, resultadoSelecionado) {
    const resposta = readlineSync.question(
        '\nDeseja alterar algum campo? (s/n): '
    ).trim().toLowerCase();

    if (resposta !== 's') {
        return;
    }

    console.log('\n=== CAMPOS DISPONÍVEIS ===');

    campos.forEach((campo, indice) => {
        console.log(`${indice + 1}. ${campo}`);
    });

    const opcaoCampo = readlineSync.questionInt(
        '\nEscolha o campo que deseja alterar: ',
        {
            limit: campos.map((_, i) => String(i + 1)),
            limitMessage: 'Escolha um campo válido.'
        }
    );

    const campo = campos[opcaoCampo - 1];

    const novoValor = readlineSync.question(
        `Digite o novo valor para ${campo}: `
    );

    await alterarCampo(
        resultadoSelecionado.indiceOriginal,
        campo,
        novoValor
    );
}

export async function executar() {
    try {
        const planilha = await abrirPlanilha();
        const cabecalho = planilha.getRow(1);
        const campos = [];

        cabecalho.eachCell((celula) => {
            const nome = String(celula.value ?? '').trim();

            if (nome) {
                campos.push(nome);
            }
        });

        if (campos.length === 0) {
            console.log('A planilha não possui cabeçalhos.');
            return;
        }

        console.log('\n=== CAMPOS DISPONÍVEIS ===');

        campos.forEach((campo, indice) => {
            console.log(`${indice + 1}. ${campo}`);
        });

        console.log(`${campos.length + 1}. Pesquisar em todos os campos`);

        const opcao = readlineSync.questionInt(
            '\nEscolha o campo pelo numero: ',
            {
                limit: campos.map((_, i) => String(i + 1))
                    .concat(String(campos.length + 1)),
                limitMessage: 'Escolha uma opção válida.'
            }
        );

        const campoBusca = opcao === campos.length + 1
            ? '*'
            : campos[opcao - 1];

        const termo = readlineSync.question(
            '\nDigite o termo que deseja buscar: '
        ).trim();

        if (!termo) {
            console.log('O termo de busca não pode estar vazio.');
            return;
        }

        console.log('\nIniciando busca...');

        const { resultados } = await buscarLinhasPorTexto(
            termo,
            campoBusca
        );

        if (resultados.length === 0) {
            console.log('\nNenhum registro encontrado.');
            return;
        }

        console.log(`\nForam encontrados ${resultados.length} registro(s).`);

        let resultadoSelecionado = resultados[0];

        for (let i = 0; i < resultados.length; i++) {
            resultadoSelecionado = resultados[i];

            console.log(`\n=== RESULTADO ${i + 1} DE ${resultados.length} ===`);
            console.log(resultadoSelecionado.dados);

            if (i < resultados.length - 1) {
                const resposta = readlineSync.question(
                    '\nDeseja ver o proximo resultado? (s/n): '
                ).trim().toLowerCase();

                if (resposta !== 's') {
                    break;
                }
            }
        }

        await desejaAlterar(campos, resultadoSelecionado);

        console.log('\nFim da busca.');

    } catch (erro) {
        console.error(
            '\nOcorreu um erro ao processar o XLSX:',
            erro.message
        );
    }
}
