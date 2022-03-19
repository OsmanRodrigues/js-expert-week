import { config } from '../../../server/config.js'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller.js'
import { Service } from '../../../server/service.js'
import { generateReadableStream } from '../../utils/testUtil.js'

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
})
