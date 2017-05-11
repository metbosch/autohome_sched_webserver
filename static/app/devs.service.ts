import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import { Dev, Schedule } from './dev';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class DevsService {
  constructor(
    private http: Http
  ) {}

  getDevs(): Promise<Dev[]> {
    return this.http.get('api/')
      .toPromise()
      .then(response => response.json() as Dev[])
      .catch(this.handleError);
  }

  getSchedules(name: string): Promise<Schedule[]> {
    return this.http.get('api/' + name)
      .toPromise()
      .then(response => response.json() as Dev[])
      .catch(this.handleError);
  }

  deleteSched(name: string, id: number): Promise<string> {
    return this.http.delete('api/' + name + '/' + id)
      .toPromise()
      .then(response => { return 'OK'; })
      .catch(this.handleError);
  }

  createSched(name: string, data: Schedule): Promise<string> {
    return this.http.post('api/' + name, data)
      .toPromise()
      .then(response => { return 'OK'; })
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
