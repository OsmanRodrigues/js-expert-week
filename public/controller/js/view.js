import { config } from "./config.js"

const { constant: { name, className, id, state }, action } = config

export class View {

  constructor() {
    this.btnStart = document.getElementById(id.button.start)
    this.btnStop = document.getElementById(id.button.stop)
    async function onBtnClick() { }
    this.onBtnClick = onBtnClick
  }

  onLoad() {
    this.toggleCommandBtnVisibility()
    this.btnStart.onclick = this.handleBtnStarClicked.bind(this)
  }

  toggleCommandBtnVisibility({ visibility } = { visibility: null }) {
    Array
      .from(document.querySelectorAll(`[name=${name.button.command}]`))
      .forEach(btn => {
        const isNotVisible = !!visibility ?
          visibility === state.visibility.notVisible :
          !!btn?.classList?.contains?.(className.button.unassigned)
        
        const currentAction = isNotVisible ? action.remove : action.add
        btn.classList[currentAction](className.button.unassigned)
        function onClickReset() {}
        btn.onclick = onClickReset
      })
  }

  configureOnBtnClick(fn) {
    this.onBtnClick = fn
  }

  async handleBtnStarClicked({
    srcElement: {
      innerText
    }
  }) {
    const btnText = innerText
    await this.onBtnClick(btnText)
    this.toggleStartStop()
    this.toggleCommandBtnVisibility()
  }

  toggleStartStop() {
    const isStopped = this.btnStop.classList.contains(className.button.hidden)

    if (isStopped) {
      this.btnStart.classList.add(className.button.hidden)
      this.btnStop.classList.remove(className.button.hidden)
    } else {
      this.btnStart.classList.remove(className.button.hidden)
      this.btnStop.classList.add(className.button.hidden)
    }
  }
}