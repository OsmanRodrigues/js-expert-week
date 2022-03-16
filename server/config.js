import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export const getPath = (pathName='') => {
  const currUrl = fileURLToPath(import.meta.url)
  const currDir = dirname(currUrl)
  const rootPathName = '../'
  const root = join(currDir, rootPathName)

  if (!pathName) return root
  
  return join(root, pathName)
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  dir: {
    root: getPath(),
    audio: getPath('audio'),
    public: getPath('public'),
    songs: getPath('audio/songs'),
    fx: getPath('audio/fx')
  },
  page: {
    home: '/home/index.html',
    controller: '/controller/index.html'
  },
  location: {
    main: '/',
    home: '/home',
    controller: '/controller',
    stream: '/stream'
  },
  method: {
    get: 'GET',
    post: 'POST'
  },
  constant: {
    contentType: {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.mpeg': 'audio/mpeg'
    },
    acceptRanges: {
      bytes: 'bytes'
    },
    fileExt: {
      html: '.html',
      css: '.css',
      js: '.js'
    },
    audio: {
      mediaType: 'mp3',
      songVolume: '0.99',
      fallbackBitRate: '128000',
      bitRateDivisor: 8,
      file: {
        englishConversation: {
          dir: getPath('/audio/songs/conversation.mp3')
        }
      }
    },
    util: {
      test: {
        retentionDataPeriod: 200,
      }
    }
  }
}