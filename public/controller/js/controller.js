export class Controller {
  
  constructor(View, Service) {
    this.view = new View()
    this.Service = new Service()
  }

  static initialize(View, Service) {
    return new Controller(View, Service)
  }
}