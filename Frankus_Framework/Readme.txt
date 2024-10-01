@Overview@
Frankus the Nerd is my online website for storing and managing projects, articles, and
other cool things that I program. I prefer the site to be secret as I work on all kinds
of secret projects all the time.

@About Me@
I, Francois, am Frankus the Nerd. I am a nerd and all I do is ride my bike and program. I'd like to
do both and I'm working toward that.

@What to Expect@
I work on all kinds of projects from C++ to JavaScript. I program games, web apps, GPS apps, tools -
anything my mind can handle.

So far I have a number of projects created:

#Frankus the Nerd#
This website.

#Game Lab#
A 2D game development studio with a built in engine.

#Layout Engine#
I wrote one in C++ because I didn't have a layout engine. It's similar to the one written for this site.

@My Coding Standards@
Yes, let's talk about this. This is how I code:

#Identifiers#
%
var my_var = 5;
%
#Functions#
%
function My_Function() {

}
%
#Classes#
%
class cMy_Class {

}
%
#Constants#
%
const MY_CONSTANT = 1;
%
#Structures#
%
struct sMy_Structure {

}
%
#Enumerations#
%
enum eEnumerations {
  eSTATE_1,
  eSTATE_2
}
%
#File Naming#
%
File_1.txt
File_2.png
File_3.mp3
%
#Hash Map Keys#
%
cHash<std::string, int> my_hash;
my_hash["new-property"] = 5;
%
#JavaScript#
In JavaScript I use let to define all variables including global variables.

#Code Formatting#
%
/**** <- Document each function.
 ** Converts a binary string to a number.
 ** @@param binary The binary string.
 ** @@return The number.
 **/
function Binary_To_Number(binary) { <- Indent 2 spaces.
  let digit_count = binary.length; <- No blanks lines in function.
  let number = 0;
  for (let digit_index = 0; digit_index < digit_count; digit_index++) {
    let digit = parseInt(binary.charAt(digit_index));
    let bit_value = Math.pow(2, digit_count - digit_index - 1);
    number += (bit_value ** digit); <- Spaces between operators.
  }
  return Math.floor(number);
}
<- Blank line after function.
%
#Header Comments#
%
// ============================================================================ <- 80 characters.
// Compiler Tool <- Name of program or module.
// Programmed by Francois Lamini <- Author who programmed module or program.
// ============================================================================
%
#Section Comments#
%
// ***************************************************************************** <- 80 characters.
// Compile Nerd Implementation <- Name of section.
// *****************************************************************************
%
