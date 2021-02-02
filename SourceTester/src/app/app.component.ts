import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReceivedData } from './_models/ReceivedData';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'SourceTester';
  baseUrl = 'http://localhost:3000/';
  PVraws:number[];
  PVs:number[];
  SVraws:number[];
  SVs:number[];
  constructor(private http: HttpClient){
    this.loadPVs();
    this.loadSVs();
  }
  loadPVs(){
    this.http.get<ReceivedData>(this.baseUrl + 'read/PV/COM9').subscribe(response=>{
      this.PVraws = response.data.data;
      console.log(this.PVraws);
      this.PVs=[];
      for (let i=3;i<19;i=i+2)
      {
        this.PVs.push(this.PVraws[i]*256 + this.PVraws[i+1]);
      }
      console.log(this.PVs);
    });
  }
  loadSVs(){
    this.http.get<ReceivedData>(this.baseUrl + 'read/SV/COM9').subscribe(response=>{
      this.SVraws = response.data.data;
      console.log(this.SVraws);
      this.SVs=[];
      for (let i=3;i<19;i=i+2)
      {
        this.SVs.push(this.SVraws[i]*256 + this.SVraws[i+1]);
      }
      console.log(this.SVs);
    });
  }
  
}
