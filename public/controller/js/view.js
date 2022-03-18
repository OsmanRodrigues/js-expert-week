import { config } from "./config.js"

const { constant: { name, className }, action } = config

export class View {

  onLoad() {
    this.toggleCommandBtnVisibility()
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

}