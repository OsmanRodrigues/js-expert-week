import { jest, expect, describe, test, beforeEach } from '@jest/globals'
import { setTimeout } from 'timers/promises'
import { config } from '../../../server/config.js'
import { server as apiServer } from '../../../server/server.js'
import { commandSender, getTestServer, pipeAndReadStreamData } from '../../utils/testUtil.js'

const { location, constant } = config

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
      } = commandSender(server.testServer)
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
  })
})