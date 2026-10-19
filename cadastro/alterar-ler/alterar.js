
import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const caminho =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.xlsx';

export async function alterarCampo(indiceRegistro, campo, novoValor) {
    if (!Number.isInteger(indiceRegistro) || indiceRegistro < 0) {
        throw new Error('Índice de registro inválido.');
    }

    // 1. Abre a planilha Excel.
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(caminho);

    const planilha = workbook.worksheets[0];

    if (!planilha) {
        throw new Error('Nenhuma planilha encontrada no arquivo.');
    }

    // 2. Lê os nomes dos campos na primeira linha.
    const cabecalho = planilha.getRow(1);
    let numeroColuna = -1;
    let nomeCampo = '';

    cabecalho.eachCell((celula, coluna) => {
        const nome = String(celula.value ?? '').trim();

        if (nome.toUpperCase() === campo.trim().toUpperCase()) {
            numeroColuna = coluna;
            nomeCampo = nome;
        }
    });

    if (numeroColuna === -1) {
        throw new Error(`O campo "${campo}" não existe na planilha.`);
    }

    // 3. Encontra o registro.
    // O índice 0 corresponde à linha 2 do Excel.
    const numeroLinha = indiceRegistro + 2;
    const linha = planilha.getRow(numeroLinha);

    if (!linha.hasValues) {
        throw new Error('Registro não encontrado ou índice inválido.');
    }

    const celula = linha.getCell(numeroColuna);
    const valorAtual = celula.value;

    // 4. Prepara o novo valor.
    let valorNovo;

    if (
        typeof valorAtual === 'boolean' ||
        nomeCampo.toUpperCase() === 'ETIQ'
    ) {
        const resposta = String(novoValor).trim().toLowerCase();

        if (['s', 'sim', 'true', '1', 't'].includes(resposta)) {
            valorNovo = true;
        } else if (
            ['n', 'nao', 'não', 'false', '0', 'f'].includes(resposta)
        ) {
            valorNovo = false;
        } else {
            throw new Error('Informe sim ou não para esse campo.');
        }
    } else {
        valorNovo = String(novoValor);
    }

    // 5. Mostra os dados e pede confirmação.
    console.log('\n=== ALTERAÇÃO DE CADASTRO ===');
    console.log(`Registro: ${numeroLinha}`);
    console.log(`Campo: ${nomeCampo}`);
    console.log(`Valor atual: ${valorAtual ?? '(vazio)'}`);
    console.log(`Novo valor: ${valorNovo}`);

    const confirmar = readlineSync
        .question('\nConfirma a alteração? (s/n): ')
        .trim()
        .toLowerCase();

    if (confirmar !== 's') {
        console.log('Alteração cancelada.');
        return;
    }

    // 6. Cria um backup antes de salvar.
    const pastaBackup = path.join(
        path.dirname(caminho),
        'backup'
    );

    await fs.mkdir(pastaBackup, { recursive: true });

    const nomeBackup = `CADCLI-${Date.now()}.xlsx`;
    const backup = path.join(pastaBackup, nomeBackup);

    await fs.copyFile(caminho, backup);

    // 7. Altera a célula e salva o arquivo original.
    celula.value = valorNovo;

    await workbook.xlsx.writeFile(caminho);

    console.log('\nAlteração gravada com sucesso!');
    console.log(`Backup criado em: ${backup}`);
}
