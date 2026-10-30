import { cancelarCadastro } from "./cadastro/cancelar/cancelarCadastro.js";
import { executar } from "./cadastro/alterar-ler/ler.js";
import { incluir } from "./cadastro/incluir/incluir.js";
import  readlineSync  from 'readline-sync';
import { iniciar } from "./M.I/utils.js"
import { consultarMercadoInterno } from "./M.I/consulta.js";




async function Execute(){
    console.log('\nEscolha qual opção deseja acessar: ');
    console.log('1. CADASTRO');
    console.log('2. MERCADO INTERNO');
    
    const option = readlineSync.question('\nOpção: ').trim();
    
    switch(option){
        case "1":
            console.log('<=========CADASTRO==========>');
            console.log('1. Inclusão');
            console.log('2. Ler/Alterar');
            console.log('3. Cancelar cadastro existente');

            const cad = readlineSync.question('\nOpção: ').trim();

            if(cad === "1"){
                incluir()
            }else if(cad === "2"){
                executar()
            }else{
                cancelarCadastro()
            }
            
        break;
        case "2":
            console.log('<=========MERCADO-INTERNO==========>');
            console.log('1. Inclusão');
            console.log('2. Ler/Alterar');
            
            const mi = readlineSync.question('\nOpção: ').trim();

            if(mi === "1"){
                iniciar()
            }else{
                consultarMercadoInterno()
            }
            
        break;
        
    }
    
}
Execute();