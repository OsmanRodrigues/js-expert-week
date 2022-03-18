import { jest, expect, describe, test } from '@jest/globals'
import { View } from '../../../public/controller/js/view.js'
import { buildBtnElement, generateTestDOM } from '../../utils/testUtil'
import { config } from '../../../public/controller/js/config.js'

const { constant: { className, state } } = config

describe('#View', () => {
  generateTestDOM()
  
  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllMocks()
    
    const mockBtn = buildBtnElement()
    jest.spyOn(
      document,
      'getElementById'
    ).mockReturnValue([mockBtn])
  })

  test(`toggleCommandVisibility ~ if visibility='visible' it should add unassigned class and reset onclick`, () => {
    const mockBtn = buildBtnElement()
    const expectedClassName = className.button.unassigned
    const expectedResetFnName = 'onClickReset'

    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([mockBtn])

    const view = new View()
    view.toggleCommandBtnVisibility({ visibility: state.visibility.visible })
    
    expect(mockBtn.classList.add).toHaveBeenCalledWith(expectedClassName)
    expect(mockBtn.onclick.name).toStrictEqual(expectedResetFnName)
    expect(()=> mockBtn.onclick()).not.toThrow()
  })

  test(`toggleCommandVisibility ~ if visibility=notVisible it should remove unassigned class and reset onclick`, () => {
    const mockBtn = buildBtnElement()
    const expectedClassName = className.button.unassigned
    const expectedResetFnName = 'onClickReset'

    jest.spyOn(
      document,
      'querySelectorAll'
    ).mockReturnValue([mockBtn])

    const view = new View()
    view.toggleCommandBtnVisibility({ visibility: state.visibility.notVisible })

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