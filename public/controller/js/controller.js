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

  async callReceivedCommand(command) {
    console.log('controller', command)
  }

  onLoad() {
    this.view.configureOnBtnClick(this.callReceivedCommand.bind(this))
    this.view.onLoad()
  }

}