import service from "./service.js"


const getFileStream = async (fileName = '') => service.getFileStream(fileName)
  .catch(err => { throw new Error(err) }) 


export default {
  getFileStream,
}