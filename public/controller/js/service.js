import { config } from "./config.js"

const { method } = config

export class Service {

  constructor({ url }) {
    this.url = url
  }

  request() {
    return {
      post: async (body) => {
        const res = await fetch(this.url, {
          method: method.post,
          body: !! body ? JSON.stringify(body) : null 
        })

        return res.json()
      }
    }
  }
}