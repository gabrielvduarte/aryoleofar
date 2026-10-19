import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';
import { gerar } from './geradorDeCodigo.js';

const caminho =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.xlsx';

const campos = [
    'CODIGO',
    'NOME',
    'ENDERECO',
    'CIDADE',
    'ESTADO',
    'CEP',
    'CGC',
    'INSC',
    'INSCM',
    'EMAIL1',
    'EMAIL2',
    'FONE1',
    'FONE2',
    'OBS',
    'OBS_A',
    'ETIQ'
];

 export async function incluirCadastro(ncode) {
    try {
        // 1. Abre a planilha.
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(caminho);

        const planilha = workbook.worksheets[0];

        if (!planilha) {
            throw new Error('Nenhuma planilha encontrada.');
        }

        // 2. Identifica as colunas pelos cabeçalhos.
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

        // 3. Confere se todos os campos existem.
        const camposAusentes = campos.filter(
            campo => !colunas[campo]
        );

        if (camposAusentes.length > 0) {
            throw new Error(
                `Campos ausentes no Excel: ${camposAusentes.join(', ')}`
            );
        }

        // 4. Solicita os dados.
        const dados = {};

        console.log('\n=== INCLUIR NOVO CONTRATO ===');
        console.log('Pressione Enter para deixar um campo vazio.\n');

        for (const campo of campos) {
            if (campo === 'CODIGO') {
                dados[campo] = ncode
                console.log(`CODIGO gerado automaticamente: ${dados[campo]}`);
                continue;
            }

            dados[campo] = readlineSync.question(`${campo}: `).trim();
        }

        // 5. Exibe os dados para conferência.
        console.log('\n=== CONFERÊNCIA DO CADASTRO ===');

        for (const campo of campos) {
            console.log(`${campo}: ${dados[campo] || '(vazio)'}`);
        }

        const confirmar = readlineSync.question(
            '\nDeseja salvar esse cadastro? (s/n): '
        ).trim().toLowerCase();

        if (confirmar !== 's') {
            console.log('\nInclusão cancelada.');
            return;
        }

        // 6. Cria o backup antes de modificar o arquivo.
        const pastaBackup = path.join(
            path.dirname(caminho),
            'backup'
        );

        await fs.mkdir(pastaBackup, { recursive: true });

        const nomeBackup = `CADCLI-${Date.now()}.xlsx`;
        const caminhoBackup = path.join(pastaBackup, nomeBackup);

        await fs.copyFile(caminho, caminhoBackup);

        // 7. Encontra a próxima linha disponível.
        let numeroLinha = planilha.rowCount;

        while (
            numeroLinha > 1 &&
            !planilha.getRow(numeroLinha).hasValues
        ) {
            numeroLinha--;
        }

        numeroLinha++;

        const novaLinha = planilha.getRow(numeroLinha);

        // 8. Preenche cada campo na coluna correspondente.
        for (const campo of campos) {
            
            novaLinha.getCell(colunas[campo]).value = dados[campo];
        }

        // 9. Salva o arquivo.
        await workbook.xlsx.writeFile(caminho);

        console.log('\nCadastro incluído com sucesso!');
        console.log(`Linha adicionada: ${numeroLinha}`);
        console.log(`Backup criado em: ${caminhoBackup}`);
    } catch (erro) {
        console.error('\nErro ao incluir cadastro:', erro.message);
    }
}
