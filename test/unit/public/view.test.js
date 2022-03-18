import { jest, expect, describe, test } from '@jest/globals'
import { View } from '../../../public/controller/js/view.js'
import { buildBtnElement, generateTestDOM } from '../../utils/testUtil'
import { config } from '../../../public/controller/js/config.js'

const { constant } = config

describe('#View', () => {
  generateTestDOM()
  
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
  })

  test(`toggleCommandVisibility ~ if shouldToggle=true it should add unassigned class and reset onclick`, () => {
    const mockBtn = buildBtnElement()
    const expectedClassName = constant.className.button.unassigned
    const expectedResetFnName = 'onClickReset'

    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([mockBtn])

    const view = new View()
    view.toggleCommandBtnVisibility()

    expect(mockBtn.classList.add).toHaveBeenCalledWith(expectedClassName)
    expect(mockBtn.onclick.name).toStrictEqual(expectedResetFnName)
    expect(()=> mockBtn.onclick()).not.toThrow()
  })

  test(`toggleCommandVisibility ~ if shouldToggle=false it should remove unassigned class and reset onclick`, () => {
    const mockBtn = buildBtnElement()
    const expectedClassName = constant.className.button.unassigned
    const expectedResetFnName = 'onClickReset'

    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([mockBtn])

    const view = new View()
    view.toggleCommandBtnVisibility(false)

    expect(mockBtn.classList.add).not.toHaveBeenCalled()
    expect(mockBtn.classList.remove).toHaveBeenCalledWith(expectedClassName);
    expect(mockBtn.onclick.name).toStrictEqual(expectedResetFnName)
    expect(()=> mockBtn.onclick()).not.toThrow()
  })

  test(`onLoad ~ should call toggleCommandBtnVisibility`, () => {
    const view = new View()
    jest.spyOn(
      view,
      'toggleCommandBtnVisibility'
    ).mockReturnValue()

    view.onLoad()

    expect(view.toggleCommandBtnVisibility).toHaveBeenCalled()
  })
})