const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// const socketIo = require('socket.io');
// const io = socketIo.listen(server);

//serial port
const SerialPort = require("serialport");
const ByteLength = require('@serialport/parser-byte-length');
const httpport = 3000;

app.set('port',httpport);

server.listen(httpport);

// helper function that converts serial port API to promise
// so that we can use async await
function readSerialPort(parser) {
    return new Promise((resolve, reject) => {
      try{
        const timerid = setTimeout(reject,500);
        parser.on('data', (data) => {
          clearTimeout(timerid);
          resolve(data);
          // console.log(data);
        }); // when we receive the data, we resolve the promise, marking it as complete.
      }
      catch{
        reject;
      }
    });
}

function closePromise(port){
  return new Promise((resolve, reject) => {
    port.close((error) => {
      if (error) {
        reject();
      } else {
        resolve()
      }
    })
  });
}

// helper function that writes to serial port and then wait for the result
// finally close the serial port
async function readFromSerialPort(portname, command,blength, test) {
    await SerialPort.list().then(x=>sports = x);
    let isvalued = false;
    for (let i=0;i<sports.length;i++)
      if (sports[i]["path"]===portname)
        isvalued = true;
    if (isvalued === false)
      return false;
    let port;
    try{
      port=new SerialPort(portname,{autoOpen:false});
    }
    catch{
      return false;
    }
    port.open();
    port.write(command);
    const parser = new ByteLength({length:blength});
    port.pipe(parser);
    let data;
    try{
      return await readSerialPort(parser);
    }
    catch(e){
      return false;
    }
    finally{
      await closePromise(port);
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
let sports;
getPromises();

async function getPromises()
{
  //refresh SerialPort which we have now.
  await SerialPort.list().then(x=>sports = x);
  for (let i=0;i<sports.length;i++)
  if (promises.has(sports[i]["path"])===false)
  {
    promises.set(sports[i]["path"],null);
  }
  if (promises.size!==sports.length)
  {
    for (let[key,value]of promises)
    {
      let hasport = false;
      for (let i=0;i<sports.length;i++)
      if (key===sports[i]["path"])
      {
        hasport = true;
        break;
      }
      if (hasport===false)
        promises.delete(key);
    }
  }
  setTimeout(getPromises,5000);
}

app.use((req,res,next) =>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "*"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, PUT, OPTIONS"
  );
  next();
})

//get available ports lists
app.get("/ports",async(req,res,next)=>{
    await SerialPort.list().then(x=>sports = x);
    res.status(200).json({
      sports
    })
})

app.get("/read/:command/:portname", async (req,res,next) => {
  // console.log(promises);
  const portname = req.params.portname;
  if (promises.has(portname))
  {
    let command;
    let blength;
    let hascommand=false;
    // read SV
    if (req.params.command === "SV"){
      command = [1,3,0,200,0,8,197,242];
      blength = 21;
      hascommand = true;
    }
    //read PV  
    else if (req.params.command === "PV"){
      command = [1,3,0,0,0,8,68,12];
      blength = 21;
      hascommand = true;
    }
    //read output
    else if (req.params.command === "out"){
      command = [1,3,0,20,0,8,4,8];
      blength = 21;
      hascommand = true;
    }
    // console.log(sports);
    while (promises.get(portname) !== null) {
      // there is another request that is currently waiting for serial port, so we just wait
        await promises.get(portname);
    }
    if (hascommand){
      // console.log(command);
      // finally no one is using serial port, we can start writing to it and wait for the result
      promises.set(portname,readFromSerialPort(portname, command, blength));
      // promise = readFromSerialPort(req.params.portname, SVreload, blength);
      const data = await promises.get(portname); 
      // by await, we give the control back to system to call us back when promise finishes.
      if (data===false)
        res.status(404);
      else
        res.status(200).json({
          data
        })
      promises.set(portname,null);
      // promise = null; 
      // set global promise variable to null, meaning, we are done using serial port in this request, 
      // other requests can start using it if they are waiting for serial port.
    }
  }
  next();
});

app.post("/write/:command/:portname/:ch/:temp",async (req,res,next)=>{
  //  console.log(promises);
  const portname = req.params.portname;
  if (promises.has(portname)){
    let command;
    let blength;
    let hascommand=false;
    if (req.params.command === "SV"){
      command = new Array(1,6,0);
      command.push(200+ parseInt(req.params.ch) -1);
      let low = req.params.temp % 256;
      let high = (req.params.temp - low) / 256;
      command.push(high);
      command.push(low);
      command = await createCRC(command);
      blength = 8;
      hascommand=true;
      // console.log(command);
    }
    while (promises.get(portname) !== null) {
      // there is another request that is currently waiting for serial port, so we just wait
        await promises.get(portname);
    }
    if (hascommand){
      // console.log(command);
      // finally no one is using serial port, we can start writing to it and wait for the result
      promises.set(portname,readFromSerialPort(portname, command, blength));
      // promise = readFromSerialPort(req.params.portname, SVreload, blength);
      const data = await promises.get(portname); 
      // console.log(data);
      // by await, we give the control back to system to call us back when promise finishes.
      res.status(200).json({
        data
      })
      promises.set(portname,null);
      // promise = null; 
      // set global promise variable to null, meaning, we are done using serial port in this request, 
      // other requests can start using it if they are waiting for serial port.
    }
  }
  next();
})
