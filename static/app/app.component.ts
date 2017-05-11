import { Component, OnInit } from '@angular/core';
import { Dev, Schedule } from './dev';
import { DevsService } from './devs.service'
import { Logger } from './logger.service'

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  providers: [
    Logger
  ]
})

export class AppComponent implements OnInit {
  devs: Dev[];
  selectedDev: Dev;
  schedules: Schedule[];
  newSched: Schedule;
  
  constructor( private devsService: DevsService ) {}
    
  ngOnInit() {
    this.newSched = new Schedule();
    this.devsService.getDevs()
      .then(devs => this.devs = devs)
      .catch(msg => this.alertError = msg);
  }
      
  updateSched(dev: Dev) {
    this.devsService.getSchedules(dev.name)
      .then(arr => this.schedules = arr)
      .catch(msg => this.alertError = msg);
  }

  deleteSched(id: number) {
    let dev: Dev = this.selectedDev;
    this.devsService.deleteSched(dev.name, id)
      .then(result => { this.updateSched(dev); })
      .catch(msg => this.alertError = msg);
  }

  createSched() {
    let dev: Dev = this.selectedDev;
    this.devsService.createSched(dev.name, this.newSched)
      .then(result => {
        this.newSched = new Schedule();
        this.updateSched(dev);
      })
      .catch(msg => this.alertError = msg);
  }

  selectDev(dev: Dev) {
    this.selectedDev = dev;
    this.updateSched(dev);
  }
}   


