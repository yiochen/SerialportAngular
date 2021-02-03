import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { compilePipeFromMetadata } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { CHtemp } from '../_models/CHtemp';
import { ReceivedData } from '../_models/ReceivedData';
import { Sport } from '../_models/Sport';

@Component({
  selector: 'app-ma901',
  templateUrl: './ma901.component.html',
  styleUrls: ['./ma901.component.css']
})
export class MA901Component implements OnInit {
  baseUrl = 'http://localhost:3000/';
  PVraws:number[];
  PVs=new Array(8);
  SVraws:number[];
  SVs=new Array(8);
  setSVs=new Array(8);
  outraws:number[];
  outs=new Array(8);
  ports:string[]=[];
  port:string="";
  loadingpromise=null;
  connecting=false;
  params:CHtemp={}as CHtemp;
  constructor(private http:HttpClient, private toastr: ToastrService) { }

  ngOnInit(): void {
    this.loadPorts();
  }

  connectPort(){
    console.log(this.port);
      this.http.get<ReceivedData>(this.baseUrl + 'read/PV/'+this.port).subscribe(response=>{
        this.loading();
        this.connecting = true;
        this.toastr.success("Connected");
        },
        error=>{
          if (error.status===404)
            alert("This port is not MA901 port");
        }
      );
  }

  disconnectPort(){
    if (this.connecting===true)
    {
      this.connecting = false;
      clearTimeout(this.loadingpromise);
      this.clearData();
      this.toastr.error("Port are disconnected!");
    }
  }

  loading(){
    this.loads();
    this.loadingpromise=setTimeout(()=>{
      this.loading();
    },1000);
  }

  loads(){
    this.loadPVs();
    this.loadSVs();
    this.loadouts();
  }

  loadPorts(){
    this.http.get<Sport>(this.baseUrl+'ports').subscribe(response=>{
      this.ports=[];
      for (let i=0;i<response.sports.length;i++)
      {
        this.ports.push(response.sports[i].path);
      }
    })
  }

  loadPVs(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/PV/'+this.port).subscribe(response=>{
        this.PVraws = response.data.data;
        for (let i=0;i<8;i++)
        {
          this.PVs[i]=this.PVraws[3+i*2]*256+this.PVraws[4+i*2];
        }
      },
      error=>{
        this.disconnectPort();
      });
  }

  loadSVs(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/SV/' + this.port).subscribe(response=>{
        this.SVraws = response.data.data;
        for (let i=0;i<8;i++)
        {
          this.SVs[i]=this.SVraws[3+i*2]*256+this.SVraws[4+i*2];
        }
      },
      error=>{
        this.disconnectPort();
      });
  }
  
  loadouts(){
    if (this.connecting===true)
      this.http.get<ReceivedData>(this.baseUrl + 'read/out/' + this.port).subscribe(response=>{
        this.outraws = response.data.data;
        for (let i=0;i<8;i++)
        {
          this.outs[i]=this.outraws[3+i*2]*256+this.outraws[4+i*2];
          if (this.outs[i]>60000)
            this.outs[i]=(this.outs[i]-65536)/10;
          else
            this.outs[i]=this.outs[i]/10;
        }
      },
      error=>{
        this.disconnectPort();
      });
  }

  setSV(CH:number,temp:string){
    console.log(this.params);
    this.http.post(this.baseUrl+'write/SV/COM9/'+CH.toString()+'/'+temp,{}).subscribe(response=>{
      this.setSVs[CH-1]=null;
      this.toastr.success("set CH"+CH.toString()+" to " + temp + "C");
    },
    error=>{

    }
    );
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
