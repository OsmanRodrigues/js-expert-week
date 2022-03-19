import { config } from "./config.js"
import { server } from "./server.js"
import { logger } from "./utils.js"

server
  .listen(config.port)
  .on('listening', () => logger.info(`Server running at port ${config.port}`))
  
process.on('uncaughtException', (err) =>
  logger.error(`uncaughtException happened: ${err.stack || err}`))
process.on('unhandledRejection', (err) =>
  logger.error(`unhandledRejection happened: ${err.stack || err}`))