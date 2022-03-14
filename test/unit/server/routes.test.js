import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config'
import { Controller } from '../../../server/controller'
import { handler } from '../../../server/routes'
import testUtil from '../utils/testUtil'

describe('#Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test('GET / ~ Should redirect to home page', async () => {
    const params = testUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/'

    await handler(...params.values())

    expect(params.response.writeHead).toBeCalledWith(
      302,
      {
        'Location': config.location.home
      }
    )
    expect(params.response.end).toBeCalled()
  })

  test(`GET /home ~ Should respond with ${config.page.home} file stream`, async () => {
    const params = testUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/home'
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

    expect(Controller.prototype.getFileStream).toBeCalledWith(config.page.home)
    expect(spyFileStream).toHaveBeenCalledWith(params.response)
  });

  test(`GET /controller ~ Should respond with ${config.page.controller} file stream`,   async () => {
    const params = testUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = '/controller'
    const mockFileStream = testUtil.generateReadableStream(['data'])
    
    jest.spyOn(
      Controller.prototype,
      'getFileStream'
    ).mockResolvedValue({
      stream: mockFileStream
    })
    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue()
  
    await handler(...params.values())

    expect(Controller.prototype.getFileStream).toBeCalledWith(config.page.controller)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  })
   
  test('GET /file.ext ~ Should respond with file stream',  async () => {
    const expectedType = '.html'
    const params = testUtil.defaultHandleParams()
    params.request.method = 'GET'
    params.request.url = `/index${expectedType}`
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
        'Content-Type': config.constant.contentType[expectedType]
      }
    )
  })

  test.todo('GET /unknow ~ Should respond with 404')

  describe('Excepetions', () => {
    test.todo('Given inexistent file it should respond with 404')
    test.todo('Given an error it should respond with 500')
  })
})