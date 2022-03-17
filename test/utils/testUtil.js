import { Readable, Writable, Transform } from 'stream'
import { jest } from '@jest/globals'
import portfinder from 'portfinder'
import supertest from 'supertest'
import { config } from '../../server/config'

export const generateReadableStream = (data) => new Readable({
  read() {
    for (const item of data) {
      this.push(item)
    }

    this.push(null)
  }
})

export const generateWritableStream = (onData) => new Writable({
  write(chunk, enc, cb) {
    onData(chunk)

    cb(null, chunk)
  }
})

export const defaultHandleParams = () => {
  const requestStream = generateReadableStream(['req body'])
  const responseStream = generateWritableStream(() => { })
  const data = {
    request: {
      ...requestStream,
      headers: {},
      method: '',
      url: ''
    },
    response: {
      ...responseStream,
      writeHead: jest.fn(),
      end: jest.fn()
    }
  }

  return {
    values: ()=> Object.values(data),
    ...data
  }
}

export const pipeAndReadStreamData = (stream, onChunk) => {
  const transform = new Transform({
    transform(chunk, enc, cb) {
      onChunk(chunk)
      cb(null,chunk)
    }
  })   

  return stream.pipe(transform)
}

export const getTestServer = async(apiServer) => {
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

export const commandSender = (testServer) => {
  return {
    async send(command, result) {
      const response = await testServer
        .post(config.location.controller)
        .send(command)
      
      expect(response.text).toStrictEqual(JSON.stringify(result))
    }
  }
}