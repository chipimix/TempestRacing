# TempestMASTR

# How to install:
1) Install node modules
npm install

2) re-build native modules is via the electron-rebuild package, which handles the manual steps of downloading headers and building native modules:
# Every time you run "npm install", run this
./node_modules/.bin/electron-rebuild

# On Windows if you have trouble, try:
.\node_modules\.bin\electron-rebuild.cmd
# Communication protocol:

@S0/   ->   Sleep Mode
@S1/   ->   Normal Mode

@T/    ->   Devolve Bateria (0 a 100, Mensagem Recebida *<hex><hex>/ Exemplo:*00/)

@G0/    ->   EEG 256Hz
@G1/    ->   EEG 128Hz

@P0/    ->   PPG 256Hz
@P1/    ->   PPG 128Hz
@P2/    ->   PPG  64Hz

@M0/    ->   ACC/GYR/MAG 16Hz
@M1/    ->   ACC/GYR/MAG 8Hz
#   T e m p e s t R a c i n g  
 