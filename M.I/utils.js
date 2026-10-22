
import readlineSync from 'readline-sync';

import { MercadoInterno as Oleo } from './OLEO/mercadoInternoOleo.js';
import { MercadoInterno as Farelo } from './FARELO/mercadoInternoFarelo.js';
import { MercadoInterno as Graos } from './GRAOS/mercadoInternoGraos.js';

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
