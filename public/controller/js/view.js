import { config } from "./config.js"

const { constant } = config

export class View {

  constructor() {
    this.btnStart = document.getElementById(constant.id.button.start)
    this.btnStop = document.getElementById(constant.id.button.stop)
    this.btnCommandList = document.querySelectorAll(`[name=${constant.name.button.command}]`)
    this.onBtnClick = null
  }

  applyCommandBtnOnClickEffect(btn) {
    const isActive = !!btn.classList?.contains?.(constant.className.button.active)
    
    if (!isActive) {
      btn.classList.add(constant.className.button.active)
      setTimeout(
        () => btn.classList.remove(constant.className.button.active),
        constant.retentionPeriod
      )
    }

  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn
  }

  async handleBtnCommandClick(btn) {
    this.applyCommandBtnOnClickEffect(btn.srcElement)
    
    return await this.onBtnClick(btn.srcElement.innerText)
  }

  async handleBtnStartStopClick({
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

  onLoad() {
    this.toggleCommandBtnVisibility()
    this.btnStart.onclick = this.handleBtnStartStopClick.bind(this)
    this.btnStop.onclick = this.handleBtnStartStopClick.bind(this)
  }

  toggleCommandBtnVisibility({ visibility } = { visibility: null }) {
    this.btnCommandList.forEach((btn) => {
      const isVisible = !!visibility ?
        visibility === constant.state.visibility.visible :
        !btn.classList?.contains?.(constant.className.button.unassigned)
      
      if (isVisible) {
        btn.onclick = null
        btn.classList.add(constant.className.button.unassigned)
      } else {
        btn.onclick = this.handleBtnCommandClick.bind(this)
        btn.classList.remove(constant.className.button.unassigned)
      }

    })
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