import service from "./service.js"

const run = () => ({
  getFileStream: async (fileName='')=> service.getFileStream(fileName) 
})

export default {
  run
}