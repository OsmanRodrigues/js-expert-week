import fs from 'fs'
import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { config, getPath } from '../../../server/config.js'
import { server as apiServer } from '../../../server/server.js'
import { mutationSender, getTestServer, pipeAndReadStreamData, generateReadableStream } from '../../utils/testUtil.js'

const { location, constant, page, statusCode } = config

describe('#API e2e', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  describe('Client workflow', () => {
    test('It should not receive a data stream if the proccess is not playing', async () => {  
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
    
    test('It should receive a data stream if the proccess has playing', async () => {
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

    test('GET /home ~ It should receive a text/html file and status code 200', async () => {
      const server = await getTestServer(apiServer)
      const expectedPageFile = fs.readFileSync(getPath(`/public${page.home}`)).toString()
      const result = await server.testServer.get(location.home)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.html'])

      server.kill()
    })

    test('GET /controller ~ It should receive a text/html file and status code 200', async () => {
      const server = await getTestServer(apiServer)
      const expectedPageFile = fs.readFileSync(getPath(`/public${page.controller}`)).toString()
      const result = await server.testServer.get(location.controller)
      
      expect(result.text).toStrictEqual(expectedPageFile)
      expect(result.statusCode).toStrictEqual(statusCode['OK'])
      expect(result.headers['content-type']).toStrictEqual(constant.contentType['.html'])

      server.kill()
    })

    test.todo('GET /home/js/animation.js ~ It should receive a application/javascript file and status code 200')
    test.todo('GET /controller/css/style.css ~ It should receive a text/css file and status code 200')
  })
})