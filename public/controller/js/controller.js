export class Controller {
  
  constructor(View, Service) {
    this.view = new View()
    this.service = new Service({ url: `${window.location.origin}/controller` })
  }

  static initialize(View, Service) {
    const controller = new Controller(View, Service)
    controller.onLoad()

    return controller
  }

  async callReceivedCommand(command) {
    return this.service
      .request()
      .post({ command })
  }

  onLoad() {
    this.view.configureOnBtnClick(this.callReceivedCommand.bind(this))
    this.view.onLoad()
  }

}