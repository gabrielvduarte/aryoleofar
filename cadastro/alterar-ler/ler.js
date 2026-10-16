import { alterarCampo } from './alterar.js';
import dbffile from 'dbffile';
const { DBFFile } = dbffile;

import readlineSync from 'readline-sync';

const path = 'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.DBF';


async function buscarLinhasPorTexto(termoBusca, campoBusca) {
    const dbf = await DBFFile.open(path);
    const todosRegistros = await dbf.readRecords(dbf.recordCount);

    const termoFormatado = String(termoBusca).toLowerCase().trim();

    return todosRegistros
        .map((dados, indiceOriginal) => ({ dados, indiceOriginal }))
        .filter(({ dados }) => {
            const valores = campoBusca === '*'
                ? Object.values(dados)
                : [dados[campoBusca]];

            return valores.some(valor =>
                valor !== null &&
                valor !== undefined &&
                String(valor).toLowerCase().includes(termoFormatado)
            );
        });
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
        const dbf = await DBFFile.open(path);

        // Identifica os campos disponíveis no arquivo
        const registros = await dbf.readRecords(1);

        if (registros.length === 0) {
            console.log('O arquivo DBF não possui registros.');
            return;
        }

        const campos = Object.keys(registros[0]);

        console.log('\n=== CAMPOS DISPONÍVEIS ===');

        campos.forEach((campo, indice) => {
            console.log(`${indice + 1}. ${campo}`);
        });

        console.log(`${campos.length + 1}. Pesquisar em todos os campos`);

        // Escolhe o campo de pesquisa
        const opcao = readlineSync.questionInt(
            '\nEscolha o campo pelo numero: ',
            {
                limit: campos.map((_, i) => String(i + 1))
                    .concat(String(campos.length + 1)),
                limitMessage: 'Escolha uma opcao valida.'
            }
        );

        const campoBusca = opcao === campos.length + 1
            ? '*'
            : campos[opcao - 1];

        const termo = readlineSync.question(
            '\nDigite o termo que deseja buscar: '
        ).trim();

        if (!termo) {
            console.log('O termo de busca nao pode estar vazio.');
            return;
        }

        console.log('\nIniciando busca...');

        const resultados = await buscarLinhasPorTexto(
            termo,
            campoBusca
        );

        if (resultados.length === 0) {
            console.log('\nNenhum registro encontrado.');
            return;
        }

        console.log(`\nForam encontrados ${resultados.length} registro(s).`);

        // Percorre os resultados e permite avançar
        
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
        console.error('\nOcorreu um erro ao processar o DBF:', erro.message);
    }
}
