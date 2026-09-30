## Slide 1

picoCTF
Prep/KickOff
fortune | cowsay
_____________________________________
/ Hacker who underestimated youth now \
\ debugging ego. /
-------------------------------------
\ ^__^
\ (oo)\_______
(__)\ )\/\
||----w |
|| ||
2600NYC Cyber Sheeple / March 2026 / Joe V

## Slide 2

Breakdown
Tools
Practice
Organizing Writeups
Overview

## Slide 3

● 8 Major CTFs (since 2017)
○ 6 of them on picoGym (since 2019)
● 4 Mini CTFs (since 2020)
● 1 picoGym exclusive
Breakdown:
picoCTF / picoGym
Then: picoCTF 2019 Easy (15) Medium (34) Hard (35)
General Skills (12) 7 5 0
Forensics (21) 1 9 11
Reverse Engineering (21) 1 6 14
Binary Exploitation (3) 0 0 3
Cryptography (15) 2 8 5
Web Exploitation (12) 4 6 2
Now: picoCTF 2025 Easy (14) Medium (22) Hard (5)
General Skills (5) 4 1 0
Forensics (6) 2 4 0
Reverse Engineering (7) 1 6 0
Binary Exploitation (3) 1 4 1
Cryptography (15) 2 2 2
Web Exploitation (11) 4 5 2

## Slide 4

General Skills
● 6 Categories
● 3 Difficulties
○ Easy: 82
○ Medium: 235
○ Hard: 122 Reverse Engineering
Cryptography
Forensics
Binary Exploitation
Breakdown:
Categories
Web Exploitation
Easy: 38
Medium: 20
Hard: 0
Easy: 13
Medium: 48
Hard: 17
Easy: 3
Medium: 56
Hard: 32
Easy: 3
Medium: 34
Hard: 31
Easy: 6
Medium: 37
Hard: 28
Easy: 19
Medium: 39
Hard: 14

## Slide 5

dCode (specifically cipher recognizer)
CyberChef is especially good at compound operations
Tools: General Skills / Forensics / Cryptography

## Slide 6

● Thx Maria for Intro
● Lots of pre-installed tools
● Tips
○ Stay in interactive-mode to keep-alive
○ wget into /tmp if you prefer a clean $HOME
Tools: Webshell

## Slide 7

● Netcat (nc)
○ Used especially for Reverse Engineering, Binary Exploitation & Cryptography
● gunzip (*.gz)
● | grep -Po 'picoCTF{.*}'
● | sort -u | wc -l
● strings (especially for Forensics)
Webshell: General Skills

## Slide 8

DISKO2; picoGym Exclusive
fdisk
dd
strings
Webshell: Forensics

## Slide 9

DISKO3; picoGym Exclusive
fls
icat
More Info: The Sleuth Kit (TSK) Tool Overview
Webshell: Forensics

## Slide 10

GDB baby step 4; picoGym Exclusive
(gdb) info fun
(gdb) disas main
Webshell: Reverse Engineering

## Slide 11

GDB baby step 3; picoGym Exclusive
(gdb) break *main+22
(gdb) r # after chmod +x
(gdb) x/4xb $rbp-0x4
Webshell: Reverse Engineering

## Slide 12

Picker IV; picoGym Exclusive
(gdb) disas win
Webshell: Binary Exploitation

## Slide 13

rsa_oracle; picoCTF 2024
openssl
More Info: pwntools
Webshell: Cryptography

## Slide 14

keygenme-py; picoCTF 2021
read source code
sha256("BENNETT").hexdigest()
Grab chars of hash[1-8]; re-order them
Convert to hex
More Info: ord() & chr()
Practice: Reverse Engineering

## Slide 15

Bit-O-Asm 4; picoGym Exclusive
AI: ASM → C
Practice: Reverse Engineering

## Slide 16

buffer overflow 0; picoCTF 2022
read source code
look for input (ie. gets)
Practice: Binary Exploitation

## Slide 17

where are the robots: picoCTF 2019
Practice: Web Exploitation

## Slide 18

Insp3ct0r: picoCTF 2019
Practice: Web Exploitation

## Slide 19

Organizing Writeups: Notion

## Slide 20

Organizing Writeups: CTFd Parser/Scraper
https://github.com/p0dalirius/ctfd-parser
https://github.com/hanasuru/CTFdScraper
https://github.com/ichinano/CTFdScraper

## Slide 21

● Distributions across more CTFs
○ Compare Submission Rate
○ Establish plan of Attack
● More Hard Examples
● Coverage of picoGym Playlists
Blind Spots (if I had more time…)

## Slide 22

● Sign Up!
● Teams vs Solo
● Signal Chat
What’s Next

## Slide 23

THANK YOU
AND GOOD LUCK!
