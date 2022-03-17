import { config, getPath } from '../../../server/config'
import { testUtil } from '../utils/testUtil'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Controller } from '../../../server/controller'
import { Service } from '../../../server/service'

describe('#Controller', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`getFileStream() ~ Should call service.getFileStream and return a promise 
  resolved with an object with stream and type`, async() => {
    const expectedFileName = config.page.controller
    const expectedFileExt = config.constant.fileExt.html
    const mockedFileStream = testUtil.generateReadableStream(['data'])
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
