// import { h, app, text } from 'hyperapp'; // TODO: render modal

import { Modal } from 'bootstrap';

// register sw
async function registerSW() {
	if (!"serviceWorker" in navigator) return;

	const $confirm = (msg, props) => {
		const modalE = document.getElementById('confirmModal');
		console.log('[$confirm]', modalE, modalE.querySelector('.modal-footer .btn.btn-primary'));
		const modal = Modal.getInstance(modalE) || new Modal(modalE, {
			keyboard: false,
		});
		modalE.querySelector('.modal-body').textContent = msg;
		const promise = new Promise((resolve, reject) => {
			const once = { once: true };
			modalE.addEventListener('hide.bs.modal', (ev) => {
				reject('cancel', ev);
			}, once);
			modalE.querySelector('.modal-footer .btn.btn-primary')?.addEventListener('click', (ev) => {
				resolve('confirm', ev);
				modal.hide();
			}, once);
			modal.show();
		});
		return promise;
	}

	function listenForWaitingServiceWorker(reg, callback) {
		let awaitStateChange = function () {
			reg.installing.addEventListener('statechange', function () {
				if (this.state === 'installed') callback(reg.waiting);
			});
		}
		if (!reg) return;
		if (reg.waiting) return callback(reg.waiting);
		if (reg.installing) awaitStateChange();
		reg.addEventListener('updatefound', awaitStateChange);
	}

	if (navigator.serviceWorker.controller) {
		console.log("[PWA] active service worker found, no need to register");
		const reg = await navigator.serviceWorker.getRegistration();
		console.log("[PWA] try update service worker");
		const promptUserToRefresh = async (sw) => {
			await $confirm("有新版本，是否重新整理", { type: 'success' })
			sw.postMessage('skipWaiting');
			location.reload();
		}
		listenForWaitingServiceWorker(reg, promptUserToRefresh);
	} else {
		// Register the service worker
		const reg = await navigator.serviceWorker.register("sw.js", { scope: "./" })
		console.log("[PWA] Service worker has been registered for scope: " + reg.scope);
	}
}
registerSW();