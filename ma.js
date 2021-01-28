const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// const socketIo = require('socket.io');
// const io = socketIo.listen(server);

//serial port
const SerialPort = require("serialport");
const ByteLength = require('@serialport/parser-byte-length');
const port = new SerialPort("COM9");
const parser = new ByteLength({length:21});
port.pipe(parser);

const httpport = 3000;

app.set('port',httpport);

server.listen(httpport);


// helper function that converts serial port API to promise
// so that we can use async await
function readSerialPort(parser) {
    return new Promise((resolve, reject) => {
      parser.on('data', (data) => resolve(data)); // when we receive the data, we resolve the promise, marking it as complete.
    });
  }
  
  // helper function that writes to serial port and then wait for the result
  // finally close the serial port
async function readFromSerialPort(port, command) {
    port.write(command);
    const data = await readSerialPort(parser);
    port.close();
    return data;
  }
  
  // we will keep a reference to the promise 
  // to make sure that we only write to port after we read all the data from it.
  let promise = null; 
  
  app.get("/PV", async (req,res,next) => {
    while (promise !== null) {
      // there is another request that is currently waiting for serial port, so we just wait
      await promise;
    }
    const PVreload = [1,3,0,200,0,8,197,242];
    // finally no one is using serial port, we can start writing to it and wait for the result
    promise = readFromSerialPort(port, PVreload);
    const data = await promise; // by await, we give the control back to system to call us back when promise finishes.
    promise = null; // set global promise variable to null, meaning, we are done using serial port in this request, 
    // other requests can start using it if they are waiting for serial port.
    res.status(200).json({
        posts:data
    })
    // do something about data,
    next();
  });

  app.get("/SV", async (req,res,next) => {
    while (promise !== null) {
      // there is another request that is currently waiting for serial port, so we just wait
      await promise;
    }
    const SVreload = [1,6,0,200,0,20,8,59];
    // finally no one is using serial port, we can start writing to it and wait for the result
    promise = readFromSerialPort(port, SVreload);
    const data = await promise; // by await, we give the control back to system to call us back when promise finishes.
    promise = null; // set global promise variable to null, meaning, we are done using serial port in this request, 
    // other requests can start using it if they are waiting for serial port.
    res.status(200).json({
        posts:data
    })
    // do something about data,
    next();
  });

// const number = [1,3,0,200,0,8,197,242];
// port.write(number);
// module.exports = port


// app.get('/PV',(req,res,next)=>{
//     const PVreload = [1,3,0,200,0,8,197,242];
//     port.write(PVreload);
//     //out=port.read(21);
//     console.log(test);
//     //parser.off();
//     res.status(200).json({
//         posts:out
//     })
//     next();
// });
// app.get('/SV',(req,res,next)=>{
//     // const SVreload = [1,3,0,0,0,8,68,12];
//     const SVreload = [1,6,0,200,0,20,8,59]
//     port.write(SVreload);
//     // parser.off();
//     out
//     res.status(200).json({
        
//     })
//     next();
// });

// var out = [];
// parser.on("data",(line)=>{
//     var i;
//     var a = 0;
//     out = [];
//     for (i=3;i<=18;i=i+2)
//     {
//         out.push(line[i]*256+line[i+1]);
//         // console.log(out[a]);
//     }
//     out
//     console.log(out[0]);
// });