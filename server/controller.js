import { service } from "./service.js"

export class Controller {
  async getFileStream(fileName = '') {
    return service.getFileStream(fileName)
  } 
}