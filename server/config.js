import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const getPath = (pathName='') => {
  const currUrl = fileURLToPath(import.meta.url)
  const currDir = dirname(currUrl)
  const rootPathName = '../'
  const root = join(currDir, rootPathName)

  if (!pathName) return root
  
  return join(root, pathName)
}

export default {
  port: Number(process.env.PORT) || 3000,
  dir: {
    root: getPath(),
    audio: getPath('audio'),
    public: getPath('public'),
    songs: getPath('audio/songs'),
    fx: getPath('audio/fx')
  },
  pages: {
    home: 'home/index.html',
    controller: 'controller/index.html'
  },
  location: {
    home: '/home'
  }
}