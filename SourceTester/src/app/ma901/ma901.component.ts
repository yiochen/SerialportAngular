import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CHtemp } from '../_models/CHtemp';
import { Ramp } from '../_models/ramp';
import { ReceivedData } from '../_models/ReceivedData';
import { Sport } from '../_models/Sport';

@Component({
  selector: 'app-ma901',
  templateUrl: './ma901.component.html',
  styleUrls: ['./ma901.component.css']
})
export class MA901Component implements OnInit {
  baseUrl = 'http://localhost:3000/';
  PVs=new Array(8);
  SVs=new Array(8);
  setSVs=new Array(8);
  outs=new Array(8);
  ports:string[]=[];
  port:string="";
  loadingpromise=null;
  connecting=false;
  params:CHtemp={}as CHtemp;
  ramps:Ramp[]=[];
  CHpromises:any = [];
  timerPromises:any = [];
  timerID:any=[];
  timerReject:any=[];
  constructor(private http:HttpClient, private toastr: ToastrService) {
    for (let i=0;i<8;i++){
      this.ramps.push({}as Ramp);
      this.CHpromises.push(null);
      this.timerPromises.push(null);
      this.timerID.push(null);
      this.timerReject.push(null);
    }
  }

  ngOnInit(): void {
    this.loadPorts();
  }

  async connectPort(){
    console.log(this.port);
      this.http.get<ReceivedData>(this.baseUrl + 'read/PV/'+this.port).subscribe(async ()=>{
        await this.loading();
        this.connecting = true;
        this.toastr.success("Connected");
        },
        async error=>{
          if (error.status===404)
            alert("This port is not MA901 port");
        }
      );
  }

  async disconnectPort(){
    if (this.connecting===true)
    {
      this.connecting = false;
      clearTimeout(this.loadingpromise);
      await this.clearData();
      this.toastr.error("Port is disconnected!");
      for (let i=1;i<=8;i++)
        await this.stopRamp(i);
    }
  }

  async loading(){
    await this.loads();
    this.loadingpromise=setTimeout(async ()=>{
      await this.loading();
    },1000);
  }

  async loads(){
    await this.loadPVs();
    await this.loadSVs();
    await this.loadouts();
  }

  async loadPorts(){
    this.http.get<Sport>(this.baseUrl+'ports').subscribe(response=>{
      this.ports=[];
      for (let i=0;i<response.sports.length;i++)
      {
        this.ports.push(response.sports[i].path);
      }
    })
  }

  async refreshdata(raws,isfloat){
    let data=new Array(8);
    for (let i=0;i<8;i++){
      data[i]=raws[3+i*2]*256+raws[4+i*2];
      if (isfloat){
        data[i]= data[i]>60000? (data[i]-65536)/10 : data[i]/10;
      }
    }
    return data;
  }

  async loadPVs(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/PV/'+this.port).subscribe(async response=>{
        this.PVs = await this.refreshdata(response.data.data,false);
      },
      async ()=>{
        await this.disconnectPort();
      });
  }

  async loadSVs(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/SV/' + this.port).subscribe(async response=>{
        this.SVs = await this.refreshdata(response.data.data,false);
      },
      async ()=>{
        await this.disconnectPort();
      });
  }
  
  async loadouts(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/out/' + this.port).subscribe(async response=>{
        this.outs = await this.refreshdata(response.data.data,true);
      },
      async ()=>{
        await this.disconnectPort();
      });
  }

  async setSV(CH:number,temp:string){
    this.http.post(this.baseUrl+'write/SV/COM9/'+CH.toString()+'/'+temp,{}).subscribe(async ()=>{
      this.setSVs[CH-1]=null;
      await this.loadSVs();
      this.toastr.success("set CH"+CH.toString()+" to " + temp + "C");
    },
    async ()=>{
      await this.disconnectPort();
    }
    );
  }
  
  async setRamp(CH:number,start:number,end:number,per:number){
    if (per<=0) {
      this.toastr.error("Please enter positive number");
      return;
    }
    if (start===end){
      this.setSV(CH,start.toString());
      return;
    }
    let totalseconds = (end-start)*60/per;
    let secondsperdegree = totalseconds/(end-start);
    console.log(totalseconds);
    console.log(secondsperdegree);
    let crease =0;
    if (start<end) crease =1;
      else crease =-1;
    while (this.CHpromises[CH-1]!==null){
      await this.CHpromises[CH-1];
    }
    for (let i=start; i!=end+crease;i+=crease){
      this.CHpromises[CH-1] = this.setSV(CH,i.toString());
      await this.CHpromises[CH-1];
      this.timerPromises[CH-1] = this.timer(secondsperdegree*1000,CH);
      if (i!=end)
        try{
          await this.timerPromises[CH-1];
        }
        catch (e){
          console.log(e);
          break;
        }
    }
    this.clearrampdata(CH);
  }

  async timer(timerInMillisecond:number,CH:number){
    return new Promise((resolve,reject)=>{
      this.timerID[CH-1]=setTimeout(resolve,timerInMillisecond);
      this.timerReject[CH-1]=()=>{console.log("error");reject;}
    });
  }

  clearrampdata(CH:number){
    this.CHpromises[CH-1]=null;
    this.ramps[CH-1].start=null;
    this.ramps[CH-1].end=null;
    this.ramps[CH-1].per=null;
  }

  async stopRamp(CH:number){
    if (this.CHpromises[CH-1]===null)
      return;
    clearTimeout(this.timerID[CH-1]);
    this.timerReject[CH-1]();
    this.clearrampdata(CH);
  }

  async clearData(){
    for (let i=0;i<8;i++)
    {
      this.PVs[i]=null;
      this.SVs[i]=null;
      this.outs[i]=null;
    }
  }
}
