import fs from 'fs'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { config, getPath } from '../../../server/config.js'
import { server as apiServer } from '../../../server/server.js'
import { mutationSender, getTestServer, pipeAndReadStreamData } from '../../utils/testUtil.js'

const { location, constant, page, statusCode } = config

describe('#API e2e', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Client workflow', () => {
    test('It should not receive data stream if the proccess is not playing', async () => {  
      const server = await getTestServer(apiServer)
      const onChunk = jest.fn()
      pipeAndReadStreamData(
        server.testServer.get(location.stream),
        onChunk
      )
      
      await setTimeout(constant.util.test.retentionDataPeriod)
      server.kill()

      expect(onChunk).not.toHaveBeenCalled()

    })
    
    test('It should receive data stream if the proccess has playing', async () => {
      const server = await getTestServer(apiServer)
      const onChunk = jest.fn()
      const {
        send
      } = mutationSender(server.testServer)
      pipeAndReadStreamData(
        server.testServer.get(location.stream),
        onChunk
      )
      const { command } = constant.util.test.e2e

      await send(command.req.start, command.res.started)
      await setTimeout(constant.util.test.retentionDataPeriod)
      await send(command.req.stop, command.res.stopped)
      
      const [[
        buffer
      ]] = onChunk.mock.calls
      
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      server.kill()
    })

    test('GET /home ~ It should receive text/html file and status code 200', async () => {
      const server = await getTestServer(apiServer)
      const expectedPageFile = fs.readFileSync(getPath(`/public${page.home}`)).toString()
      const result = await server.testServer.get(location.home)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.html'])

      server.kill()
    })

    test('GET /controller ~ It should receive text/html file and status code 200', async () => {
      const server = await getTestServer(apiServer)
      const expectedPageFile = fs.readFileSync(getPath(`/public${page.controller}`)).toString()
      const result = await server.testServer.get(location.controller)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.html'])

      server.kill()
    })

    test(`GET /home/js/animation.js ~ It should receive application/javascript file 
    and status code 200`, async () => {
      const server = await getTestServer(apiServer)
      const endpoint = '/home/js/animation.js'
      const expectedPageFile = fs.readFileSync(getPath(`/public${endpoint}`)).toString()
      const result = await server.testServer.get(endpoint)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.js'])

      server.kill()
    })

    test(`GET /controller/css/style.css ~ It should receive text/css file 
    and status code 200`, async () => {
      const server = await getTestServer(apiServer)
      const endpoint = '/controller/css/style.css'
      const expectedPageFile = fs.readFileSync(getPath(`/public${endpoint}`)).toString()
      const result = await server.testServer.get(endpoint)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.css'])

      server.kill()
    })

    describe('Exceptions', () => {
      test(`When access a main "/" route, should receive location "/home" and status 304`, async () => {
        const server = await getTestServer(apiServer)
        const mainRoute = location.main
        const result = await server.testServer.get(mainRoute)

        expect(result.header.location).toStrictEqual(location.home)
        expect(result.statusCode).toStrictEqual(statusCode['FOUND'])

        server.kill()
      })

      test(`When access a inexistent route, should receive not found error and status code 404`, async () => {
        const server = await getTestServer(apiServer)
        const inexistentRoute = '/foo'
        const result = await server.testServer.get(inexistentRoute)
        const expectedStatusCode = statusCode['NOT_FOUND']
        const expectedFallback = constant.fallback.route.statusCode[expectedStatusCode]
        
        expect(result.statusCode).toStrictEqual(expectedStatusCode)
        expect(result.text).toStrictEqual(expectedFallback)

        server.kill()
      })

      test(`When access a inexistent file, should receive not found error and status code 404`, async () => {
        const server = await getTestServer(apiServer)
        const inexistentFilePath = '/home/assets/photo.png'
        const result = await server.testServer.get(inexistentFilePath)
        const expectedStatusCode = statusCode['NOT_FOUND']
        const expectedFallback = constant.fallback.route.statusCode[expectedStatusCode].toLowerCase()
        
        expect(result.statusCode).toStrictEqual(expectedStatusCode)
        expect(result.text).toContain(expectedFallback)

        server.kill()
      })
    })
  })
})