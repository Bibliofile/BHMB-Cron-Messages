(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@bhmb/bot')) :
	typeof define === 'function' && define.amd ? define(['@bhmb/bot'], factory) :
	(factory(global['@bhmb/bot']));
}(this, (function (bot) { 'use strict';

var html = "<template>\r\n  <div class=\"box\">\r\n    <div class=\"columns\">\r\n      <div class=\"column is-narrow\">\r\n        <p class=\"has-text-weight-bold\">Minute value</p>\r\n      </div>\r\n      <div class=\"column is-3\">\r\n        <input class=\"input is-small\" pattern=\"[0-9, ]{1,}\" placeholder=\"0-59\">\r\n      </div>\r\n      <div class=\"column\">\r\n        <textarea class=\"m textarea is-small is-fluid\"></textarea>\r\n      </div>\r\n      <div class=\"column is-narrow\">\r\n        <button class=\"button is-small is-danger is-outlined\" data-do=\"delete\">Delete</button>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</template>\r\n\r\n<div class=\"container is-widescreen\">\r\n    <section class=\"section is-small\">\r\n      <span class=\"button is-primary is-adding-message\">+</span>\r\n      <h3 class=\"title is-4\">Cron Messages</h3>\r\n      <ul>\r\n        <li>These are sent on a regular schedule.</li>\r\n        <li>If the minute value is set to 0, the message will be sent at 1:00, 2:00..., if set to 0,30 the message will be sent at 1:00, 1:30, 2:00...</li>\r\n      </ul>\r\n    </section>\r\n    <div class=\"messages-container\"></div>\r\n</div>\r\n";

// message is a string, you can also load .css and .html files like this
function findParent(className, element) {
    while (element && !element.classList.contains(className))
        element = element.parentElement;
    if (element)
        return element;
    throw new Error('No root member found.');
}
bot.MessageBot.registerExtension('bibliofile/cron', (ex) => {
    const getMessages = () => ex.storage.get('messages', []);
    let timeout;
    function listener() {
        let minute = new Date().getMinutes();
        getMessages().forEach(function (msg) {
            let msgMinutes = msg.minutes.replace(/\s/g, '').split(',');
            msgMinutes.forEach(min => {
                if (+min == minute) {
                    ex.bot.send(msg.message);
                }
            });
        });
        timeout = setTimeout(listener, 60 * 1000);
    }
    listener();
    ex.uninstall = () => clearTimeout(timeout);
    // Browser only
    const ui = ex.bot.getExports('ui');
    if (!ui)
        return;
    let tab = ui.addTab('Cron', 'messages');
    tab.innerHTML = html;
    let container = tab.querySelector('.messages-container');
    function saveConfig() {
        let boxes = Array.from(container.children);
        let messages = [];
        boxes.forEach(function (container) {
            let minutes = container.querySelector('input');
            let message = container.querySelector('.m');
            if (minutes.validity.valid && minutes.value.length && message.value.length) {
                messages.push({ message: message.value, minutes: minutes.value });
            }
        });
        ex.storage.set('messages', messages);
    }
    tab.addEventListener('input', saveConfig);
    container.addEventListener('click', function (event) {
        const target = event.target;
        if (target.tagName == 'BUTTON') {
            target.parentElement;
            ui.alert('Really delete this message?', [
                { text: 'Delete', style: 'is-danger' },
                { text: 'Cancel' }
            ], function (response) {
                if (response == 'Delete') {
                    findParent('box', target).remove();
                    saveConfig();
                }
            });
            event.stopPropagation();
        }
    });
    tab.querySelector('.button').addEventListener('click', function () {
        addMessage();
    });
    let template = tab.querySelector('template');
    let addMessage = (msg = {}) => {
        ui.buildTemplate(template, container, [
            { selector: 'input', value: msg.minutes || 0 },
            { selector: '.m', value: msg.message || '' },
        ]);
    };
    getMessages().forEach(addMessage);
});

})));
//# sourceMappingURL=bundle.js.map
