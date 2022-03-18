import { config } from "./config.js"

const { constant, action } = config

export class View {

  constructor() {
    this.btnStart = document.getElementById(constant.id.button.start)
    this.btnStop = document.getElementById(constant.id.button.stop)
    this.btnCommandList = Array.from(document.querySelectorAll(`[name=${constant.name.button.command}]`))
    async function onBtnClick() { }
    this.onBtnClick = onBtnClick
  }

  onLoad() {
    this.toggleCommandBtnVisibility()
    this.btnStart.addEventListener('click', this.handleBtnStartStopClick.bind(this))
    this.btnStop.addEventListener('click', this.handleBtnStartStopClick.bind(this))
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn
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

  async handleBtnCommandClick(btn) {
    console.log(btn.srcElement)
    this.applyCommandBtnOnClickEffect(btn.srcElement)
    
    return await this.onBtnClick(btn.srcElement.innerText)
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
  
}