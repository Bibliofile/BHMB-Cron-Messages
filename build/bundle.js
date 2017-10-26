(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('@bhmb/bot')) :
	typeof define === 'function' && define.amd ? define(['@bhmb/bot'], factory) :
	(factory(global['@bhmb/bot']));
}(this, (function (bot) { 'use strict';

var html = "<template id=\"biblio_cron_messages_template\">\r\n    <div class=\"column is-one-third-desktop is-half-tablet\">\r\n        <div class=\"box\">\r\n            <label>\r\n                Minute Value:\r\n                <input class=\"input\" pattern=\"[0-9\\, ]{1,}\" placeholder=\"0-59\">\r\n            </label>\r\n            <br>\r\n            <label>\r\n                Message:\r\n                <input class=\"m input\">\r\n            </label>\r\n            <br>\r\n            <a>Delete</a>\r\n        </div>\r\n    </div>\r\n</template>\r\n<div class=\"container is-fluid\">\r\n    <section class=\"section is-small\">\r\n        <span class=\"button is-primary is-pulled-right\">+</span>\r\n        <h3>These are sent on a regular schedule.</h3>\r\n        <span>If minute value is set to 0, the message will be sent at 1:00, 2:00... if it is set to 0,30, it will be sent at 1:00, 1:30, 2:00...</span>\r\n    </section>\r\n    <div id=\"cMsgs\" class=\"columns is-multiline\"></div>\r\n</div>\r\n";

// message is a string, you can also load .css and .html files like this
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
    let columns = tab.querySelector('.columns');
    function saveConfig() {
        let containers = Array.from(columns.children);
        let messages = [];
        containers.forEach(function (container) {
            let minutes = container.querySelector('input');
            let message = container.querySelector('.m');
            if (minutes.validity.valid && minutes.value.length && message.value.length) {
                messages.push({ message: message.value, minutes: minutes.value });
            }
        });
        ex.storage.set('messages', messages);
    }
    tab.addEventListener('input', saveConfig);
    columns.addEventListener('click', function (event) {
        const target = event.target;
        if (target.tagName == 'A') {
            ui.alert('Really delete this message?', [
                { text: 'Delete', style: 'is-danger' },
                { text: 'Cancel' }
            ], function (response) {
                if (response == 'Delete') {
                    target.parentElement.remove();
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
        ui.buildTemplate(template, columns, [
            { selector: 'input', value: msg.minutes || 0 },
            { selector: '.m', value: msg.message || '' },
        ]);
    };
    getMessages().forEach(addMessage);
});

})));
//# sourceMappingURL=bundle.js.map
