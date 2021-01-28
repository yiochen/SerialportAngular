const SerialPort = require("serialport");
const port = new SerialPort("COM9");

const person = {
    name:"Bob",
    age:23
}

port.write('hi\n');