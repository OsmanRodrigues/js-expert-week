import { config } from '../../../server/config'
import { defaultHandleParams, generateReadableStream } from '../../utils/testUtil'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'

const { method, location, page, constant, statusCode } = config

describe('#Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`${method.get} ${location.main} ~ Should redirect to home page`, async () => {
    const params = defaultHandleParams()
    params.request.method = method.get
    params.request.url = location.main

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      {
        'Location': location.home
      }
    )
    expect(params.response.end).toBeCalled()
  })

  test(`${method.get} ${location.home} ~ Should respond with ${page.home} file stream`, async () => {
    const params = defaultHandleParams()
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

  test(`${method.get} ${location.controller} ~ Should respond with ${page.controller} file stream`, async () => {
    const params = defaultHandleParams()
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
   
  test(`${method.get} /file.ext ~ Should respond with file stream`,  async () => {
    const expectedType = '.css'
    const params = defaultHandleParams()
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

  test(`${method.get} /unknow ~ Should respond with 404`,  async () => {
    const params = defaultHandleParams()
    const expectedStatusCode = statusCode['NOT_FOUND']
    params.request.method = method.get
    params.request.url = `/unknow`
    
    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
    expect(params.response.end).toHaveBeenCalledWith(
      constant.fallback.route.statusCode[expectedStatusCode]
    )
  })

  test(`${method.post} /unknow ~ Should respond with 404 Method not found`,  async () => {
    const params = defaultHandleParams()
    const expectedStatusCode = statusCode['METHOD_NOT_ALLOWED']
    const expectedFallback = constant.fallback.route.statusCode[expectedStatusCode]
    params.request.method = method.post
    params.request.url = `/unknow`
    
    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(expectedStatusCode)
    expect(params.response.end).toHaveBeenCalledWith(expectedFallback)
  })

  describe('Exceptions', () => {
    test('Given inexistent file it should respond with 404', async () => {
      const params = defaultHandleParams()
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
      const params = defaultHandleParams()
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