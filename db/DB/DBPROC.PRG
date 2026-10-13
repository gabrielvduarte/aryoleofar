*
*  Arquivo     = DBPROC.PRG
*  Programador = RICARDO TALARICO
*  Data        = 09/03/89     Ultima Atualizacao -> 04/02/92
*  Finalidade  = Juncao dos Procedimentos ARYPROC?.PRG
*                para uso dentro do DBase III Plus
*

*****************************************************************************

procedure EXTENSO

parameters MNUMERO

N01="UM "
N02="DOIS "
N03="TRES "
N04="QUATRO "
N05="CINCO "
N06="SEIS "
N07="SETE "
N08="OITO "
N09="NOVE "
N00=" "
N10="DEZ "
N11="ONZE "
N12="DOZE "
N13="TREZE "
N14="QUATORZE "
N15="QUINZE "
N16="DEZESSEIS "
N17="DEZESSETE "
N18="DEZOITO "
N19="DEZENOVE "
N20="VINTE "
N30="TRINTA "
N40="QUARENTA "
N50="CINQUENTA "
N60="SESSENTA "
N70="SETENTA "
N80="OITENTA "
N90="NOVENTA "
N000=" "
N100="CENTO "
N200="DUZENTOS "
N300="TREZENTOS "
N400="QUATROCENTOS "
N500="QUINHENTOS "
N600="SEISCENTOS "
N700="SETECENTOS "
N800="OITOCENTOS "
N900="NOVECENTOS "
MIL="MIL "
MILHAO="MILHAO "
MILHOES="MILHOES "
MOEDA="REAL "
MOEDAS="REAIS "
CENTAVO="CENTAVO "
CENTAVOS="CENTAVOS "

do while .T.

if MNUMERO = 0.00
   exit
endif

NUMERO1=str(MNUMERO,13,2)
CENTS=str((MNUMERO-int(MNUMERO))*100,2)
MNUMERO=int(MNUMERO)
CONTADOR=1
P1=substr(NUMERO1,2,3)
P2=substr(NUMERO1,5,3)
P3=substr(NUMERO1,8,3)
P4=CENTS
TEXTO1=""
TEXTO2=""
TEXTO3=""
TEXTO4=""
LINHA1=""
LINHA2=""
LINHA3=""

if val(P1) > 0
   STATUS1=iif(val(P1)>1,"2","1")
else
   STATUS1=" "
endif

do while CONTADOR <= 4
   ITEM=str(CONTADOR,1)
   GRUPO="P"+str(CONTADOR,1)
   EXTENSO=iif(&GRUPO="000","",ltrim(&GRUPO))

   do case
      case len(EXTENSO)=3

         if EXTENSO="100"
            TEXTO&ITEM=TEXTO&ITEM+"CEM "
            CONTADOR=CONTADOR+1
            loop
         endif

         if right(EXTENSO,2)="00"
            TAB="N"+substr(EXTENSO,1,1)+"00"
            TEXTO&ITEM=TEXTO&ITEM+&TAB
            CONTADOR=CONTADOR+1
            loop
         endif

         TAB="N"+left(EXTENSO,1)+"00"
         TEXTO&ITEM=&TAB+"E "
         DEZENA=val(right(EXTENSO,2))

         if DEZENA <20
            TAB="N"+right(EXTENSO,2)
            TEXTO&ITEM=TEXTO&ITEM+&TAB
            CONTADOR=CONTADOR+1
            loop
         else
            TAB="N"+substr(EXTENSO,2,1)+"0"
            TEXTO&ITEM=TEXTO&ITEM+&TAB
            TAB="N0" + right(EXTENSO,1)
            UNIDADE=val(right(EXTENSO,1))

            if UNIDADE > 0
               TEXTO&ITEM=TEXTO&ITEM+iif(val(EXTENSO)>10,"E ","")
            endif

            TEXTO&ITEM=TEXTO&ITEM+iif(TAB="N00"," ",&TAB)

         endif

      case len(EXTENSO)=2
         DEZENA=val(right(EXTENSO,2))

         if DEZENA < 20
            TAB="N"+right(EXTENSO,2)
            TEXTO&ITEM=TEXTO&ITEM+&TAB
            CONTADOR=CONTADOR+1
            loop
         else
            TAB="N"+substr(EXTENSO,1,1)+"0"
            TEXTO&ITEM=TEXTO&ITEM+&TAB
            TAB="N0"+right(EXTENSO,1)
            UNIDADE1=val(right(EXTENSO,1))

            if UNIDADE1 > 0
               TEXTO&ITEM=TEXTO&ITEM+ "E "
            endif

            TEXTO&ITEM=TEXTO&ITEM+iif(TAB="N00"," ",&TAB)

         endif

      case len(EXTENSO)=1
         TAB="N0"+right(EXTENSO,1)
         TEXTO&ITEM=TEXTO&ITEM+iif(TAB="N00"," ",&TAB)
      otherwise
         TEXTO&ITEM=""
   endcase

   CONTADOR = CONTADOR+1

enddo

if val(P1+P2+P3)=0 .and. val(P4) # 0
   FINAL=TEXTO4+(iif(val(P4)=1,CENTAVO,CENTAVOS))
   loop
endif

FINAL=iif(len(TEXTO1)=0,"",TEXTO1+iif(STATUS1="1",MILHAO,MILHOES))+iif(len(TEXTO2)=0,"",TEXTO2+MIL)+TEXTO3+iif(val(P2+P3)=0,"DE ","")
FINAL=FINAL+iif(val(P1+P2+P3)=0,"",iif(val(P1+P2+P3)=1,MOEDA,MOEDAS))
FINAL=FINAL+iif(val(P4)=0,"",iif(val(P1+P2+P3)=0,"","E "+TEXTO4 + iif(val(P4)=1,CENTAVO,CENTAVOS)))

****   AJUSTE   ******

LINHA=78
TEXTO1=FINAL
PINICIAL=1
PFINAL=LINHA
TESTE=.T.
ITEM="1"

if len(TEXTO&ITEM) > LINHA

   do while val(ITEM) <= 3
      do while PFINAL<len(TEXTO&ITEM)

         BRANCO=substr(TEXTO&ITEM,PFINAL,1)

         if BRANCO <> " "
            PFINAL=PFINAL-1
            loop
         else
            exit
         endif

      enddo

      LINHA&ITEM=left(TEXTO&ITEM,PFINAL)
      ITEMV=ITEM
      ITEM=str(val(ITEM)+1,1)
      TEXTO&ITEM=right(TEXTO&ITEMV,len(TEXTO&ITEMV)-PFINAL)

   enddo

else
   LINHA1=FINAL
endif

LINHA1=LINHA1+replicate("*",LINHA-len(LINHA1))
LINHA2=LINHA2+replicate("*",LINHA-len(LINHA2))
LINHA3=LINHA3+replicate("*",LINHA-len(LINHA3))

* set print ON
? LINHA1
? LINHA2
? LINHA3
* set print OFF

exit
enddo
return

*****************************************************************************

procedure IMPRESSO

parameters LIN,COL

public M_IMPR
M_IMPR = space(1)

do while .T.

   @ LIN,COL say 'LIGUE A IMPRESSORA'
   set color to w*
   @ LIN+1,COL say replicate(chr(205),18)
   set color to
   @ LIN+2,COL-16 say ' [ ENTER ]   ' + chr(205) + chr(16) + '   Imprimir'
   @ LIN+3,COL-16 say ' [   X   ]   ' + chr(205) + chr(16) + '   Abandona'
   @ LIN+3,COL+31 say '[' get M_IMPR
   @ LIN+3,COL+35 say ']'
   read

   if M_IMPR = " "
      set device to PRINT
   endif

   exit

enddo

@ LIN,COL-16 clear to LIN+3,COL+35
return

*****************************************************************************

procedure DEC_SET

set device to PRINT
@ PROW(),PCOL() say chr(27)+ "M" +chr(15)
set device to SCREEN

return

*****************************************************************************

procedure DEN_SET

set device to PRINT
@ PROW(),PCOL() say chr(27)+ "M" +chr(18)
set device to SCREEN

return

*****************************************************************************

procedure DOB_SET

set device to PRINT
@ PROW(),PCOL() say chr(27) + chr(14)
set device to SCREEN

return

*****************************************************************************

procedure DPC_SET

set device to PRINT
@ PROW(),PCOL() say chr(27)+ "P" +chr(15)
set device to SCREEN

return

*****************************************************************************

procedure DPN_SET

set device to PRINT
@ prow(),pcol() say chr(027)+ "P" +chr(018)
set device to SCREEN

return

*****************************************************************************

procedure ENF_CAN

set device to print
@ PROW(),PCOL() SAY CHR(27) + "F"
set device to screen

return

*****************************************************************************

procedure ENF_SET

set device to print
@ PROW(),PCOL() SAY CHR(27) + "E"
set device to screen

return

*****************************************************************************

procedure ITA_CAN

set device to PRINT
@ PROW(),PCOL() say chr(027)+ "5"
set device to SCREEN

return

*****************************************************************************

procedure ITA_SET

set device to PRINT
@ PROW(),PCOL() say chr(027)+ "4"
set device to SCREEN

return

*****************************************************************************

procedure STK_CAN

set device to print
@ PROW(),PCOL() SAY CHR(27) + "H"
set device to screen

return

*****************************************************************************

procedure STK_SET

set device to print
@ PROW(),PCOL() SAY CHR(27) + "G"
set device to screen

return

*****************************************************************************

procedure SOM

parameters FREQ1,DURA1,FREQ2,DURA2

TONE(FREQ1,DURA1)
TONE(FREQ2,DURA2)

return

*****************************************************************************

procedure DESCRYPT

PASS1=chr(asc(substr(SENHA1,1,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,2,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,3,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,4,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,5,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,6,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,7,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,8,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,9,3))-100)
PASS1=PASS1+chr(asc(substr(SENHA1,10,3))-100)

PASS2=chr(asc(substr(SENHA2,1,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,2,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,3,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,4,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,5,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,6,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,7,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,8,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,9,3))-100)
PASS2=PASS2+chr(asc(substr(SENHA2,10,3))-100)

return

*****************************************************************************

procedure ENCRYPT

PASS1=chr(asc(substr(SENHA1,1,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,2,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,3,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,4,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,5,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,6,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,7,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,8,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,9,3))+100)
PASS1=PASS1+chr(asc(substr(SENHA1,10,3))+100)

replace SENHA1 with PASS1

PASS2=chr(asc(substr(SENHA2,1,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,2,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,3,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,4,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,5,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,6,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,7,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,8,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,9,3))+100)
PASS2=PASS2+chr(asc(substr(SENHA2,10,3))+100)

replace SENHA2 with PASS2

return

*****************************************************************************

* Fim do Arquivo de Procedures DBPROC.PRG
