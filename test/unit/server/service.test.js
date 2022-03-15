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
    service.createFileStream(expectedFilePath)

    expect(fs.createReadStream).toBeCalledWith(expectedFilePath)
  })
  test.todo('getFileInfo')
  test.todo('getFileStream')
})