import dbffile from 'dbffile';
const { DBFFile } = dbffile;


    export function gerar(numeroAtual) {
        if (!Number.isInteger(numeroAtual) ||
            numeroAtual < 0 ||
            numeroAtual > 9999) {
            throw new Error("Contador fora do limite de 4 dígitos.");
        }

        const codigoBase = String(numeroAtual).padStart(4, "0");

        const digitos = codigoBase.split("").map(Number);

        const fator = digitos.reduce(
            (total, digito, indice) =>
                total + digito * (5 - indice),
            0
        );

        const resto = fator % 11;

    
        let verificador;

        if (resto === 1) {
            verificador = "P";
        } else if (resto === 0) {
            verificador = "0";
        } else {
            verificador = String(11 - resto);
        }

       
        const ncode = `${codigoBase}-${verificador}`;
        return ncode;
        
    }

