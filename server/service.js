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

  _executeSoxCommand(args) {
    return childProcess.spawn('sox', args)
  }

  appendFxStream(fxFile) {
    const currentThrottleTransform = new Throttle(this.currentBitRate)
    streamPromises.pipeline(
      currentThrottleTransform,
      this.broadCast()
    )
    const unpipe = () => {
      const transformableStream = this.mergeAudioStreams(fxFile, this.currentReadable)
      this.throttleTransform = currentThrottleTransform
      this.currentReadable = transformableStream
      this.currentReadable.removeListener('unpipe', unpipe)
      
      streamPromises.pipeline(
        transformableStream,
        currentThrottleTransform
      )
    }

    this.throttleTransform.on('unpipe', unpipe)
    this.throttleTransform.pause()
    this.currentReadable.unpipe(this.throttleTransform)
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

  createClientStream() {
    const id = randomUUID()
    const clientStream = new PassThrough()
    this.clientStreams.set(id, clientStream)

    return {
      id,
      clientStream
    }
  }

  createFileStream(filePath) {
    return fs.createReadStream(filePath)
  } 

  async getFxFileByName(fxName) {
    const fxFilesPaths = await fsPromises.readdir(config.dir.fx)
    const choosenFxFilePath = fxFilesPaths.find(filePath => filePath.toLowerCase().includes(fxName))

    if (!choosenFxFilePath) return Promise.reject(`Fx file "${fxName}" not found.`)
    
    return `${config.dir.fx}/${choosenFxFilePath}`
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

  mergeAudioStreams(fxFile, currentAudioReadable) {
    const transformStream = PassThrough()
    const args = [
      '-t', constant.audio.mediaType,
      '-v', constant.audio.songVolume,
      //1. "-m" = merge | 2. "-" = receive like stream 
      '-m', '-',
      '-t', constant.audio.mediaType,
      '-v', constant.audio.fxVolume,
      fxFile,
      '-t', constant.audio.mediaType,
      '-'
    ]

    const {
      stdin,
      stdout
    } = this._executeSoxCommand(args)

    // Plugin the current audio stream in cli input (stdin)
    streamPromises.pipeline(
      currentAudioReadable,
      stdin
    )
    //.catch(err => `Error on sending stream to sox: ${err}`)

    streamPromises.pipeline(
      stdout,
      transformStream
    )
    //.catch(err => `Error on receiving stream from sox: ${err}`)
    
    return transformStream
  }

  removeClientStream(id) {
    this.clientStreams.delete(id)
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
    const {log} = constant
    if (!this.throttleTransform?._writableState) {
      logger.info(log.service.stopStreaming.info.notStarted)
    }
    else if (!this.throttleTransform?._writableState.ended) {
      this.throttleTransform.end()
      logger.info(log.service.stopStreaming.info.success)
    } else {
      logger.info(log.service.stopStreaming.info.alreadyStopped)
    }
  }

}
