export class Dev {
  name: string;
  fullname: string;

  constructor(name: string, fullname: string) {
    this.name = name;
    this.fullname = fullname;
  }
}

export class Schedule {
  id: number;
  time_ini_h: number;
  time_ini_m: number;
  time_end_h: number;
  time_end_m: number;
  period_on: number;
  period_off: number;
  inc_ini: number;
  inc_end: number;
}

