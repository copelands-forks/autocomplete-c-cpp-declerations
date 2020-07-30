#include <string.h>

namespace sas
{   
    typedef struct sample_struct{
        int varA;
        int varB;
        char *varC;
    }sample;

    void doStuff();


    class MyClass {
        private:
            int sas;
            float ses;
            double seses();

        public:
            void myfunc();
    };
    
    int returnSomeStuff(int a, float b);
}