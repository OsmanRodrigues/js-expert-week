import { createServer } from 'http'
import { handler } from './routes.js'

export const startServer = () => createServer(handler)