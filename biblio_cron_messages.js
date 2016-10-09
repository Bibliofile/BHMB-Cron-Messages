/*jshint 
	esnext:		true, 
	browser:	true, 
	devel:		true,
	unused:		true,
	undef:		true
*/
/*global
	MessageBotExtension
*/
 
var biblio_cron_messages = MessageBotExtension('biblio_cron_messages');
biblio_cron_messages.setAutoLaunch(true);
 
biblio_cron_messages.uMID = 0;
biblio_cron_messages.messages = localStorage.getItem('biblio_cron_messages_messages' + window.worldId);
biblio_cron_messages.messages = (biblio_cron_messages.messages === null) ? [] : JSON.parse(biblio_cron_messages.messages);
biblio_cron_messages.uninstall = function() {
	Object.keys(localStorage).forEach(function(key) {
		if (key.indexOf('biblio_cron_messages_messages') === 0) {
			localStorage.removeItem(key);
		}
	});
};
 
biblio_cron_messages.addMainTab('cronTab', 'Cron Messages');
biblio_cron_messages.mainTabs.cronTab.innerHTML = '<style>#cMsgs{border-top: 1px solid #000;margin-top: 10px;}</style><template><div class="msg"><label>Minute Value</label><input value="0" pattern="[0-9\,]{1,}" placeholder="0-59"><br><label>Message: </label><input class="m"><br><a>Delete</a></div></template><h3 class="descgen">These are sent on a regular schedule.</h3><span class="descdet">If minute value is set to 0, the message will be sent at 1:00, 2:00... if it is set to 0,30, it will be sent at 1:00, 1:30, 2:00....</span><span class="add">+</span><div id="cMsgs"></div>';
 
biblio_cron_messages.bot.fixTemplates();
 
biblio_cron_messages.container = document.getElementById('cMsgs');
biblio_cron_messages.template = biblio_cron_messages.mainTabs.cronTab.querySelector('template');
 
biblio_cron_messages.addNew = function() {
	this.add({});
};
 
biblio_cron_messages.add = function(saveObj) {
	var content = this.template.content;
	content.querySelector('div').id = 'cron_m' + this.uMID;
	content.querySelector('input').value = (typeof saveObj.minutes == 'string') ? saveObj.minutes : 0;
	content.querySelector('.m').value = (typeof saveObj.message == 'string') ? saveObj.message : '';
 
	this.container.appendChild(document.importNode(content, true));
	this.container.querySelector('#cron_m' + this.uMID++ + '>a').addEventListener('click', this.bot.deleteMsg.bind(this), false); //Piggybacking, yay!
};
 
biblio_cron_messages.saveConfig = function() {
	this.messages = [];
	var ch = this.container.children;
	for (var i=0; i<ch.length; i++) {
		var a = ch[i].querySelector('input'), b = ch[i].querySelector('.m');
		if (a.validity.valid && a.value.length > 0 && b.value.length > 0) {
			this.messages.push({message: b.value, minutes: a.value});
		}
	}
 
	localStorage.setItem('biblio_cron_messages_messages' + window.worldId, JSON.stringify(this.messages));
};
 
biblio_cron_messages.listener = function() {
	var minute = new Date().getMinutes();
	this.messages.forEach(function(msg) {
		var msgMinutes = msg.minutes.split(',');
		msgMinutes.forEach(function(min) {
			if (min == minute) {
				this.core.send(msg.message);
			}
		}.bind(this));
	}.bind(this));
	setTimeout(this.listener.bind(this), 60000);
};
 
biblio_cron_messages.mainTabs.cronTab.querySelector('.add').addEventListener('click', biblio_cron_messages.addNew.bind(biblio_cron_messages), false);
biblio_cron_messages.mainTabs.cronTab.addEventListener('change', biblio_cron_messages.saveConfig.bind(biblio_cron_messages), false);
 
biblio_cron_messages.messages.forEach(function(msg) {
	this.add(msg);
}.bind(biblio_cron_messages));
biblio_cron_messages.saveConfig.call(biblio_cron_messages);
biblio_cron_messages.listener.call(biblio_cron_messages);
