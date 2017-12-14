import { MessageBot } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'


// message is a string, you can also load .css and .html files like this
import html from './tab.html'

interface Message {
  minutes: string
  message: string
}

function findParent(className: string, element: HTMLElement | null): HTMLElement {
  while (element && !element.classList.contains(className)) element = element.parentElement
  if (element) return element
  throw new Error('No root member found.')
}

MessageBot.registerExtension('bibliofile/cron', (ex) => {
  const getMessages = () => ex.storage.get<Message[]>('messages', [])

  let timeout: number
  function listener() {
    let minute = new Date().getMinutes()
    getMessages().forEach(function (msg) {
      let msgMinutes = msg.minutes.replace(/\s/g, '').split(',')
      msgMinutes.forEach(min => {
        if (+min == minute) {
          ex.bot.send(msg.message)
        }
      })
    })

    timeout = setTimeout(listener, 60 * 1000)
  }
  listener()

  ex.uninstall = () => clearTimeout(timeout)

  // Browser only
  const ui = ex.bot.getExports('ui') as UIExtensionExports | undefined
  if (!ui) return

  let tab = ui.addTab('Cron', 'messages')
  tab.innerHTML = html

  let container = tab.querySelector('.messages-container') as HTMLElement

  function saveConfig() {
    let boxes = Array.from(container.children)
    let messages: Message[] = []
    boxes.forEach(function (container) {
      let minutes = container.querySelector('input')!
      let message = container.querySelector('.m') as HTMLInputElement
      if (minutes.validity.valid && minutes.value.length && message.value.length) {
        messages.push({ message: message.value, minutes: minutes.value })
      }
    })

    ex.storage.set('messages', messages)
  }
  tab.addEventListener('input', saveConfig)

  container.addEventListener('click', function (event) {
    const target = event.target as HTMLElement
    if (target.tagName == 'BUTTON') {
      target.parentElement
      ui.alert('Really delete this message?', [
        { text: 'Delete', style: 'is-danger' },
        { text: 'Cancel' }
      ], function (response) {
        if (response == 'Delete') {
          findParent('box', target).remove()
          saveConfig()
        }
      })
      event.stopPropagation()
    }
  })

  tab.querySelector('.button')!.addEventListener('click', function () {
    addMessage()
  })

  let template = tab.querySelector('template')!
  let addMessage = (msg: Partial<Message> = {}) => {
    ui.buildTemplate(template, container, [
      { selector: 'input', value: msg.minutes || 0 },
      { selector: '.m', value: msg.message || '' },
    ])
  }

  getMessages().forEach(addMessage)
})
