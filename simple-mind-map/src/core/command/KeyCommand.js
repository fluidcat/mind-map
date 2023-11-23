import { keyMap } from './keyMap'
//  快捷按键、命令处理类
export default class KeyCommand {
  //  构造函数
  constructor(opt) {
    this.opt = opt
    this.mindMap = opt.mindMap
    this.shortcutMap = {
      //Enter: [fn]
    }
    this.shortcutMapCache = {}
    this.isPause = false
    this.isInSvg = false
    this.bindEvent()
  }

  //  暂停快捷键响应
  pause() {
    this.isPause = true
  }

  //  恢复快捷键响应
  recovery() {
    this.isPause = false
  }

  //  保存当前注册的快捷键数据，然后清空快捷键数据
  save() {
    this.shortcutMapCache = this.shortcutMap
    this.shortcutMap = {}
  }

  //  恢复保存的快捷键数据，然后清空缓存数据
  restore() {
    this.shortcutMap = this.shortcutMapCache
    this.shortcutMapCache = {}
  }

  //  绑定事件
  bindEvent() {
    this.onKeydown = this.onKeydown.bind(this)
    // 只有当鼠标在画布内才响应快捷键
    this.mindMap.on('svg_mouseenter', () => {
      this.isInSvg = true
    })
    this.mindMap.on('svg_mouseleave', () => {
      if (this.mindMap.richText && this.mindMap.richText.showTextEdit) {
        return
      }
      if (
        this.mindMap.renderer.textEdit.showTextEdit ||
        (this.mindMap.associativeLine &&
          this.mindMap.associativeLine.showTextEdit)
      ) {
        return
      }
      this.isInSvg = false
    })
    window.addEventListener('keydown', this.onKeydown)
    this.mindMap.on('beforeDestroy', () => {
      this.unBindEvent()
    })
  }

  // 解绑事件
  unBindEvent() {
    window.removeEventListener('keydown', this.onKeydown)
  }

  // 按键事件
  onKeydown(e) {
    if (
      this.isPause ||
      (this.mindMap.opt.enableShortcutOnlyWhenMouseInSvg && !this.isInSvg)
    ) {
      return
    }
    Object.keys(this.shortcutMap).forEach(key => {
      if (this.checkKey(e, key)) {
        // 粘贴事件不组织，因为要监听paste事件
        if (!this.checkKey(e, 'Control+v')) {
          e.stopPropagation()
          e.preventDefault()
        }
        this.shortcutMap[key].forEach(fn => {
          fn()
        })
      }
    })
  }

  //  检查键值是否符合
  checkKey(e, key) {
    let o = this.getOriginEventCodeArr(e)
    let k = this.getKeyCodeArr(key)
    if (o.length !== k.length) {
      return false
    }
    for (let i = 0; i < o.length; i++) {
      let index = k.findIndex(item => {
        return item === o[i]
      })
      if (index === -1) {
        return false
      } else {
        k.splice(index, 1)
      }
    }
    return true
  }

  //  获取事件对象里的键值数组
  getOriginEventCodeArr(e) {
    let arr = []
    if (e.ctrlKey || e.metaKey) {
      arr.push(keyMap['Control'])
    }
    if (e.altKey) {
      arr.push(keyMap['Alt'])
    }
    if (e.shiftKey) {
      arr.push(keyMap['Shift'])
    }
    if (!arr.includes(e.keyCode)) {
      arr.push(e.keyCode)
    }
    return arr
  }

  // 判断是否按下了组合键
  hasCombinationKey(e) {
    return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
  }

  //  获取快捷键对应的键值数组
  getKeyCodeArr(key) {
    let keyArr = key.split(/\s*\+\s*/)
    let arr = []
    keyArr.forEach(item => {
      arr.push(keyMap[item])
    })
    return arr
  }

  //  添加快捷键命令
  /**
   * Enter
   * Tab | Insert
   * Shift + a
   */
  addShortcut(key, fn) {
    key.split(/\s*\|\s*/).forEach(item => {
      if (this.shortcutMap[item]) {
        this.shortcutMap[item].push(fn)
      } else {
        this.shortcutMap[item] = [fn]
      }
    })
  }

  //  移除快捷键命令
  removeShortcut(key, fn) {
    key.split(/\s*\|\s*/).forEach(item => {
      if (this.shortcutMap[item]) {
        if (fn) {
          let index = this.shortcutMap[item].findIndex(f => {
            return f === fn
          })
          if (index !== -1) {
            this.shortcutMap[item].splice(index, 1)
          }
        } else {
          this.shortcutMap[item] = []
          delete this.shortcutMap[item]
        }
      }
    })
  }

  //  获取指定快捷键的处理函数
  getShortcutFn(key) {
    let res = []
    key.split(/\s*\|\s*/).forEach(item => {
      res = this.shortcutMap[item] || []
    })
    return res
  }
}
