import { jest, expect, describe, test, beforeEach } from '@jest/globals';
import portfinder from 'portfinder'
import supertest from 'supertest'
import { Transform } from 'stream'
import { setTimeout } from 'timers/promises'
import { config } from '../../../server/config.js';
import { server as apiServer, server } from '../../../server/server.js'

const { method, location, page, constant } = config

describe('#API e2e', () => {
  beforeEach(() => {
    
  })
  function pipeAndReadStreamData(stream, onChunk) {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk)
        cb(null,chunk)
      }
    })   

    return stream.pipe(transform)
  }

  async function getTestServer() {
    const getSuperTest = port => supertest(`http://localhost:${port}`)
    const port = await portfinder.getPortPromise()

    return new Promise((res, rej) => {
      const server = apiServer
        .listen(port)
        .once('listening', () => {
          const testServer = getSuperTest(port)
          const response = {
            testServer,
            kill() {
              server.close()
            }
          }

          return res(response)
        })
        .once('error', rej)
    })
  }

  function commandSender(testServer) {
    return {
      async send(command, result) {
        const response = await testServer
          .post('/controller')
          .send(command)
        
        expect(response.text).toStrictEqual(JSON.stringify(result))
      }
    }
  }

  describe('Client workflow', () => {
    test('It should not receive a data stream if the proccess is not playing', async () => {  
      const server = await getTestServer()
      const onChunk = jest.fn()
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )
      
      await setTimeout(constant.util.test.retentionDataPeriod)
      server.kill()

      expect(onChunk).not.toHaveBeenCalled()

    })
    test('It should receive a data stream if the proccess has playing', async () => {
      const server = await getTestServer()
      const onChunk = jest.fn()
      const {
        send
      } = commandSender(server.testServer)
      pipeAndReadStreamData(
        server.testServer.get('/stream'),
        onChunk
      )

      await send({ command: 'start' }, { result: 'started' })
      await setTimeout(constant.util.test.retentionDataPeriod)
      await send({ command: 'stop' }, { result: 'stopped' })
      
      const [[
        buffer
      ]] = onChunk.mock.calls
      
      expect(buffer).toBeInstanceOf(Buffer)
      expect(buffer.length).toBeGreaterThan(1000)

      server.kill()
    })
  })
})