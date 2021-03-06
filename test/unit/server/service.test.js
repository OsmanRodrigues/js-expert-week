import { config, getPath } from '../../../server/config.js'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Service } from '../../../server/service.js'
import fs, { promises as fsPromises } from 'fs'
import { promises as streamPromises, Writable, PassThrough } from 'stream'
import { generateReadableStream, generateWritableStream, getSpawnResponse } from '../../utils/testUtil.js'
import Throttle from 'throttle'
import childProcess from 'child_process'
import { logger } from '../../../server/utils.js'

const { page, constant } = config

describe('#Service', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`_executeSoxCommand() ~ Should return a child process object`, () => {
    const service = new Service()
    const argsMock = ['doit']
    const command = 'sox'
    const childProcessMock = getSpawnResponse({
      stdout: 'stdout'
    })

    jest.spyOn(
      childProcess,
      'spawn'
    ).mockReturnValue(
      childProcessMock
    )
    
    const executeSoxCommandResult = service._executeSoxCommand(argsMock)
    
    expect(childProcess.spawn).toHaveBeenCalledWith(command, argsMock)
    expect(executeSoxCommandResult).toStrictEqual(childProcessMock)
  })

  test(`appendFxStream() ~ Should call streamPromises.pipeline, service.mergeAudioStreams, 
  currentReadable.removeListener, throttleTransform.on, throttleTransform.pause and currentReadable.unpipe`, async () => {
    const currentFx = 'fx.mp3'
    const service = new Service()
    service.throttleTransform = new PassThrough()
    service.currentReadable = generateReadableStream(['data'])
    
    const transformableStreamMock = new PassThrough()
    const writableBroadcasterResult = generateWritableStream(()=>{})
    const expectedFirstCallResult = 'ok1'
    const expectedSecondCallResult = 'ok2'
   
    jest.spyOn(
      streamPromises,
      'pipeline'
    )
    .mockResolvedValueOnce(expectedFirstCallResult)
    .mockResolvedValueOnce(expectedSecondCallResult)
    jest.spyOn(
      service,
      'broadCast'
    ).mockReturnValue(writableBroadcasterResult)
    jest.spyOn(
      service,
      'mergeAudioStreams'
    ).mockReturnValue(transformableStreamMock)
    jest.spyOn(
      transformableStreamMock,
      'removeListener'
    ).mockReturnValue()
    jest.spyOn(
      service.throttleTransform,
      'pause'
    ).mockReturnValue()
    jest.spyOn(
      service.currentReadable,
      'unpipe'
    ).mockReturnValue()
    
    service.appendFxStream(currentFx)
    
    expect(service.throttleTransform.pause).toHaveBeenCalled()
    expect(service.currentReadable.unpipe).toHaveBeenCalledWith(service.throttleTransform)
    
    service.throttleTransform.emit('unpipe')
    
    const [call1, call2] = streamPromises.pipeline.mock.calls
    const [resultCall1, resultCall2] = streamPromises.pipeline.mock.results
    const [throttleTransformCall1, broadCastCall1] = call1 
    
    expect(throttleTransformCall1).toBeInstanceOf(Throttle)
    expect(broadCastCall1).toStrictEqual(writableBroadcasterResult)
    
    const [result1, result2] = await Promise.all([resultCall1.value, resultCall2.value])
    
    expect(result1).toStrictEqual(expectedFirstCallResult)
    expect(result2).toStrictEqual(expectedSecondCallResult)
    
    const [mergedStreamCall2, throttleTransformCall2] = call2

    expect(mergedStreamCall2).toStrictEqual(transformableStreamMock)
    expect(throttleTransformCall2).toBeInstanceOf(Throttle)
    expect(service.currentReadable.removeListener).toHaveBeenCalled()
  })

  test(`broadCast() ~ Should interate over service.clientStreams, call stream.write, clientStreams.delete, 
  cb and return a writable`, () => {
    const service = new Service()
    const onDataMock = jest.fn()
    const clientStream1 = generateWritableStream(onDataMock)
    const clientStream2 = generateWritableStream(onDataMock)

    jest.spyOn(
      service.clientStreams,
      'delete'
    ).mockReturnValue()
    
    service.clientStreams.set('1', clientStream1)
    service.clientStreams.set('2', clientStream2)
    clientStream2.end()
    
    const writableResult = service.broadCast()
    writableResult.write('test')

    expect(writableResult).toBeInstanceOf(Writable)
    expect(service.clientStreams.delete).toHaveBeenCalled()
    expect(onDataMock).toHaveBeenCalledTimes(1)
  })

  test(`createClientStream() ~ Should return an object with id and clientStream`, () => {
    const service = new Service()

    jest.spyOn(
      service.clientStreams,
      'set'
    ).mockReturnValue()
    
    const { id, clientStream } = service.createClientStream()
    
    expect(id.length).toBeGreaterThan(0)
    expect(clientStream).toBeInstanceOf(PassThrough)
    expect(service.clientStreams.set).toHaveBeenCalledWith(id, clientStream)
  })

  test('createFileStream() ~ Should call fs.CreateStream and return a readable stream', () => {
    const expectedFilePath = getPath(page.home)
    const mockFileStream = generateReadableStream(['data'])
    
    jest.spyOn(
      fs,
      'createReadStream'
    ).mockResolvedValue(
      mockFileStream
    )
    
    const service = new Service()
    const expectedFileStream = service.createFileStream(expectedFilePath)

    expect(fs.createReadStream).toBeCalledWith(expectedFilePath)
    expect(expectedFileStream).resolves.toStrictEqual(mockFileStream)
  })

  test('getFxFileByName() ~ Should call fsPromises.readdir, find a current fx and return the file path', async () => {
    const service = new Service()
    const currentFx = 'fx.mp3'
    const fxFilesPathsMock = [`path/${currentFx}`]
    const expectedFxFilePath = `${config.dir.fx}/${fxFilesPathsMock[0]}`
    jest.spyOn(
      fsPromises,
      'readdir'
    ).mockResolvedValue(fxFilesPathsMock)
    
    const expectedFxFilePathResult = await service.getFxFileByName(currentFx)
    
    expect(fsPromises.readdir).toHaveBeenCalledWith(config.dir.fx)
    expect(expectedFxFilePathResult).toStrictEqual(expectedFxFilePath)
  })

  test(`getBitRate() ~ Should call service._executeSoxCommand and return a bit rate in string`, async () => {
    const service = new Service()
    const currentFile = 'file.mp3'
    const expectedArgs = [
      '--i',
      '-B',
      currentFile
    ]
    const stdoutMock = '1k'
    const expectedBitRate = '1000'
    const childProcessMock = getSpawnResponse({
      stdout: stdoutMock,
    })

    jest.spyOn(
      service,
      '_executeSoxCommand'
    ).mockReturnValue(childProcessMock)
    
    const getBitRateResult = await service.getBitRate(currentFile)

    expect(getBitRateResult).toStrictEqual(expectedBitRate)
    expect(service._executeSoxCommand).toHaveBeenCalledWith(expectedArgs)
  })

  test(`getBitRate() ~ Once an error occours, should return the fallback bit rate`, async () => {
    const service = new Service()
    const currentFile = 'file.mp3'
    const expectedArgs = [
      '--i',
      '-B',
      currentFile
    ]
    const childProcessMock = getSpawnResponse({
      stderr: 'stderr',
    })

    jest.spyOn(
      service,
      '_executeSoxCommand'
    ).mockReturnValue(childProcessMock)
    
    const getBitRateResult = await service.getBitRate(currentFile)

    expect(getBitRateResult).toStrictEqual(constant.audio.fallbackBitRate)
    expect(service._executeSoxCommand).toHaveBeenCalledWith(expectedArgs)
  })

  test(`getFileInfo() ~ Should call fsPromises.access and return an object with type and path`,
    async () => {
    const expectedFileName = page.controller
    const expectedFilePath = getPath(`public/${page.controller}`)
    const expectedFileExt = constant.fileExt.html

    jest.spyOn(
      fsPromises,
      'access'
    ).mockResolvedValue()

    const service = new Service()
    const expectedFileInfo = await service.getFileInfo(expectedFileName)

    expect(fsPromises.access).toHaveBeenCalledWith(expectedFilePath)
    expect(expectedFileInfo).toStrictEqual({ type: expectedFileExt, path: expectedFilePath })
  })

  test('getFileStream() ~ Should call getFileInfo and createFileStream, returning an object with stream and type',
    async () => {
    const expectedFileName = page.home
    const expectedFilePath = getPath(`public/${page.home}`)
    const expectedFileExt = constant.fileExt.html;
    const mockFileStream = generateReadableStream(['data'])

    jest.spyOn(
      Service.prototype,
      'getFileInfo'
    ).mockResolvedValue({
      path: expectedFilePath,
      type: expectedFileExt
    })

    jest.spyOn(
      Service.prototype,
      'createFileStream'
    ).mockReturnValue(
      mockFileStream
    )

    const service = new Service()
    const expectedFileStream = await service.getFileStream(expectedFileName)
    
    expect(Service.prototype.getFileInfo).toHaveBeenCalledWith(expectedFileName)
    expect(Service.prototype.createFileStream).toHaveBeenCalledWith(expectedFilePath)
    expect(expectedFileStream).toStrictEqual({ stream: mockFileStream, type: expectedFileExt })
  })

  test(`mergeAudioStreams() ~ Should call service._executeSoxCommand, streamPromises.pipeline and 
  return a transformStream PassThrough instance`, async () => {
    const service = new Service()
    const fxFileMock = '/foo/test.mp3'
    const currentAudioReadableMock = generateReadableStream(['data'])
    const argsMock = [
      '-t', constant.audio.mediaType,
      '-v', constant.audio.songVolume,
      '-m', '-',
      '-t', constant.audio.mediaType,
      '-v', constant.audio.fxVolume,
      fxFileMock,
      '-t', constant.audio.mediaType,
      '-'
    ]
    const childProcessMock = getSpawnResponse({
      stdout: 'stdout',
      stdin: 'stdin'
    })

    jest.spyOn(
      service,
      '_executeSoxCommand'
    ).mockReturnValue(childProcessMock)
    jest.spyOn(
      streamPromises,
      'pipeline'
    )
    .mockResolvedValueOnce()
    .mockResolvedValueOnce()
    
    const mergeAudioResult = service.mergeAudioStreams(fxFileMock, currentAudioReadableMock)

    expect(service._executeSoxCommand).toHaveBeenCalledWith(argsMock)
    expect(mergeAudioResult).toBeInstanceOf(PassThrough)
  })

  test(`removeClientStream() ~ Should return an object with id and clientStream`, () => {
    const service = new Service()

    jest.spyOn(
      service.clientStreams,
      'delete'
    ).mockReturnValue()
      
    const { id } = service.createClientStream()
    service.removeClientStream(id)
    
    expect(service.clientStreams.delete).toHaveBeenCalledWith(id)
  })

  test(`startStreaming() ~ Should call service.getBitRate, service.createFileStream, 
  streamPromises.pipeline, service.broadCast and return a readable`, async () => {
    const service = new Service()
    const getBitRateResultMock = '1000'
    const readableStreamMock = generateReadableStream(['data'])
    const writableStreamMock = generateWritableStream(()=>{})
    const expectedStartedStream = generateReadableStream(['data'])
    
    jest.spyOn(
      service,
      'getBitRate'
    ).mockResolvedValue(getBitRateResultMock)
    jest.spyOn(
      service,
      'createFileStream'
    ).mockReturnValue(readableStreamMock)
    jest.spyOn(
      streamPromises,
      'pipeline'
    ).mockReturnValue(expectedStartedStream)
    jest.spyOn(
      service,
      'broadCast'
    ).mockReturnValue(writableStreamMock)
    
    const startedStreamResult = await service.startStreaming()

    expect(startedStreamResult).toStrictEqual(expectedStartedStream)
  })

  test('stopStreaming() ~ Should call service.throttleTransform.end', async() => {
    const service = new Service()
    const bpsMock = 1
    service.throttleTransform = new Throttle(bpsMock)

    jest.spyOn(
      service.throttleTransform,
      'end'
    ).mockReturnValue()

    service.stopStreaming()

    expect(service.throttleTransform.end).toHaveBeenCalled()
  })

  test('stopStreaming() ~ If not started streaming, should log not started info', async() => {
    const service = new Service()
    
    jest.spyOn(
      logger,
      'info'
    ).mockReturnValue()
      
    service.stopStreaming()
    expect(logger.info).toHaveBeenCalledWith(constant.log.service.stopStreaming.info.notStarted)
  })

  test('stopStreaming() ~ If already stopped streaming, should log already stopped info', async() => {
    const service = new Service()
    const bpsMock = 1
    service.throttleTransform = new Throttle(bpsMock)

    jest.spyOn(
      logger,
      'info'
    ).mockReturnValue()
    
    service.throttleTransform.end()
    service.stopStreaming()
    
    expect(logger.info).toHaveBeenCalledWith(constant.log.service.stopStreaming.info.alreadyStopped)
  })

  test(`getFxFileByName() ~ Once received a unknow.mp3 file, should return a not found error`, async () => {
    const service = new Service()
    const currentFx = 'unknow.mp3'
    const expectedNotFoundErrorMsg = `Fx file "${currentFx}" not found.`
    const fxFilesPathsMock = [`path/foo.mp3`]
    
    jest.spyOn(
      fsPromises,
      'readdir'
    ).mockResolvedValue(fxFilesPathsMock)
    jest.spyOn(
      Promise,
      'reject'
    ).mockResolvedValue(expectedNotFoundErrorMsg)

    const expectedFxFilePathResult = await service.getFxFileByName(currentFx)
    
    expect(Promise.reject).toHaveBeenCalledWith(expectedNotFoundErrorMsg)
    expect(expectedFxFilePathResult).toStrictEqual(expectedNotFoundErrorMsg)
  })
})