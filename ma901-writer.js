const SerialPort = require("serialport");
const Readline = require("@serialport/parser-cctalk");
const port = new SerialPort("COM9");
//const number = [1,6,0,200,0,20,8,59];
const number = [1,3,0,0,0,8,68,12];
port.write(number);