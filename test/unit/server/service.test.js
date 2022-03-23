import { config, getPath } from '../../../server/config.js'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Service } from '../../../server/service.js'
import fs, { promises as fsPromises } from 'fs'
import { promises as streamPromises, Writable } from 'stream'
import { generateReadableStream, generateWritableStream } from '../../utils/testUtil.js'
import { PassThrough } from 'stream'
import Throttle from 'throttle'

const { page, constant } = config

describe('#Service', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
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
  
  test(`appendFxStream() ~ Should call streamPromises.pipeline, this.mergeAudioStreams, 
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

  test(`broadCast() ~ Should interate over this.clientStreams, call stream.write, clientStreams.delete, 
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

  test.todo('mergeAudioStreams() ~ ')
  test.todo('startStreaming() ~ ')
  test.todo('stopStreaming() ~ ')
})