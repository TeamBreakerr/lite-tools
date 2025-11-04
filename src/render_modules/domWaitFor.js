const waiters = []
let observer = null

function getByPath(obj, path) {
  if (!obj || !path) return undefined
  const segments = path
    .replace(/\[(\w+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
  return segments.reduce((acc, key) => (acc ? acc[key] : undefined), obj)
}

function ensureObserver() {
  if (!observer) {
    observer = new MutationObserver(() => {
      for (let i = waiters.length - 1; i >= 0; i--) {
        const waiter = waiters[i]
        const element = document.querySelector(waiter.selector)

        if (element) {
          if (waiter.propPath) {
            const vueInstances = element.__VUE__
            if (vueInstances?.length) {
              for (const instance of new Set(vueInstances)) {
                const value = getByPath(instance, waiter.propPath)
                if (value !== undefined) {
                  waiters.splice(i, 1)
                  if (waiter.timeoutId) clearTimeout(waiter.timeoutId)
                  waiter.resolve({ element, instance, value })
                  break
                }
              }
            }
          } else {
            // 仅等待元素出现
            waiters.splice(i, 1)
            if (waiter.timeoutId) clearTimeout(waiter.timeoutId)
            waiter.resolve(element)
          }
        }
      }

      if (waiters.length === 0 && observer) {
        observer.disconnect()
        observer = null
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }
}

/**
 * 等待元素出现
 */
function waitForElement(selector, timeout) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector)
    if (el) return resolve(el)

    const waiter = { selector, resolve, reject }
    if (timeout !== undefined) {
      waiter.timeoutId = window.setTimeout(() => {
        const index = waiters.indexOf(waiter)
        if (index !== -1) waiters.splice(index, 1)
        reject?.(new Error(`waitForElement timeout: ${selector}`))
        if (waiters.length === 0 && observer) {
          observer.disconnect()
          observer = null
        }
      }, timeout)
    }

    waiters.push(waiter)
    ensureObserver()
  })
}

/**
 * 等待 Vue 实例指定属性出现
 */
function waitForInstance(selector, propPath, timeout) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector)
    if (element) {
      const vueInstances = element.__VUE__
      if (vueInstances?.length) {
        for (const instance of new Set(vueInstances)) {
          const value = getByPath(instance, propPath)
          if (value !== undefined) return resolve({ element, instance, value })
        }
      }
    }

    const waiter = { selector, propPath, resolve, reject }
    if (timeout !== undefined) {
      waiter.timeoutId = window.setTimeout(() => {
        const index = waiters.indexOf(waiter)
        if (index !== -1) waiters.splice(index, 1)
        reject?.(
          new Error(`waitForInstance timeout: ${selector} -> ${propPath}`)
        )
        if (waiters.length === 0 && observer) {
          observer.disconnect()
          observer = null
        }
      }, timeout)
    }

    waiters.push(waiter)
    ensureObserver()
  })
}

/**
 * 同步版本：立即检查 Vue 实例属性
 * 找不到则返回 null，不等待
 */
function getInstanceSync(selector, propPath) {
  const element = document.querySelector(selector)
  if (!element) return null

  const vueInstances = element.__VUE__
  if (!vueInstances?.length) return null

  for (const instance of new Set(vueInstances)) {
    const value = getByPath(instance, propPath)
    if (value !== undefined) {
      return { element, instance, value }
    }
  }

  return null
}

export { waitForElement, waitForInstance, getInstanceSync }
