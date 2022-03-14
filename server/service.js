import fs, {promises as fsPromises} from 'fs'
import { extname } from 'path';
import { getPath } from './config.js';

const createFileStream = (filePath = '') => fs.createReadStream(filePath)

const getFileInfo = async (fileName = '') => {
  const publicFilePath = getPath(`public/${fileName}`)
  await fsPromises.access(publicFilePath)

  return {
    type: extname(publicFilePath),
    path:  publicFilePath
  }
}

const getFileStream = async (fileName = '') => {
  const { path, type } = await getFileInfo(fileName)
  
  return {
    stream: createFileStream(path),
    type
  }
}

export default {
  createFileStream,
  getFileInfo,
  getFileStream
}