import service from "./service.js"

const run = () => ({
  getFileStream: async (fileName = '') => service.getFileStream(fileName)
    .catch(err => { throw new Error(err) }) 
})

export default {
  run
}