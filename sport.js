const SerialPort = require("serialport");
const ByteLength = require('@serialport/parser-byte-length');
const port = new SerialPort("COM9");
const parser = new ByteLength({length:21});
port.pipe(parser);
parser.on("data",(line)=>{
    var i;
    var out = [];
    var a = 0;
    for (i=3;i<=18;i=i+2)
    {
        out[a]=line[i]*256+line[i+1];
        console.log(out[a]);
    }
});

// const number = [1,3,0,200,0,8,197,242];
// port.write(number);
module.exports = port;