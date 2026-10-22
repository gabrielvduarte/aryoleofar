
import path from 'node:path';
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';
import ExcelJS from 'exceljs';

const pastaProjeto =
    'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar';

export class MercadoInterno {
    async InclusaoDeContratoNoMI() {
        const caminhoJson = path.join(
            pastaProjeto,
            'mercado-interno.json'
        );

        const ano = String(new Date().getFullYear()).slice(-2);

        const caminhoExcel = path.join(
            pastaProjeto,
            'db',
            `FARE${ano}.xlsx`
        );

        const conteudoJson = await fs.readFile(caminhoJson, 'utf8');
        const modelo = JSON.parse(conteudoJson);
        const dados = modelo['mercado-interno'];

        for (const campo of Object.keys(dados)) {
            dados[campo] = readlineSync.question(
                `Informe ${campo}: `
            ).trim();
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(caminhoExcel);

        const planilha = workbook.worksheets[0];
        const cabecalho = planilha.getRow(1);

       let ultimaLinha = 1;

        for (let n = 2; n <= planilha.rowCount; n++) {
            const valores = planilha.getRow(n).values;

            if (valores.some(valor =>
                valor !== null &&
                valor !== undefined &&
                valor !== ''
            )) {
                ultimaLinha = n;
            }
        }

        const novaLinha = planilha.getRow(ultimaLinha + 1);
        let coluna = 1;

        for (const valor of Object.values(dados)) {
            

            novaLinha.getCell(coluna).value = valor;
            coluna++;
        }

        await workbook.xlsx.writeFile(caminhoExcel);

        
        console.log(`Planilha: ${caminhoExcel}`);
    }
}
