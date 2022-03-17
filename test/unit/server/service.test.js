import { config, getPath } from '../../../server/config'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { Service } from '../../../server/service'
import fs, { promises as fsPromises } from 'fs'
import { generateReadableStream } from '../../utils/testUtil'

const { page, constant } = config

describe('#Service', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
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
})