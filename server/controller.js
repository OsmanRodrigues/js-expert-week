import { Service } from './service.js'
import { logger } from './utils.js'

export class Controller {
  
  constructor() {
    this.service = new Service()
  }

  async getFileStream(fileName){
    return this.service.getFileStream(fileName)
  }
  
  createClientStream() {
    const { 
      id,
      clientStream
    } = this.service.createClientStream()

    const onClose = () => {
      logger.info(`Closing connection stream of ${id}`)
      this.service.removeClientStream(id)
    }

    return {
      stream: clientStream,
      onClose
    }
  }
  
}