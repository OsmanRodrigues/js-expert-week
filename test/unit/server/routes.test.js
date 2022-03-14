import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config'
import controller from '../../../server/controller'
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
      controller,
      controller.getFileStream.name
    ).mockResolvedValue({
      stream: mockFileStream
    })
  
    jest.spyOn(
      mockFileStream,
      'pipe'
    ).mockReturnValue()
  
    await handler(...params.values())

    expect(controller.getFileStream).toBeCalledWith(config.page.home)
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.response)
  });

  test.todo(`GET /controller ~ Should respond with ${config.page.controller} file stream`)
  test.todo('GET /file.ext ~ Should respond with file stream')
  test.todo('GET /unknow ~ Should respond with 404')

  describe('Excepetions', () => {
    test.todo('Given inexistent file it should respond with 404')
    test.todo('Given an error it should respond with 500')
  })
})