import { Readable, Writable } from 'stream'
import { jest } from '@jest/globals'

const generateReadableStream = (data) => new Readable({
  read() {
    for (const item of data) {
      this.push(item)
    }

    this.push(null)
  }
})

const generateWritableStream = (onData) => new Writable({
  write(chunk, enc, cb) {
    onData(chunk)

    cb(null, chunk)
  }
})

const defaultHandleParams = () => {
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

export const testUtil = {
  defaultHandleParams,
  generateReadableStream,
  generateWritableStream
}