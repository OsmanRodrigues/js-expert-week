import { Controller } from './controller.js'
import { View } from './view.js'
import { Service } from './service.js'

const controller = new Controller(View, Service)

console.log({controller})