import { Readable, Writable, Transform } from 'stream'
import { jest } from '@jest/globals'
import portfinder from 'portfinder'
import supertest from 'supertest'
import { config } from '../../server/config.js'
import { JSDOM } from 'jsdom'

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
    onData?.(chunk)

    cb(null, chunk)
  }
})

export const defaultHandleParams = () => {
  const requestStream = generateReadableStream(['req body'])
  const responseStream = generateWritableStream()
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

export const mutationSender = (testServer) => {
  return {
    async send(data, result) {
      const response = await testServer
        .post(config.location.controller)
        .send(data)
      
      expect(response.text).toStrictEqual(JSON.stringify(result))
    }
  }
}

export const generateTestDOM = () => {
  const dom = new JSDOM()
  global.window = dom.window
  global.document = dom.window.document

  return dom
}

const elementFactoryDefaultParams = {
  text: '',
  classList: {
    add: jest.fn(),
    remove: jest.fn()
  }
}

export const elementFactory = ({ text, classList, ...other } = {
  ...elementFactoryDefaultParams,
  ...other
}) => ({
  classList,
  innerText: text,
  ...other
})

export const buildBtnElement = ({ text, classList } = elementFactoryDefaultParams) => elementFactory({
  text,
  classList,
  onclick: jest.fn
})