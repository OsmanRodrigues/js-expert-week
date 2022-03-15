import config from '../../../server/config'
import testUtil from '../utils/testUtil'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'

const { method, location, page, constant } = config

describe('#Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`${method.get} ${location.main} ~ Should redirect to home page`, async () => {
    const params = testUtil.defaultHandleParams()
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
    const params = testUtil.defaultHandleParams()
    params.request.method = method.get
    params.request.url = location.home
    const mockFileStream = testUtil.generateReadableStream(['data'])
    
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
    const params = testUtil.defaultHandleParams()
    params.request.method = method.get
    params.request.url = location.controller
    const mockFileStream = testUtil.generateReadableStream(['data'])

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
    const params = testUtil.defaultHandleParams()
    params.request.method = method.get
    params.request.url = `/home/css/styles${expectedType}`
    const mockFileStream = testUtil.generateReadableStream(['data'])
    
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
    const params = testUtil.defaultHandleParams()
    params.request.method = method.get
    params.request.url = `/unknow`
    
    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404, 'Page not found.')
    expect(params.response.end).toHaveBeenCalled()
  })

  test(`${method.post} /unknow ~ Should respond with 404 Method not found`,  async () => {
    const params = testUtil.defaultHandleParams()
    params.request.method = method.post
    params.request.url = `/unknow`
    
    await handler(...params.values())

    expect(params.response.writeHead).toHaveBeenCalledWith(404, 'Method not found.')
    expect(params.response.end).toHaveBeenCalled()
  })

  describe('Excepetions', () => {
    test('Given inexistent file it should respond with 404', async () => {
      const params = testUtil.defaultHandleParams()
      params.request.method = method.get
      params.request.url = `/home/assets/photo.png`
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValue(new Error('Error ENOENT: no such file or directory.'))
        
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(404, 'Asset not found.')
      expect(params.response.end).toHaveBeenCalled()
    })

    test('Given an error it should respond with 500', async () => {
      const params = testUtil.defaultHandleParams()
      params.request.method = method.get
      params.request.url = `/home/assets/photo.png`
      jest.spyOn(
        Controller.prototype,
        'getFileStream'
      ).mockRejectedValue(new Error('Error: '))
        
      await handler(...params.values())

      expect(params.response.writeHead).toHaveBeenCalledWith(500, 'Internal error.')
      expect(params.response.end).toHaveBeenCalled()
    })
  })
})