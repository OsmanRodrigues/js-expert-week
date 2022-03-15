import fs, {promises as fsPromises} from 'fs'
import { extname } from 'path';
import { getPath } from './config.js';

export class Service {

  createFileStream(filePath = '') {
    return fs.createReadStream(filePath)
  } 
  
  async getFileInfo(fileName = ''){
    const publicFilePath = getPath(`public/${fileName}`)
    await fsPromises.access(publicFilePath)
  
    return {
      type: extname(publicFilePath),
      path:  publicFilePath
    }
  }
  
  async getFileStream(fileName = ''){
    const { path, type } = await this.getFileInfo(fileName)
    
    return {
      stream: this.createFileStream(path),
      type
    }
  }

}
