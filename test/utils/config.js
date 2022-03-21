export const config = {
  retentionDataPeriod: 200, 
  command: {
    req: {
      start: {
        command: 'start'
      },
      stop: {
        command: 'stop'
      }
    },
    res: {
      started: {
        result: 'started'
      },
      stopped: {
        result: 'stopped'
      }
    }
  }    
}