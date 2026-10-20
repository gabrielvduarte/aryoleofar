
import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const caminho =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.xlsx';

export async function cancelarCadastro() {
    try {
        // 1. Abre a planilha.
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(caminho);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error('Nenhuma planilha encontrada.');
        }

        // 2. Lê os cabeçalhos.
        const cabecalho = planilha.getRow(1);
        const colunas = [];

        cabecalho.eachCell((celula, numeroColuna) => {
            const nome = String(celula.value ?? '').trim();

            if (nome) {
                colunas.push({ nome, numeroColuna });
            }
        });

        if (colunas.length === 0) {
            throw new Error('A planilha não possui cabeçalhos.');
        }

        // 3. Permite escolher o campo de busca.
        console.log('\n=== CANCELAR CADASTRO ===');
        console.log('\n=== CAMPOS DISPONÍVEIS ===');

        colunas.forEach((coluna, indice) => {
            console.log(`${indice + 1}. ${coluna.nome}`);
        });

        console.log(`${colunas.length + 1}. Pesquisar em todos os campos`);

        const opcao = readlineSync.questionInt(
            '\nEscolha o campo pelo numero: ',
            {
                limit: colunas.map((_, i) => String(i + 1))
                    .concat(String(colunas.length + 1)),
                limitMessage: 'Escolha uma opção válida.'
            }
        );

        const pesquisarTodos = opcao === colunas.length + 1;

        const colunaEscolhida = pesquisarTodos
            ? null
            : colunas[opcao - 1];

        // 4. Recebe o termo de busca.
        const termo = readlineSync
            .question('\nDigite o termo que deseja buscar: ')
            .trim()
            .toLowerCase();

        if (!termo) {
            console.log('O termo de busca não pode estar vazio.');
            return;
        }

        // 5. Pesquisa os registros.
        const resultados = [];

        for (
            let numeroLinha = 2;
            numeroLinha <= planilha.rowCount;
            numeroLinha++
        ) {
            const linha = planilha.getRow(numeroLinha);

            if (!linha.hasValues) {
                continue;
            }

            const camposParaBuscar = pesquisarTodos
                ? colunas
                : [colunaEscolhida];

            const encontrou = camposParaBuscar.some(coluna => {
                const valor = linha.getCell(
                    coluna.numeroColuna
                ).value;

                return valor !== null &&
                    valor !== undefined &&
                    String(valor).toLowerCase().includes(termo);
            });

            if (encontrou) {
                resultados.push(numeroLinha);
            }
        }

        if (resultados.length === 0) {
            console.log('\nNenhum cadastro encontrado.');
            return;
        }

        console.log(`\nEncontrados ${resultados.length} cadastro(s).`);

        // 6. Exibe os resultados um por vez.
        let linhaSelecionada = null;

        for (let i = 0; i < resultados.length; i++) {
            const numeroLinha = resultados[i];
            const linha = planilha.getRow(numeroLinha);

            console.log(
                `\n=== RESULTADO ${i + 1} DE ${resultados.length} ===`
            );

            colunas.forEach(coluna => {
                const valor = linha.getCell(
                    coluna.numeroColuna
                ).value;

                console.log(`${coluna.nome}: ${valor ?? '(vazio)'}`);
            });

            const resposta = readlineSync.question(
                '\nEste e o cadastro que deseja cancelar? (s/n): '
            ).trim().toLowerCase();

            if (resposta === 's') {
                linhaSelecionada = numeroLinha;
                break;
            }

            if (i < resultados.length - 1) {
                const avancar = readlineSync.question(
                    'Deseja avancar para o proximo resultado? (s/n): '
                ).trim().toLowerCase();

                if (avancar !== 's') {
                    console.log('\nOperação cancelada pelo usuário.');
                    return;
                }
            } else {
                console.log('\nVocê chegou ao último resultado.');
            }
        }

        if (linhaSelecionada === null) {
            console.log('\nNenhum cadastro foi selecionado.');
            return;
        }

        // 7. Confirma antes de limpar o cadastro.
        const confirmar = readlineSync.question(
            '\nATENCAO: toda a linha sera limpa. Confirma? (s/n): '
        ).trim().toLowerCase();

        if (confirmar !== 's') {
            console.log('\nCancelamento do cadastro interrompido.');
            return;
        }

        // 8. Cria um backup.
        const pastaBackup = path.join(
            path.dirname(caminho),
            'backup'
        );

        await fs.mkdir(pastaBackup, { recursive: true });

        const caminhoBackup = path.join(
            pastaBackup,
            `CADCLI-${Date.now()}.xlsx`
        );

        await fs.copyFile(caminho, caminhoBackup);

        // 9. Limpa todas as células da linha selecionada.
        const linha = planilha.getRow(linhaSelecionada);

        for (const coluna of colunas) {
            linha.getCell(coluna.numeroColuna).value = null;
        }

        // 10. Salva a planilha.
        await workbook.xlsx.writeFile(caminho);

        console.log('\nCadastro cancelado com sucesso!');
        console.log(`Linha limpa: ${linhaSelecionada}`);
        console.log(`Backup criado em: ${caminhoBackup}`);

    } catch (erro) {
        console.error('\nErro ao cancelar cadastro:', erro.message);
    }
}
