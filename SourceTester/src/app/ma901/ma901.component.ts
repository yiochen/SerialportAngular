import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReceivedData } from '../_models/ReceivedData';

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
  outraws:number[];
  outs=new Array(8);
  constructor(private http:HttpClient) { }

  ngOnInit(): void {
    this.loads();
  }

  loads(){
    this.loadPVs();
    this.loadSVs();
    this.loadouts();
  }
  loadPVs(){
    this.http.get<ReceivedData>(this.baseUrl + 'read/PV/COM9').subscribe(response=>{
      this.PVraws = response.data.data;
      console.log(this.PVraws);
      for (let i=0;i<8;i++)
      {
        this.PVs[i]=this.PVraws[3+i*2]*256+this.PVraws[4+i*2];
      }
      console.log(this.PVs);
    });
  }

  loadSVs(){
    this.http.get<ReceivedData>(this.baseUrl + 'read/SV/COM9').subscribe(response=>{
      this.SVraws = response.data.data;
      console.log(this.SVraws);
      for (let i=0;i<8;i++)
      {
        this.SVs[i]=this.SVraws[3+i*2]*256+this.SVraws[4+i*2];
      }
      console.log(this.SVs);
    });
  }
  
  loadouts(){
    this.http.get<ReceivedData>(this.baseUrl + 'read/out/COM9').subscribe(response=>{
      this.outraws = response.data.data;
      console.log(this.outraws);
      for (let i=0;i<8;i++)
      {
        this.outs[i]=this.outraws[3+i*2]*256+this.outraws[4+i*2];
        if (this.outs[i]>60000)
          this.outs[i]=(this.outs[i]-65536)/10;
        else
          this.outs[i]=this.outs[i]/10;
      }
      console.log(this.outs);
    });
  }
}
