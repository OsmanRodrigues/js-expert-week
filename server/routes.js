import { config } from "./config.js"
import { Controller } from "./controller.js"
import { logger } from "./utils.js"
import { once } from 'events'

const controller = new Controller()

const { page, location, method, constant, statusCode } = config

const sendFile = async (filePath , res) => {
  const file = await controller.getFileStream(filePath)
  const contentType = constant.contentType[file.type]

  if (!!contentType) res.writeHead(statusCode['OK'], {
    'Content-Type': contentType,
  })
  
  return file.stream.pipe(res)
}

const redirect = (res) => {
  res.writeHead(statusCode['FOUND'], {
      Location: config.location.home,
  })
  return res.end()
}

const routes = async (req, res) => {
  switch (req.method) {

    case method.get:
      switch (true) {

        case req.url === location.main:
          return redirect(res)
        
        case req.url === location.home:
          return sendFile(page.home, res)
          
        case req.url === location.controller:
          return sendFile(page.controller, res)
            
        case req.url.includes(location.home) || req.url.includes(location.controller):
          return sendFile(req.url, res)
        
        case req.url.includes(location.stream):
          const {
            stream,
            onClose
          } = controller.createClientStream()
          req.once('close', onClose)
          res.writeHead(200, {
            'Content-Type': constant.contentType[".mpeg"],
            'Accept-Ranges': constant.acceptRanges.bytes
          })

          return stream.pipe(res)
        
        default:
          const code = statusCode['NOT_FOUND']
          const notFoundPageMsg = constant.fallback.route.statusCode[code]

          res.writeHead(code)
          return res.end(notFoundPageMsg)
        
      }
      
    case method.post:
      switch (true) {

        case req.url.includes(location.controller):
          const data = await once(req, 'data')
          const parsedData = JSON.parse(data)
          const result = await controller.handleStreamingCommand(parsedData)
          const parsedResult = JSON.stringify(result)
          
          return res.end(parsedResult)
      
        default:
          const code = statusCode['NOT_FOUND']
          const notFoundPageMsg = constant.fallback.route.statusCode[code]

          res.writeHead(code)
          return res.end(notFoundPageMsg)
      }

    default:
      const code = statusCode['METHOD_NOT_ALLOWED']
      const notAllowedMessage = constant.fallback.route.statusCode[code]
      
      res.writeHead(code)
      return res.end(notAllowedMessage)
  }

}

const handleError = (err, res) => {
  if (err.message.includes('ENOENT')) {
    const code = statusCode['NOT_FOUND']
    const enoentErrorMsg = `Asset not found.`
    logger.warn(enoentErrorMsg)
    res.writeHead(code)
    
    return res.end(enoentErrorMsg)
  }

  const code = statusCode['INTERNAL_SERVER_ERROR']
  const internalErrorMessage = constant.fallback.route.statusCode[code]
  logger.error(`${internalErrorMessage}: ${err.stack}`)
  res.writeHead(code)
  return res.end(internalErrorMessage)
}

export const handler = (req, res) => routes(req, res).catch((err) => handleError(err, res))

