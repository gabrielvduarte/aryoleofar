
import readlineSync from 'readline-sync';

import { MercadoInterno as Oleo } from './OLEO/mercadoInternoOleo.js';
import { MercadoInterno as Farelo } from './FARELO/mercadoInternoFarelo.js';
import { MercadoInterno as Graos } from './GRAOS/mercadoInternoGraos.js';
import { cancelarContrato } from './cancelaContrato.js';
import { editarRecebimento } from './recebimento/editaRecebimento.js';
import { consultarRecebimento } from './recebimento/consultaRecebimento.js';


export async function iniciar() {
    console.log('\nEscolha o produto:');
    console.log('1. Óleo');
    console.log('2. Farelo');
    console.log('3. Grãos');

    const opcao = readlineSync.question('\nOpção: ').trim();

    switch (opcao) {
        case '1': {
            const contrato = new Oleo();
            await contrato.InclusaoDeContratoNoMI();
            break;
        }

        case '2': {
            const contrato = new Farelo();
            await contrato.InclusaoDeContratoNoMI();
            break;
        }

        case '3': {
            const contrato = new Graos();
            await contrato.InclusaoDeContratoNoMI();
            break;
        }

        default:
            console.log('Opção inválida!');
    }

}


export async function contratoMi(nome, contrato){
        console.log('<=========CONTRATO MERCADO INTERNO==========>');
        console.log('1. EDITAR');
        console.log('2. CANCELAR');
        console.log('3. CRIAR UM NOVO RECEBIMENTO');
        console.log('4. EDITAR UM RECEBIMENTO');
        console.log('5. CONSULTAR UM RECEBIMENTO');
        console.log('6. SAIR');
        
        const option = readlineSync.question(
                '\nSELECIONE UMA OPÇÃO: ')


        switch (option){
            case "1":
                await editarContrato(nome, contrato);
                break;
            case "2":
                await cancelarContrato(nome, contrato);
            break
            case "3":
                await incluirRecebimento(nome, contrato);
            break
            case "4":
                await editarRecebimento(nome, contrato);
            break
            case "5":
                await consultarRecebimento(nome, contrato);
            default:
                console.log("FIM DO PROGRAMA!")
        }
        
}