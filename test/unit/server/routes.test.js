import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import config from '../../../server/config'

describe('#Routes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })
  test.todo('GET / ~ Should redirect to home page')
  test.todo(`GET /home ~ Should respond with ${config.pages.home} file stream`)
  test.todo(`GET /controller ~ Should respond with ${config.pages.controller} file stream`)
  test.todo('GET /file.ext ~ Should respond with file stream')
  test.todo('GET /unknow ~ Should respond with 404')

  describe('Excepetions', () => {
    test.todo('Given inexistent file it should respond with 404')
    test.todo('Given an error it should respond with 500')
  })
})