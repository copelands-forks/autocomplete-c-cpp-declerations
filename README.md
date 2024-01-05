 ***Auto Complete Declerations! C/C++***
  
  a fork of SteveveSevetS's project:
  
     the purpose of the fork was to expand the extension so that it is useful in large scale C++/C  projects as well as add my own things to it.
     a lot of source changes has been made and new features are present.
  
  New Features : 

    Auto Completion suggestion Rework:
    
      ✔️ namespaces, structs, classes, enum classes and enums have been added!
        ✔️ namespaces and data structures are now added onto method/function completions.
          
        
     Trigger key Auto Completion algorithm:
  
          ✔️ Auto Completion no longer restricted to single .cpp files where int main is present
          it works across all files now.
  
          ✔️ Auto Completion now works in headers so that it is ussful in header implementation and
          header only code.

          ✔️ Auto Completion removes suggestions from already defined functions and methods.
          
    

      
      
    
  Fork Fixes and changes :  
  
    - namespace issue, 
    - trigger key "." annoyance wont disturb you when you are accessing members of structs/classes.
    - parser algorithm now avoids running through defined code inside of functions and just looks for declerations.


contribute to this repo through pull requests or report issues  over [here](https://github.com/copelands-forks/autocomplete-c-cpp-declerations/)

[VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=jordanpetak.autocomplete-c-cpp-declerations)