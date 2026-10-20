
import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const caminho =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/db/CADCLI.xlsx';

const pastaContratos = path.join(
    path.dirname(caminho),
    'CLI'
);

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
        if (!ncode) {
            throw new Error('O código do cadastro não foi informado.');
        }

        // 1. Abre a planilha Excel.
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

        // 3. Verifica se todos os campos existem.
        const camposAusentes = campos.filter(
            campo => !colunas[campo]
        );

        if (camposAusentes.length > 0) {
            throw new Error(
                `Campos ausentes no Excel: ${camposAusentes.join(', ')}`
            );
        }

        // 4. Solicita os dados do cadastro.
        const dados = {};

        console.log('\n=== INCLUIR NOVO CONTRATO ===');
        console.log('Pressione Enter para deixar um campo vazio.\n');

        for (const campo of campos) {
            if (campo === 'CODIGO') {
                dados[campo] = String(ncode);

                console.log(
                    `CODIGO gerado automaticamente: ${dados[campo]}`
                );

                continue;
            }

            dados[campo] = readlineSync
                .question(`${campo}: `)
                .trim();
        }

        // 5. Exibe os dados para conferência.
        console.log('\n=== CONFERÊNCIA DO CADASTRO ===');

        for (const campo of campos) {
            console.log(`${campo}: ${dados[campo] || '(vazio)'}`);
        }

        const confirmar = readlineSync
            .question('\nDeseja salvar esse cadastro? (s/n): ')
            .trim()
            .toLowerCase();

        if (confirmar !== 's') {
            console.log('\nInclusão cancelada.');
            return;
        }

        // 6. Cria o backup do Excel.
        const pastaBackup = path.join(
            path.dirname(caminho),
            'backup'
        );

        await fs.mkdir(pastaBackup, { recursive: true });

        const nomeBackup = `CADCLI-${Date.now()}.xlsx`;
        const caminhoBackup = path.join(pastaBackup, nomeBackup);

        await fs.copyFile(caminho, caminhoBackup);

        // 7. Encontra a última linha com dados.
        let numeroLinha = planilha.rowCount;

        while (
            numeroLinha > 1 &&
            !planilha.getRow(numeroLinha).hasValues
        ) {
            numeroLinha--;
        }

        numeroLinha++;

        // 8. Preenche os 16 campos na nova linha.
        const novaLinha = planilha.getRow(numeroLinha);

        for (const campo of campos) {
            novaLinha.getCell(colunas[campo]).value = dados[campo];
        }

        // 9. Prepara o TXT com somente os 7 campos desejados.
        // Não inclui CODIGO nem os campos posteriores a INSC.
        const camposTxt = campos.slice(1, 8);

        const conteudoTxt = camposTxt
            .map(campo => `${campo}: ${dados[campo] ?? ''}`)
            .join('\n');

        const caminhoTxt = path.join(
            pastaContratos,
            `${dados.CODIGO}.txt`
        );

        // 10. Verifica se já existe um TXT com esse código.
        await fs.mkdir(pastaContratos, { recursive: true });

        try {
            await fs.access(caminhoTxt);

            throw new Error(
                `Já existe um arquivo TXT para o código ${dados.CODIGO}.`
            );
        } catch (erro) {
            if (erro.code !== 'ENOENT') {
                throw erro;
            }
        }

        // 11. Salva o TXT e depois o Excel.
        await fs.writeFile(caminhoTxt, conteudoTxt, {
            encoding: 'utf8',
            flag: 'wx'
        });

        try {
            await workbook.xlsx.writeFile(caminho);
        } catch (erro) {
            // Se o Excel falhar, remove o TXT recém-criado.
            await fs.unlink(caminhoTxt).catch(() => {});
            throw erro;
        }

        console.log('\nCadastro incluído com sucesso!');
        console.log(`Linha adicionada no Excel: ${numeroLinha}`);
        console.log(`Backup criado em: ${caminhoBackup}`);
        console.log(`TXT criado em: ${caminhoTxt}`);

    } catch (erro) {
        console.error('\nErro ao incluir cadastro:', erro.message);
    }
}
