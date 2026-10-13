import dbffile from 'dbffile';
const { DBFFile } = dbffile;

import readlineSync from 'readline-sync';



const path = 'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.DBF'

async function buscarLinhaPorTexto(termoBusca) {
        try {
            const dbf = await DBFFile.open(path);
            
            // Lê TODAS as colunas de todos os registros
            const todosRegistros = await dbf.readRecords(dbf.recordCount);
            
            // Transforma o termo em minúsculo para a busca não diferenciar "Roque" de "roque"
            const termoFormatado = String(termoBusca).toLowerCase().trim();

            // Procura a primeira linha que dê match
            const linhaEncontrada = todosRegistros.find(linha => {
                // Transforma todos os valores da linha em texto e verifica se o termo está ali dentro
                return Object.values(linha).some(valor => 
                    String(valor).toLowerCase().includes(termoFormatado)
                );
            });

            return linhaEncontrada || null;
        } catch (erro) {
            console.error('Erro ao buscar no DBF:', erro);
            throw erro;
        }
    }


export async function executar() {

    const readlinesync = ('readline');

    const nome = readlineSync.question('Qual o nome que deseja buscar? ');
   
    console.log('Iniciando busca...');
     
    // EXEMPLO DE BUSCA: Pode ser um nome, um e-mail, um CPF ou endereço
    const oQueProcurar = nome; 

    try {
        // Executa a busca na linha completa
        const linhaCompleta = await buscarLinhaPorTexto(oQueProcurar);

        if (linhaCompleta) {
            console.log('Linha localizada com sucesso! Dados completos:');
            await console.log(linhaCompleta);
            
            // Se quiser acessar um campo específico dela depois:
            // console.log('O email dele é:', linhaCompleta.EMAIL);
        } else {
            console.log(`Nenhum registro encontrado com o termo: "${oQueProcurar}"`);
        }
    } catch (erro) {
        console.error('Ocorreu um erro ao processar o DBF:', erro.message);
    }
}

