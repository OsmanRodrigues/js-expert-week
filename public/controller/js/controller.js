export class Controller {
  
  constructor(View, Service) {
    this.view = new View()
    this.Service = new Service()
  }

  static initialize(View, Service) {
    const controller = new Controller(View, Service)
    controller.onLoad()

    return controller
  }

  onLoad() {
    this.view.onLoad()
  }
  
}