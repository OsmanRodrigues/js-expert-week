import { Service } from './service.js'
import { logger } from './utils.js'

export class Controller {
  
  constructor() {
    this.service = new Service()
  }

  async getFileStream(fileName){
    return this.service.getFileStream(fileName)
  }

  async handleStreamingCommand({ command }) {
    logger.info(`Command received: ${command}`)
    const safeCommand = command.toLowerCase()

    switch (true) {
      case safeCommand.includes('start'):
        this.service.startStreaming()
        return { result: 'started' }
      
      case safeCommand.includes('stop'):
        this.service.stopStreaming()
        return { result: 'stopped' }
      
      case !!await this.service.getFxFileByName(safeCommand):
        const fxFilePath = await this.service.getFxFileByName(safeCommand)
        logger.info(`Choosen fx: ${fxFilePath}`)
        this.service.appendFxStream(fxFilePath)

        return { result: `${safeCommand} executed successfully` }
      
      default:
        return { error: `Command "${safeCommand}" not found` }
        
    }

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