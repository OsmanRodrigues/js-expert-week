import { config } from "./config.js"
import { startServer } from "./server.js"
import { logger } from "./utils.js"

startServer()
  .listen(config.port)
  .on('listening', () => logger.info(`Server running at port ${config.port}`))
  
process.on('uncaughtException', (err) =>
  logger.error(`uncaughtException happened: ${err.stack || err}`))
process.on('unhandledRejection', (err) =>
  logger.error(`unhandledRejection happened: ${err.stack || err}`))