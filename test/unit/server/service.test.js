import { config, getPath } from '../../../server/config';
import { testUtil } from '../utils/testUtil';
import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import { Service } from '../../../server/service';
import fs, { promises as fsPromises } from 'fs';

const { page, constant } = config

describe('#Service', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test('createFileStream', () => {
    const expectedFilePath = getPath(page.home)
    const mockFileStream = testUtil.generateReadableStream(['data'])
    
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
  test('getFileInfo', async () => {
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
  test('getFileStream', async () => {
    const expectedFileName = page.home
    const expectedFilePath = getPath(`public/${page.home}`)
    const expectedFileExt = constant.fileExt.html;
    const mockFileStream = testUtil.generateReadableStream(['data'])

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
})