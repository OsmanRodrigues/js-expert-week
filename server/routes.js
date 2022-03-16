import { config } from "./config.js"
import { Controller } from "./controller.js"
import { logger } from "./utils.js"

const controller = new Controller()

const sendFile = async (filePath , res) => {
  const file = await controller.getFileStream(filePath)
  const contentType = config.constant.contentType[file.type]

  if (!!contentType) res.writeHead(200, {
    'Content-Type': contentType,
  })
  
  return file.stream.pipe(res)
}

const redirect = (res) => {
  res.writeHead(302, {
      Location: config.location.home,
  })
  return res.end()
}

const routes = async (req, res) => {
  const { page, location, method, constant } = config
  
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
          const notFoundPageMsg = 'Page not found.'
          res.writeHead(404, notFoundPageMsg)
          return res.end(notFoundPageMsg)
        
      }
  
    default:
      res.writeHead(404, 'Method not found.')
      return res.end()
  }

}

const handleError = (err, res) => {
  if (err.message.includes('ENOENT')) {
    const enoentErrorMsg = `Asset not found.`
    logger.warn(enoentErrorMsg)
    res.writeHead(404, enoentErrorMsg)
    return res.end()
  }

  logger.error(`Internal error: ${err.stack}`)
  res.writeHead(500, 'Internal error.')
  return res.end()
}

export const handler = (req, res) => routes(req, res).catch((err) => handleError(err, res))

