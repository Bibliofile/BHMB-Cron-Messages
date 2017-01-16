/*jshint
    esnext: true,
    browser: true,
    devel: true,
    unused: true,
    undef: true
*/
/*global
    MessageBotExtension
*/

var biblio_cron_messages = MessageBotExtension('biblio_cron_messages');

(function(ex, storage, ui) {
    ex.setAutoLaunch(true);
    ex.running = true;
    ex.uninstall = function() {
        //Remove stored messages
        storage.removeNamespace('biblio_cron_messages');
        //Kill the listener
        ex.running = false;
    };

    var tab = ex.tab = ui.addTab('Cron Messages', 'messages');
    tab.innerHTML = '<style>#biblio_cron_messages_h { margin: 0 0 5px 0;} #cMsgs{padding-top: 8px;margin-top: 8px;border-top: 1px solid;height: calc(100vh - 185px);}</style><template id="biblio_cron_messages_template"><div class="third-box"><label>Minute Value</label><input value="0" pattern="[0-9\, ]{1,}" placeholder="0-59"><br><label>Message: </label><input class="m"><br><a>Delete</a></div></template><h3 id="biblio_cron_messages_h">These are sent on a regular schedule.</h3><span class="descdet">If minute value is set to 0, the message will be sent at 1:00, 2:00... if it is set to 0,30, it will be sent at 1:00, 1:30, 2:00....</span><span class="top-right-button">+</span><div id="cMsgs"></div>';

    function addMessage(values) {
        ui.buildContentFromTemplate('#biblio_cron_messages_template', '#cMsgs',
        [
            {selector: 'input', value: values.minutes || 0},
            {selector: '.m', value: values.message || ''},
        ]);

        //No need to save here.
    }

    tab.querySelector('#cMsgs').addEventListener('click', function(event) {
        if (event.target.tagName == 'A') {
            ui.alert('Really delete this message?',
            [
                {text: 'Delete', style: 'danger', thisArg: event.target.parentElement, action: function() {
                    this.remove();
                    saveConfig();
                }},
                {text: 'Cancel'}
            ]);
            event.stopPropagation();
        }
    })

    tab.querySelector('.top-right-button').addEventListener('click', function() {
        addMessage({});
    });

    function saveConfig() {
        var containers = Array.from(tab.querySelector('#cMsgs > div'));
        ex.messages = [];
        containers.forEach(function(container) {
            var minutes = container.querySelector('input');
            var message = container.querySelector('.m');
            if (minutes.validity.valid && minutes.value.length && message.value.length) {
                ex.messages.push({message: message.value, minutes: minutes.value});
            }
        });

        storage.set('biblio_cron_messages_messages', ex.messages);
    }
    tab.querySelector('#cMsgs').addEventListener('change', saveConfig);

    ex.messages = storage.getObject('biblio_cron_messages_messages', []);
    ex.messages.forEach(addMessage);
    saveConfig();

    function listener() {
        if (!ex.running) {
            return;
        }
        var minute = new Date().getMinutes();
        ex.messages.forEach(function(msg) {
            var msgMinutes = msg.minutes.replace(/ /g, '').split(',');
            msgMinutes.forEach(function(min) {
                if (min == minute) {
                    ex.bot.send(msg.message);
                }
            });
        });

        setTimeout(listener, 60 * 1000);
    }
    listener();
}(biblio_cron_messages, biblio_cron_messages.storage, biblio_cron_messages.ui));
