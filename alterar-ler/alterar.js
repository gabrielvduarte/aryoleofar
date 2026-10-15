
import fs from 'node:fs/promises';
import readlineSync from 'readline-sync';

const caminho = 'C:/Users/Roque Savioli/Desktop/arquivo-projeto/aryoleofar/CADCLI.DBF';

export async function alterarCampo(indiceRegistro, campo, novoValor) {
    const arquivo = await fs.readFile(caminho);

    // Lê as informações estruturais do DBF.
    const quantidadeRegistros = arquivo.readUInt32LE(4);
    const tamanhoCabecalho = arquivo.readUInt16LE(8);
    const tamanhoRegistro = arquivo.readUInt16LE(10);

    if (
        !Number.isInteger(indiceRegistro) ||
        indiceRegistro < 0
    ) {
        throw new Error('Índice de registro inválido.');
    }

    // Identifica os campos e seus deslocamentos dentro do registro.
    const campos = [];
    let posicao = 32;
    let deslocamento = 1; // O primeiro byte indica exclusão do registro.

    while (posicao < tamanhoCabecalho && arquivo[posicao] !== 0x0D) {
        const nome = arquivo
            .subarray(posicao, posicao + 11)
            .toString('ascii')
            .replace(/\0.*$/, '')
            .trim();

        const tipo = String.fromCharCode(arquivo[posicao + 11]);
        const tamanho = arquivo[posicao + 16];

        campos.push({ nome, tipo, tamanho, deslocamento });

        deslocamento += tamanho;
        posicao += 32;
    }

    const definicao = campos.find(
        f => f.nome.toUpperCase() === campo.toUpperCase()
    );

    if (!definicao) {
        throw new Error(`O campo "${campo}" não existe no DBF.`);
    }

    if (!['C', 'L'].includes(definicao.tipo)) {
        throw new Error(
            `O campo "${definicao.nome}" tem tipo ${definicao.tipo}, não suportado por esta rotina.`
        );
    }

    // Converte o índice da lista de registros ativos para o índice físico do arquivo.
    let ativosEncontrados = 0;
    let indiceFisico = -1;

    for (let i = 0; i < quantidadeRegistros; i++) {
        const inicio = tamanhoCabecalho + i * tamanhoRegistro;

        if (inicio + tamanhoRegistro > arquivo.length) {
            throw new Error('Estrutura do DBF inconsistente.');
        }

        if (arquivo[inicio] !== 0x2A) {
            if (ativosEncontrados === indiceRegistro) {
                indiceFisico = i;
                break;
            }

            ativosEncontrados++;
        }
    }

    if (indiceFisico === -1) {
        throw new Error('Registro não encontrado ou índice inválido.');
    }

    const inicioRegistro =
        tamanhoCabecalho + indiceFisico * tamanhoRegistro;

    const inicioCampo = inicioRegistro + definicao.deslocamento;

    const valorAtual = arquivo
        .subarray(inicioCampo, inicioCampo + definicao.tamanho)
        .toString('latin1')
        .trim();

    let bytesNovos;

    if (definicao.tipo === 'C') {
        const texto = String(novoValor);
        bytesNovos = Buffer.from(texto, 'latin1');

        if (bytesNovos.length > definicao.tamanho) {
            throw new Error(
                `O valor excede o limite de ${definicao.tamanho} caracteres/bytes do campo.`
            );
        }

        const preenchido = Buffer.alloc(definicao.tamanho, 0x20);
        bytesNovos.copy(preenchido);
        bytesNovos = preenchido;
    } else {
        const resposta = String(novoValor).trim().toLowerCase();

        if (['s', 'sim', 'true', '1', 't'].includes(resposta)) {
            bytesNovos = Buffer.from('T');
        } else if (['n', 'nao', 'não', 'false', '0', 'f'].includes(resposta)) {
            bytesNovos = Buffer.from('F');
        } else {
            throw new Error('Para ETIQ, informe sim ou não.');
        }
    }

    console.log('\n=== ALTERAÇÃO DE CADASTRO ===');
    console.log(`Registro ativo: ${indiceRegistro}`);
    console.log(`Campo: ${definicao.nome}`);
    console.log(`Valor atual: ${valorAtual}`);
    console.log(`Novo valor: ${String(novoValor)}`);

    const confirmar = readlineSync
        .question('\nConfirma a alteração? (s/n): ')
        .trim()
        .toLowerCase();

    if (confirmar !== 's') {
        console.log('Alteração cancelada.');
        return;
    }

    // Cria um backup único antes de modificar o original.
    const backup = `${caminho}.${Date.now()}.bak`;
    await fs.copyFile(caminho, backup);

    // Grava somente os bytes do campo escolhido.
    const arquivoAberto = await fs.open(caminho, 'r+');

    try {
        await arquivoAberto.write(
            bytesNovos,
            0,
            bytesNovos.length,
            inicioCampo
        );

        await arquivoAberto.sync();
    } finally {
        await arquivoAberto.close();
    }

    console.log('\nAlteração gravada com sucesso!');
    console.log(`Backup criado em: ${backup}`);
}
