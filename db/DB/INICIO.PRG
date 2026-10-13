*
*  Programa    = INICIO.PRG
*  Programador = RICARDO TALARICO
*  Data        = 05/06/90     Ultima Atualizacao -> 03/02/2000
*  Finalidade  = Configuracao do DBase III Plus
*

set talk off
set function 8 to "set status on;"
set function 10 to "quit;"
set date BRITISH
set century ON
set color to W/B
set procedure to DBPROC

DIA1="Domingo"
DIA2="Segunda"
DIA3="Ter"+chr(135)+"a"
DIA4="Quarta"
DIA5="Quinta"
DIA6="Sexta"
DIA7="Sabado"
MES01="Janeiro"
MES02="Fevereiro"
MES03="Mar"+chr(135)+"o"
MES04="Abril"
MES05="Maio"
MES06="Junho"
MES07="Julho"
MES08="Agosto"
MES09="Setembro"
MES10="Outubro"
MES11="Novembro"
MES12="Dezembro"
HOJE = ltrim(str(dow(date())))
RPE=DATE()
DATA=dtoc(RPE)
MESEXT=substr(DATA,4,2)
EXTE=DIA&HOJE+", "+substr(DATA,1,2)+" de " +MES&MESEXT+" de "+substr(DATA,7,4)+"."
MSGE=EXTE
set message to MSGE
set talk ON
set status ON
return

* Fim do Programa INICIO.PRG
