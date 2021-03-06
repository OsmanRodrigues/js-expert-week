import { jest, expect, describe, test } from '@jest/globals'
import { View } from '../../../public/controller/js/view.js'
import { buildBtnElement, generateTestDOM } from '../../utils/testUtil.js'
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

  test.todo(`applyCommandBtnOnClickEffect ~ `)

  test.todo(`configureOnBtnClick ~ `)

  test.todo(`handleBtnCommandClick ~ `)

  test.todo(`handleBtnStartStopClick ~ `)

  test(`onLoad() ~ should call toggleCommandBtnVisibility`, () => {
    const view = new View()
    jest.spyOn(
      view,
      'toggleCommandBtnVisibility'
    ).mockReturnValue()

    view.onLoad()

    expect(view.toggleCommandBtnVisibility).toHaveBeenCalled()
  })

  describe(`toggleCommandBtnVisibility()`, () => {
    test(`~ If visibility='visible' it should add unassigned class and a null 
    onclick`, () => {
      const mockBtn = buildBtnElement()
      const expectedClassName = className.button.unassigned

      jest.spyOn(
        document,
        'querySelectorAll'
      ).mockReturnValue([mockBtn])

      const view = new View()
      view.toggleCommandBtnVisibility({ visibility: state.visibility.visible })
      
      expect(mockBtn.classList.add).toHaveBeenCalledWith(expectedClassName)
      expect(mockBtn.onclick).toStrictEqual(null)
    })

    test(`~ If visibility=notVisible it should remove unassigned class and reset 
    onclick`, () => {
      const mockBtn = buildBtnElement()
      const expectedClassName = className.button.unassigned
      const expectedResetFnName = 'bound handleBtnCommandClick'

      jest.spyOn(
        document,
        'querySelectorAll'
      ).mockReturnValue([mockBtn])

      const view = new View()
      view.toggleCommandBtnVisibility({ visibility: state.visibility.notVisible })

      expect(mockBtn.classList.add).not.toHaveBeenCalled()
      expect(mockBtn.classList.remove).toHaveBeenCalledWith(expectedClassName)
      expect(mockBtn.onclick.name).toStrictEqual(expectedResetFnName)
    })
  })

  test.todo(`toggleStartStop ~ `)
})