import config from "./config.js";
import controller from "./controller.js";
import { logger } from "./utils.js";


const routes = async (req, res) => {
  const startedController = controller.run()
  const { pages } = config
  
  switch (req.method) {
    case 'GET':
      switch (req.url) {
        case '/':
          res.writeHead(302, {
            'Location': config.location.home
          })
          return res.end()
        
        case '/home':
          const homePageFile = await startedController.getFileStream(pages.home)
          return homePageFile.stream.pipe(res);
        
        case '/controller':
          const controllerPageFile = await startedController.getFileStream(pages.controller)
          return controllerPageFile.stream.pipe(res);
      
        default:
          try {
            const { stream } = await startedController.getFileStream(req.url)
            return stream.pipe(res)
          } catch (err) {
            const notFoundPageMsg = 'Page not found.'
            res.writeHead(404,notFoundPageMsg )
            return res.end(notFoundPageMsg)
          }
      }
  
    default:
      res.writeHead(404, 'Method not found.')
      return res.end()
  }
}

const handleError = (err, res) => {
  if (err.message.includes('ENOENT')) {
    const enoentErrorMsg = `Asset not found ${err.stack}`;
    logger.warn(enoentErrorMsg);
    res.writeHead(404, enoentErrorMsg);
    return res.end()
  }

  logger.error(`Internal error: ${err.stack}`)
  res.writeHead(500)
  return res.end()
}

export const handler = (req, res) => routes(req, res).catch((err) => handleError(err, res));

