import { MessageBot } from '@bhmb/bot'
import { UIExtensionExports } from '@bhmb/ui'


// message is a string, you can also load .css and .html files like this
import html from './tab.html'

interface Message {
  minutes: string
  message: string
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

  let columns = tab.querySelector('.columns') as HTMLElement

  function saveConfig() {
    let containers = Array.from(columns.children)
    let messages: Message[] = []
    containers.forEach(function (container) {
      let minutes = container.querySelector('input') as HTMLInputElement
      let message = container.querySelector('.m') as HTMLInputElement
      if (minutes.validity.valid && minutes.value.length && message.value.length) {
        messages.push({ message: message.value, minutes: minutes.value })
      }
    })

    ex.storage.set('messages', messages)
  }
  tab.addEventListener('input', saveConfig)

  columns.addEventListener('click', function (event) {
    const target = event.target as HTMLElement
    if (target.tagName == 'A') {
      ui.alert('Really delete this message?', [
        { text: 'Delete', style: 'is-danger' },
        { text: 'Cancel' }
      ], function (response) {
        if (response == 'Delete') {
          (target.parentElement as HTMLElement).remove()
          saveConfig()
        }
      })
      event.stopPropagation()
    }
  })

  ;(tab.querySelector('.button') as HTMLButtonElement).addEventListener('click', function () {
    addMessage()
  })

  let template = tab.querySelector('template') as HTMLTemplateElement
  let addMessage = (msg: Partial<Message> = {}) => {
    ui.buildTemplate(template, columns, [
      { selector: 'input', value: msg.minutes || 0 },
      { selector: '.m', value: msg.message || '' },
    ])
  }

  getMessages().forEach(addMessage)
})
