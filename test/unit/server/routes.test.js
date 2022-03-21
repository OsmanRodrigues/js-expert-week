import { config } from '../../../server/config.js'
import { generateDefaultHandleParams, generateReadableStream } from '../../utils/testUtil.js'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller.js'
import { handler } from '../../../server/routes.js'
import { config as testConfig } from '../../utils/config.js'
import Events from 'events'

const { method, location, page, constant, statusCode } = config

describe('#Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  describe('GET', () => {
    test(`"/" ~ Should redirect to home page`, async () => {
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = location.main

      await handler(...params.values())

      expect(params.response.writeHead).toBeCalledWith(
        statusCode['FOUND'],
        {
          'Location': location.home
        }
      )
      expect(params.response.end).toBeCalled()
    })

    test(`"/home" ~ Should respond with /home/index.html file stream`, async () => {
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = location.home
      const mockFileStream = generateReadableStream(['data'])
      
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockResolvedValue({
        stream: mockFileStream
      })
      const spyFileStream = jest.spyOn(
        mockFileStream,
        'pipe'
      ).mockReturnValue()
    
      await handler(...params.values())

      expect(Controller.prototype.getFileStream).toBeCalledWith(page.home)
      expect(spyFileStream).toHaveBeenCalledWith(params.response)
    })

    test(`"/controller" ~ Should respond with /controller/index.html file stream`, async () => {
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = location.controller
      const mockFileStream = generateReadableStream(['data'])

      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockResolvedValue({
        stream: mockFileStream,
      })
      jest.spyOn(
        mockFileStream,
        'pipe'
      ).mockReturnValue()

      await handler(...params.values())

      expect(Controller.prototype.getFileStream).toBeCalledWith(page.controller)
      expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
    })
    
    test(`"/stream" ~ Should respond with /audio/songs/conversation.mp3 file stream`, async () => {
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = location.stream
      const mockFileStream = generateReadableStream(['data'])
      const mockOnClose = jest.fn()
      
      jest.spyOn(
        mockFileStream,
        'pipe'
      ).mockReturnValue()

      jest.spyOn(
        Controller.prototype,
        'createClientStream'
      ).mockReturnValue({
        stream: mockFileStream,
        onClose: mockOnClose
      })

      await handler(...params.values())
      params.request.emit('close')

      expect(params.response.writeHead).toHaveBeenCalledWith(statusCode['OK'],{
        'Content-Type': constant.contentType['.mpeg'],
        'Accept-Ranges': constant.acceptRanges.bytes
      })
      expect(Controller.prototype.createClientStream).toHaveBeenCalled()
      expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
      expect(mockOnClose).toHaveBeenCalled()
    })
    
    test(`"/file.ext" ~ Should respond with file stream`,  async () => {
      const expectedType = '.css'
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = `/home/css/styles${expectedType}`
      const mockFileStream = generateReadableStream(['data'])
      
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockResolvedValue({
        stream: mockFileStream,
        type: expectedType
      })
      jest.spyOn(
        mockFileStream,
        'pipe'
      ).mockReturnValue()
    
      await handler(...params.values())

      expect(Controller.prototype.getFileStream).toBeCalledWith(params.request.url)
      expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
      expect(params.response.writeHead).toHaveBeenCalledWith(
        200,
        {
          'Content-Type': constant.contentType[expectedType]
        }
      )
    })

    test(`"/unknow" ~ Should respond with 404`,  async () => {
      const params = generateDefaultHandleParams()
      const expectedStatusCode = statusCode['NOT_FOUND']
      params.request.method = method.get
      params.request.url = `/unknow`
      
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
      expect(params.response.end).toHaveBeenCalledWith(
        constant.fallback.route.statusCode[expectedStatusCode]
      )
    })
  })

  describe('POST', () => {
    test(`"/controller ~ Once requested command=start, should start client stream and respond with result=started`, async () => {
      const { command } = testConfig
      const params = generateDefaultHandleParams()
      const expectedData = JSON.stringify(command.req.start)
      const expectedResult = JSON.stringify(command.res.started)

      params.request.method = method.post
      params.request.url = location.controller
      params.request.push(expectedData)

      jest.spyOn(
        Controller.prototype,
        'handleStreamingCommand'
      ).mockResolvedValue(command.res.started)

      await handler(...params.values())

      expect(Controller.prototype.handleStreamingCommand).toHaveBeenCalledWith(command.req.start)
      expect(params.response.end).toHaveBeenCalledWith(expectedResult)
    })

    test(`"/controller ~ Once requested command=unknow, should respond with error=Command unknow not found`, async () => {
      const params = generateDefaultHandleParams()
      const expectedCommand = 'unknow'
      const expectedData = JSON.stringify({ command: expectedCommand })
      const expectedResult = { error: `Command "${expectedCommand}" not found` }

      params.request.method = method.post
      params.request.url = location.controller
      params.request.push(expectedData)

      jest.spyOn(
        Controller.prototype,
        'handleStreamingCommand'
      ).mockResolvedValue(expectedResult)

      await handler(...params.values())

      expect(params.response.end).toHaveBeenCalledWith(JSON.stringify(expectedResult))
    })

    test(`"/unknow" ~ Should respond with 404`,  async () => {
      const params = generateDefaultHandleParams()
      const expectedStatusCode = statusCode['NOT_FOUND']
      params.request.method = method.post
      params.request.url = `/unknow`
      
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
      expect(params.response.end).toHaveBeenCalledWith(
        constant.fallback.route.statusCode[expectedStatusCode]
      )
    })
  })

  describe('Exceptions', () => {
    test(`DELETE /unknow ~ Should respond with 405 method not allowed`,  async () => {
      const params = generateDefaultHandleParams()
      const requestedMethod = 'DELETE'
      const expectedStatusCode = statusCode['METHOD_NOT_ALLOWED']
      const expectedFallback = constant.fallback.route.statusCode[expectedStatusCode]
      params.request.method = requestedMethod
      params.request.url = `/unknow`
      
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
      expect(params.response.end).toHaveBeenCalledWith(expectedFallback)
    })
    
    test('Given inexistent file it should respond with 404', async () => {
      const params = generateDefaultHandleParams()
      params.request.method = method.get
      params.request.url = `/home/assets/photo.png`
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValue(new Error('Error ENOENT: no such file or directory.'))
        
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(statusCode['NOT_FOUND'])
      expect(params.response.end).toHaveBeenCalled()
    })

    test('Given an error it should respond with 500', async () => {
      const params = generateDefaultHandleParams()
      const expectedStatusCode = statusCode['INTERNAL_SERVER_ERROR']
      const expectedFallback = constant.fallback.route.statusCode[expectedStatusCode]
      params.request.method = method.get
      params.request.url = `/home/assets/photo.png`
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValue(new Error('Error: '))
        
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
      expect(params.response.end).toHaveBeenCalledWith(expectedFallback)
    })
  })
})