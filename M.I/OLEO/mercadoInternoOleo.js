
import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';


const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

export class MercadoInterno {
    constructor() {
        this.caminhoExcel = path.join(
            pastaProjeto,
            'db',
            'OLEO26.xlsx'
        );

        this.caminhoJson = path.join(
            pastaProjeto,
            'mercado-interno.json'
        );
    }

    dividirTexto(texto, limite = 30) {
        const partes = [];
        let restante = String(texto);

        while (restante.length > limite) {
            let corte = restante.lastIndexOf(' ', limite);

            if (corte <= 0) {
                corte = limite;
            }

            partes.push(restante.slice(0, corte));
            restante = restante.slice(corte).trimStart();
        }

        partes.push(restante);

        return partes;
    }

    encontrarUltimaLinhaComDados(planilha) {
        let ultimaLinha = 1;

        for (let numero = 2; numero <= planilha.rowCount; numero++) {
            const valores = planilha.getRow(numero).values;

            const possuiDados = valores.some(
                valor =>
                    valor !== null &&
                    valor !== undefined &&
                    valor !== ''
            );

            if (possuiDados) {
                ultimaLinha = numero;
            }
        }

        return ultimaLinha;
    }

    
async InclusaoDeContratoNoMI() {
    const conteudoJson = await fs.readFile(
        this.caminhoJson,
        'utf8'
    );

    const modelo = JSON.parse(conteudoJson);
    const dados = modelo['mercado-interno'];

    if (!dados || typeof dados !== 'object') {
        throw new Error('Estrutura mercado-interno não encontrada no JSON.');
    }

    // Solicita os valores ao usuário.
    for (const campo of Object.keys(dados)) {
        dados[campo] = readlineSync.question(
            `Informe ${campo}: `
        ).trim();
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.caminhoExcel);

    const planilha = workbook.worksheets[0];

    if (!planilha) {
        throw new Error('Nenhuma planilha encontrada no Excel.');
    }

    // Identifica as colunas pelo cabeçalho da planilha.
    const colunas = {};

    planilha.getRow(1).eachCell((celula, numeroColuna) => {
        const nome = String(celula.value ?? '')
            .trim()
            .toUpperCase();

        colunas[nome] = numeroColuna;
    });

    // Localiza a última linha com dados.
    let ultimaLinha = 1;

    for (let numero = 2; numero <= planilha.rowCount; numero++) {
        const valores = planilha.getRow(numero).values;

        if (valores.some(valor =>
            valor !== null &&
            valor !== undefined &&
            valor !== ''
        )) {
            ultimaLinha = numero;
        }
    }

    const novaLinha = ultimaLinha + 1;

    // Prepara as informações usando as colunas definidas no JSON.
    const escritas = [];

    for (const [campoJson, colunasJson] of Object.entries(dados)) {
        if (colunasJson === null || colunasJson === undefined) {
            continue;
        }

        const nomesColunas = String(colunasJson)
            .split(',')
            .map(nome => nome.trim().toUpperCase())
            .filter(Boolean);

        for (const nomeColuna of nomesColunas) {
            const numeroColuna = colunas[nomeColuna];

            if (!numeroColuna) {
                throw new Error(
                    `A coluna "${nomeColuna}" não existe na planilha.`
                );
            }

            escritas.push({
                coluna: numeroColuna,
                valor: dados[campoJson]
            });
        }
    }

    // Confere se as células estão livres antes de escrever.
    for (const escrita of escritas) {
        const celula = planilha
            .getRow(novaLinha)
            .getCell(escrita.coluna);

        if (
            celula.value !== null &&
            celula.value !== undefined &&
            celula.value !== ''
        ) {
            throw new Error(
                `A célula ${celula.address} já contém dados.`
            );
        }
    }

    // Escreve os valores na mesma linha, nas colunas indicadas.
    for (const escrita of escritas) {
        planilha.getRow(novaLinha)
            .getCell(escrita.coluna).value = escrita.valor;
    }

    await workbook.xlsx.writeFile(this.caminhoExcel);
    await perguntarCriarRecebimento('OLEO', numero, ano);


    console.log('Contrato salvo com sucesso!');
    console.log(`Linha preenchida: ${novaLinha}`);
}

}
