import { randomUUID } from 'crypto'
import fs, {promises as fsPromises} from 'fs'
import { extname } from 'path'
import { PassThrough, promises as streamPromises, Writable } from 'stream'
import { getPath, config } from './config.js'
import { logger } from './utils.js'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { once } from 'events'

const { constant } = config

export class Service {

  constructor() {
    this.clientStreams = new Map()
    this.throttleTransform = {}
    this.currentReadable = {}
    this.currentBitRate = 0
    this.currentStreamingFilePath = ''
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

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  async getBitRate(file) {
    try {
      const args = [
        '--i', //info
        '-B', //bitrate
        file
      ]
      const {
        stderr, //all cmd errors
        stdout, //all cmd logs
        //stdin //all cmd inputs
      } = this._executeSoxCommand(args)

      await Promise.all([
        once(stderr, 'readable'),
        once(stdout, 'readable'),
      ])

      const [success, err] = [stdout, stderr].map(stream => stream.read())

      if(!!err) return await Promise.reject(err)

      const convertedSucess = success
        .toString()
        .trim()
        .replace(/k/, '000')

      return convertedSucess

    } catch (err) {
      logger.error(`Get bitrate error: ${err}`)
      return constant.audio.fallbackBitRate
    }
  }

  broadCast() {
    return new Writable({
      write: (chunk, enc, cb) => {
        for (const [id, stream] of this.clientStreams) {
          if (!!stream.writableEnded) {
            this.clientStreams.delete(id)
            continue
          }

          stream.write(chunk)
        }

        cb()
      }
    })
  }

  async startStreaming() {
    this.currentStreamingFilePath = constant.audio.file.englishConversation.dir
    logger.info(`Starting streaming of ${this.currentStreamingFilePath}.`)
    this.currentBitRate = (await this.getBitRate(this.currentStreamingFilePath)) / constant.audio.bitRateDivisor
    this.throttleTransform = new Throttle(this.currentBitRate)
    this.currentReadable = this.createFileStream(this.currentStreamingFilePath)

    return streamPromises.pipeline(
      this.currentReadable,
      this.throttleTransform,
      this.broadCast()
    )
  }

  stopStreaming() {
    if (!this.throttleTransform?._writableState) {
      logger.info('Streaming not started yet.')
    }
    else if (!this.throttleTransform?._writableState.ended) {
      this.throttleTransform.end()
      logger.info('Streaming stopped succesfully.')
    } else {
      logger.info('Streaming already stopped.');
    }
  }

  createFileStream(filePath) {
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
