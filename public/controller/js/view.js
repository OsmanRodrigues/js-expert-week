import { config } from "./config.js"

const { constant: { name, className, id }, action } = config

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

  toggleCommandBtnVisibility(shouldToggle=true) {
    Array
      .from(document.querySelectorAll(`[name=${name.button.command}]`))
      .forEach(btn => {
        const currentAction = shouldToggle ? action.add : action.remove
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
  }

}