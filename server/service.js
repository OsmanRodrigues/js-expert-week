import { randomUUID } from 'crypto'
import fs, {promises as fsPromises} from 'fs'
import { extname } from 'path'
import { PassThrough } from 'stream'
import { getPath } from './config.js'

export class Service {

  constructor() {
    this.clientStreams = new Map() 
  }

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
  }

  createFileStream(filePath ) {
    return fs.createReadStream(filePath)
  } 
  
  async getFileInfo(fileName){
    const publicFilePath = getPath(`public/${fileName}`)
    await fsPromises.access(publicFilePath)
  
    return {
      type: extname(publicFilePath),
      path:  publicFilePath
    }
  }
  
  async getFileStream(fileName){
    const { path, type } = await this.getFileInfo(fileName)
    
    return {
      stream: this.createFileStream(path),
      type
    }
  }

}
