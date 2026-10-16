import dbffile from "dbffile";
import fs from "node:fs/promises";
import { gerar } from "./geradorDeCodigo.js";

const { DBFFile } = dbffile;

const path =
    "C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCOD.DBF";

export async function incluirContrato() {
    // 1. Ler o contador atual
    const dbf = await DBFFile.open(path);
    const registros = await dbf.readRecords(1);

    if (registros.length === 0) {
        throw new Error("O DBF não possui registros.");
    }

    const codigoAtual = Number(registros[0].NCODIGO);
    const novoCodigo = codigoAtual + 1;

    // 2. Gerar o código completo com dígito verificador
    const codigoFinal = gerar(novoCodigo);

    // 3. Abrir o arquivo original para leitura e escrita
    const arquivo = await fs.open(path, "r+");

    try {
        const cabecalho = Buffer.alloc(32);
        await arquivo.read(cabecalho, 0, 32, 0);

        const quantidadeRegistros = cabecalho.readUInt32LE(4);
        const tamanhoCabecalho = cabecalho.readUInt16LE(8);

        if (quantidadeRegistros !== 1) {
            throw new Error("A quantidade de registros mudou.");
        }

        // 4. Localizar o campo NCODIGO no cabeçalho
        let posicao = 32;
        let deslocamentoCampo = 1; // Primeiro byte: exclusão do registro
        let campoEncontrado = false;

        while (posicao < tamanhoCabecalho) {
            const descritor = Buffer.alloc(32);
            await arquivo.read(descritor, 0, 32, posicao);

            if (descritor[0] === 0x0D) break;

            const nomeCampo = descritor
                .subarray(0, 11)
                .toString("ascii")
                .replace(/\0.*$/, "")
                .trim();

            const tipo = String.fromCharCode(descritor[11]);
            const tamanho = descritor[16];

            if (nomeCampo === "NCODIGO") {
                if (tipo !== "N" || tamanho !== 6) {
                    throw new Error("Formato inesperado do campo NCODIGO.");
                }

                campoEncontrado = true;
                break;
            }

            deslocamentoCampo += tamanho;
            posicao += 32;
        }

        if (!campoEncontrado) {
            throw new Error("Campo NCODIGO não encontrado.");
        }

        // 5. Calcular a posição do campo no primeiro registro
        const posicaoCampo = tamanhoCabecalho + deslocamentoCampo;

        // Verificar se o contador não foi alterado por outro processo
        const valorAtual = Buffer.alloc(6);
        await arquivo.read(valorAtual, 0, 6, posicaoCampo);

        if (Number(valorAtual.toString("ascii").trim()) !== codigoAtual) {
            throw new Error("O contador mudou. Tente novamente.");
        }

        // 6. Gravar o novo número no arquivo original
        const valorNovo = Buffer.from(
            String(novoCodigo).padStart(6, " "),
            "ascii"
        );

        await arquivo.write(valorNovo, 0, 6, posicaoCampo);

        console.log("Código gerado:", codigoFinal);
        console.log("NCODIGO atualizado:", novoCodigo);

        return codigoFinal;
    } finally {
        await arquivo.close();
    }
}
