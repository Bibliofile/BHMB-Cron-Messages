/*jshint
    esversion: 6,
    browser: true,
    devel: true,
    unused: true,
    undef: true
*/
/*global
    MessageBot
*/

MessageBot.registerExtension('bibliofile/cron', function(ex, world) {
    function getMessages() {
        return world.storage.getObject('biblio_cron_messages_messages', []);
    }

    var timeout;
    function listener() {
        var minute = new Date().getMinutes();
        getMessages().forEach(function(msg) {
            var msgMinutes = msg.minutes.replace(/\s/g, '').split(',');
            msgMinutes.forEach(function(min) {
                if (min == minute) {
                    ex.bot.send(msg.message);
                }
            });
        });

        timeout = setTimeout(listener, 60 * 1000);
    }
    listener();

    ex.uninstall = function() {
        world.storage.clearNamespace('biblio_cron_messages');
        clearTimeout(timeout);
    };

    // Browser only
    if (ex.isNode || !ex.bot.getExports('ui')) return;

    var ui = ex.bot.getExports('ui');
    var tab = ui.addTab('Cron', 'messages');
    tab.innerHTML = '<template> <div class="column is-one-third-desktop is-half-tablet"> <div class="box"> <label> Minute Value: <input class="input" pattern="[0-9\,]{1,}" placeholder="0-59"> </label> <br><label> Message: <input class="m input"> </label> <br><a>Delete</a> </div></div></template><div class="container is-fluid"> <section class="section is-small"> <span class="button is-primary is-pulled-right">+</span> <h3>These are sent on a regular schedule.</h3> <span>If minute value is set to 0, the message will be sent at 1:00, 2:00... if it is set to 0,30, it will be sent at 1:00, 1:30, 2:00...</span> </section> <div class="columns is-multiline"></div></div>';

    function saveConfig() {
        var containers = Array.from(tab.querySelectorAll('.columns > div'));
        var messages = [];
        containers.forEach(function(container) {
            var minutes = container.querySelector('input');
            var message = container.querySelector('.m');
            if (minutes.validity.valid && minutes.value.length && message.value.length) {
                messages.push({message: message.value, minutes: minutes.value});
            }
        });

        world.storage.set('biblio_cron_messages_messages', messages);
    }
    tab.addEventListener('input', saveConfig);

    tab.querySelector('.columns').addEventListener('click', function(event) {
        if (event.target.tagName == 'A') {
            ui.alert('Really delete this message?', [
                {text: 'Delete', style: 'is-danger'},
                {text: 'Cancel'}
            ], function(response) {
                if (response == 'Delete') {
                    event.target.parentElement.remove();
                    saveConfig();
                }
            });
            event.stopPropagation();
        }
    });

    tab.querySelector('.button').addEventListener('click', function() {
        addMessage();
    });

    function addMessage(msg) {
        if (!msg) msg = {};

        ui.buildTemplate(tab.querySelector('template'), tab.querySelector('.columns'), [
            {selector: 'input', value: msg.minutes || 0},
            {selector: '.m', value: msg.message || ''},
        ]);
    }

    getMessages().forEach(addMessage);
});
