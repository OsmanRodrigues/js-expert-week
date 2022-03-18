export const config = {
  method: {
    get: 'GET',
    post: 'POST'
  },
  action: {
    add: 'add',
    remove: 'remove'
  },
  constant: {
    id: {
      button: {
        start: 'start',
        stop: 'stop'
      }
    },
    name: {
      button: {
        command: 'command'
      }
    },
    className: {
      button: {
        unassigned: 'unassigned',
        hidden: 'hidden',
        active: 'active'
      }
    },
    state: {
      visibility: {
        visible: 'visible',
        notVisible: 'notVisible'
      }
    },
    retentionPeriod: 500,
  }
}