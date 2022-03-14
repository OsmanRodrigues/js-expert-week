import { pino } from 'pino'

export const logger = pino({
  enabled: (!process.env.LOG_DISABLED),
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
})

