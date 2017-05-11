@Component({
  selector: 'navbar-devs',
  templateUrl: './navbar-devs.componenets.html',
  providers: [ DevsService ]
})

export class DevsCompoenet implements OnInit {
  devs: Dev[];
  selectedDev: Dev;

  constructor(private service: DevsService) {}

  ngOnInit() {
    this.devs = this.service.getDevs();
  }

  selectDev(dev: Dev) { this.selectedDev = dev }
}
