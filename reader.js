const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const port = new SerialPort("COM30");
const parser = new Readline();
port.pipe(parser);
parser.on("data",(line)=>console.log(line));