import { config, getPath } from '../../../server/config.js'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller.js'
import { Service } from '../../../server/service.js'
import { generateReadableStream } from '../../utils/testUtil.js'
import { config as testConfig } from '../../utils/config.js'
import { setTimeout } from 'timers/promises'

describe('#Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`getFileStream() ~ Should call service.getFileStream and return a promise 
  resolved with an object with stream and type`, async() => {
    const expectedFileName = config.page.controller
    const expectedFileExt = config.constant.fileExt.html
    const mockedFileStream = generateReadableStream(['data'])
    const mockedResolvedValue = {
      type: expectedFileExt,
      stream: mockedFileStream
    }

    jest.spyOn(
      Service.prototype,
      'getFileStream'
    ).mockResolvedValue(
      mockedResolvedValue
    )

    const controller = new Controller()
    const expectedFileStream = await controller.getFileStream(expectedFileName)

    expect(Service.prototype.getFileStream).toHaveBeenCalledWith(expectedFileName)
    expect(expectedFileStream).toStrictEqual(mockedResolvedValue)
  })
  
  test(`createClientStream() ~ Should call service.createClientStream, return a object with stream and 
  onClose, once onClose is called, call service.removeClientStream`, async () => {
    const mockStream = generateReadableStream(['data'])
    const mockId = 'id'

    jest.spyOn(
      Service.prototype,
      'createClientStream'
    ).mockReturnValue({
      id: mockId,
      clientStream: mockStream
    })
    jest.spyOn(
      Service.prototype,
      'removeClientStream'
    ).mockReturnValue()

    const controller = new Controller()
    const { stream, onClose } = controller.createClientStream()
    
    onClose()

    expect(stream).toStrictEqual(mockStream)
    expect(Service.prototype.createClientStream).toHaveBeenCalled()
    expect(Service.prototype.removeClientStream).toHaveBeenCalledWith(mockId)
  })

  describe('handleStreamingCommand()', () => {
    test(`~ Once receive command=start, should call service.startStreaming and 
    return result=started`, async () => {
      const { command } = testConfig
      jest.spyOn(
        Service.prototype,
        'startStreaming'
      )

      const controller = new Controller()
      const expectedResult = await controller.handleStreamingCommand(command.req.start)

      expect(Service.prototype.startStreaming).toHaveBeenCalled()
      expect(expectedResult).toStrictEqual(command.res.started)
    })

    test(`~ Once receive command=stop, should call service.stopStreaming and 
    return result=stopped`, async () => {
      const { command } = testConfig
      jest.spyOn(
        Service.prototype,
        'stopStreaming'
      )

      const controller = new Controller()
      const expectedResult = await controller.handleStreamingCommand(command.req.stop)

      expect(Service.prototype.stopStreaming).toHaveBeenCalled()
      expect(expectedResult).toStrictEqual(command.res.stopped)
    })

    test(`~ Once receive command=Applause, should call service.getFxFileByName, 
    service.appendFxStream and return result='Applause executed successfully'`, async () => {
      const { command } = testConfig
      const expectedCommand = 'Applause'
      const safeCommand = expectedCommand.toLowerCase()
      const expectedFxFilePath = getPath('/audio/fx/Applause Sound Effect HD No Copyright (128 kbps).mp3')
      const expectedReturnedResult = { result: `${safeCommand} executed successfully` }

      jest.spyOn(
        Service.prototype,
        'startStreaming'
      ).mockResolvedValue()
      jest.spyOn(
        Service.prototype,
        'getFxFileByName'
      ).mockResolvedValue(expectedFxFilePath)
      jest.spyOn(
        Service.prototype,
        'appendFxStream'
      ).mockReturnValue()
      jest.spyOn(
        Service.prototype,
        'stopStreaming'
      ).mockResolvedValue()

      const controller = new Controller()
      await controller.handleStreamingCommand(command.req.start)
      setTimeout(testConfig.retentionDataPeriod)
      const expectedResult = await controller.handleStreamingCommand({ command: safeCommand })
      setTimeout(testConfig.retentionDataPeriod)
      await controller.handleStreamingCommand(command.req.stop)

      expect(Service.prototype.getFxFileByName).toHaveBeenCalledWith(safeCommand)
      expect(Service.prototype.appendFxStream).toHaveBeenCalledWith(expectedFxFilePath)
      expect(expectedResult).toStrictEqual(expectedReturnedResult)
    })

    test(`~ Once receive command=unknow, should return result=Command "unknow" not found`, async () => { 
      const expectedCommand = 'unknow'
    
      const controller = new Controller()
      const expectedResult = await controller.handleStreamingCommand({ command: expectedCommand })

      expect(expectedResult).toStrictEqual({error: `Command "${expectedCommand}" not found`})
    })
  })
})
