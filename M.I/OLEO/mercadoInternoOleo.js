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
            `OLEO26.xlsx`
        );

        this.caminhoJson = path.join(
            pastaProjeto,
            'mercado-interno.json'
        );
    }

    
async InclusaoDeContratoNoMI() {
    // 1. Ler o modelo JSON
    const conteudoJson = await fs.readFile(
        this.caminhoJson,
        'utf8'
    );

    const modelo = JSON.parse(conteudoJson);
    const dados = modelo['mercado-interno'];

    // 2. Solicitar os dados na ordem do JSON, exceto codigo
    for (const campo of Object.keys(dados)) {
        if (campo.toUpperCase() === 'CODIGO') continue;

        dados[campo] = readlineSync.question(
            `Informe ${campo}: `
        ).trim();
    }

    // 3. Abrir a planilha
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(this.caminhoExcel);

    const planilha = workbook.worksheets[0];

    
   

    for (let linha = 2; linha <= planilha.rowCount; linha++) {
        const valor = planilha.getRow(linha)
            .getCell(colunaCodigo).value;

        if (valor === null || valor === undefined) continue;


        if (corresponde && corresponde[2] === ano) {
            maiorSequencial = Math.max(
                maiorSequencial,
                Number(corresponde[1])
            );
        }
    }


    // 6. Encontrar a última linha que realmente possui dados
    let ultimaLinhaComDados = 1;

    for (let linha = 2; linha <= planilha.rowCount; linha++) {
        const valores = planilha.getRow(linha).values;

        const possuiDados = valores.some(
            valor => valor !== null &&
                     valor !== undefined &&
                     valor !== ''
        );

        if (possuiDados) {
            ultimaLinhaComDados = linha;
        }
    }

    await workbook.xlsx.writeFile(this.caminhoExcel);
    
}
}