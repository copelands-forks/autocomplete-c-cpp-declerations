#include <stdio.h>

typedef struct Libro
{
    int codice;
    char *titolo;
    char *autore;
    char *casa_editrice;
    int anno;
    char stato; //D - libero, P - in prestito
    int numero_copie;
}Book;

char *get_line();
char *get_line_msg(char *);
Book *new_libro();
void stampa_libro(Book *);
//ciao ciao();
int prendi_in_prestito(Book *);
/*
void doNotTakeThisFunction();
*/

int main(){
    return 0;
}
