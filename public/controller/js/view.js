import { config } from "./config.js"

const { constant, action } = config

export class View {

  constructor() {
    this.btnStart = document.getElementById(constant.id.button.start)
    this.btnStop = document.getElementById(constant.id.button.stop)
    async function onBtnClick() { }
    this.onBtnClick = onBtnClick
  }

  onLoad() {
    this.toggleCommandBtnVisibility()
    this.btnStart.onclick = this.handleBtnStartStopClicked.bind(this)
    this.btnStop.onclick = this.handleBtnStartStopClicked.bind(this)
  }

  toggleCommandBtnVisibility({ visibility } = { visibility: null }) {
    Array
      .from(document.querySelectorAll(`[name=${constant.name.button.command}]`))
      .forEach(btn => {
        const isNotVisible = !!visibility ?
          visibility === constant.state.visibility.notVisible :
          !!btn?.classList?.contains?.(constant.className.button.unassigned)
        
        const currentAction = isNotVisible ? action.remove : action.add
        btn.classList[currentAction](constant.className.button.unassigned)
        function onClickReset() {}
        btn.onclick = onClickReset
      })
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn
  }

  async handleBtnStartStopClicked({
    srcElement: {
      id,
      innerText
    }
  }) {
    const hasStartBtnClicked = id === constant.id.button.start 
    
    if (hasStartBtnClicked) {
      await this.onBtnClick(innerText)
    }
    
    this.toggleStartStop()
    this.toggleCommandBtnVisibility()

    if (!hasStartBtnClicked) {
      return await this.onBtnClick(innerText)
    }
  }

  toggleStartStop() {
    const isStopped = this.btnStop.classList.contains(constant.className.button.hidden)

    if (isStopped) {
      this.btnStart.classList.add(constant.className.button.hidden)
      this.btnStop.classList.remove(constant.className.button.hidden)
    } else {
      this.btnStart.classList.remove(constant.className.button.hidden)
      this.btnStop.classList.add(constant.className.button.hidden)
    }
  }
}