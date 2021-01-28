const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// const socketIo = require('socket.io');
// const io = socketIo.listen(server);

//serial port
const SerialPort = require("serialport");
const ByteLength = require('@serialport/parser-byte-length');
let sports;
SerialPort.list().then(x=>sports = x);
const httpport = 3000;

app.set('port',httpport);

server.listen(httpport);

// helper function that converts serial port API to promise
// so that we can use async await
function readSerialPort(parser) {
    return new Promise((resolve, reject) => {
      const timerid = setTimeout(reject,500);
      parser.on('data', (data) => {
        clearTimeout(timerid);
        resolve(data);
        console.log(data);
      }); // when we receive the data, we resolve the promise, marking it as complete.
    });
}
  
// helper function that writes to serial port and then wait for the result
// finally close the serial port
async function readFromSerialPort(portname, command,blength) {
    let isvalued = false;
    for (let i=0;i<sports.length;i++)
      if (sports[i]["path"]===portname)
        isvalued = true;
    if (isvalued === false)
      return -2;
    let port = new SerialPort(portname,{autoOpen:false});
    port.open();
    port.write(command);
    const parser = new ByteLength({length:blength});
    port.pipe(parser);
    try{
      return await readSerialPort(parser);
    }
    catch(e){
      return -1;
    }
    finally{
      port.close();
    }
}

async function createCRC(byteArray){
    let CRC = 0xffff;
    for (let i=0;i<byteArray.length;i++)
    {
      CRC = CRC ^ byteArray[i];
      for (let j=0;j<8;j++)
      {
        let carry_flag = false;
        if (CRC % 2===1)
          carry_flag = true;
        else
          carry_flag = false;
        CRC = CRC >>1;
        if (carry_flag)
          CRC = CRC ^ 0xa001;
      }
    }
    let low = CRC % 256;
    let high = (CRC - low) / 256;
    byteArray.push(low);
    byteArray.push(high);
    return byteArray;
}

// we will keep a reference to the promise 
// to make sure that we only write to port after we read all the data from it.

let promise = null; 

// every port has their own promise;
let promises = new Map();
setTimeout(getPromises,500);
async function getPromises()
{
  for (let i=0;i<sports.length;i++)
  {
    promises.set(sports[i]["path"],null);
  } 
}
  
app.get("/ports",async(req,res,next)=>{
    res.status(200).json({
      ports:sports
    })
})


app.get("/SV/:portname", async (req,res,next) => {
    if (promises.has(req.params.portname))
    {
      const portname = req.params.portname;
      while (promises.get(portname) !== null) {
        // there is another request that is currently waiting for serial port, so we just wait
          await promises.get(portname);
        }
        const SVreload = [1,3,0,0,0,8,68,12];
        const blength = 21;
        // finally no one is using serial port, we can start writing to it and wait for the result
        promises.set(portname,readFromSerialPort(portname, SVreload, blength));
        // promise = readFromSerialPort(req.params.portname, SVreload, blength);
        const data = await promises.get(portname); 
        // by await, we give the control back to system to call us back when promise finishes.
        promises.set(portname,null);
        // promise = null; 
        // set global promise variable to null, meaning, we are done using serial port in this request, 
        // other requests can start using it if they are waiting for serial port.
        res.status(200).json({
            posts:data
        })
    }
    // do something about data,
    next();
});

app.get("/PV/:portname", async (req,res,next) => {
    while (promise !== null) {
    // there is another request that is currently waiting for serial port, so we just wait
      await promise;
    }
    const PVreload = [1,3,0,200,0,8,197,242];
    const blength = 21;
    // finally no one is using serial port, we can start writing to it and wait for the result
    promise = readFromSerialPort(req.params.portname, PVreload, blength);
    const data = await promise; 
    // by await, we give the control back to system to call us back when promise finishes.
    promise = null; // set global promise variable to null, meaning, we are done using serial port in this request, 
    // other requests can start using it if they are waiting for serial port.
    res.status(200).json({
        posts:data
    })
    // do something about data,
    next();
});

app.get("/setSV/:portname/:ch/:tem", async (req,res,next) => {
    while (promise !== null) {
    // there is another request that is currently waiting for serial port, so we just wait
      await promise;
    }
    let setSV = new Array(1,6,0);
    setSV.push(200+ parseInt(req.params.ch) -1);
    let low = req.params.tem % 256;
    let high = (req.params.tem - low) / 256;
    setSV.push(high);
    setSV.push(low);
    setSV = await createCRC(setSV);
    const blength = 8;
    // finally no one is using serial port, we can start writing to it and wait for the result
    promise = readFromSerialPort(req.params.portname, setSV, blength);
    const data = await promise; 
    // by await, we give the control back to system to call us back when promise finishes.
    promise = null; // set global promise variable to null, meaning, we are done using serial port in this request, 
    // other requests can start using it if they are waiting for serial port.
    res.status(200).json({
        posts:data
    })
    // do something about data,
    next();
});