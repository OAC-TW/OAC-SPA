import Vue from 'vue'
import App from './App.vue'
import 'normalize.css'

// FONTAWESOME SETUP
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
library.add(fas, fab, far)
Vue.component('font-awesome-icon', FontAwesomeIcon)

// ELEMENT UI LIB
import Element from 'element-ui'
import './element-variables.scss'
import locale from 'element-ui/lib/locale/lang/zh-TW'
Vue.use(Element, { locale })

const { Dialog, Drawer } = Element
Vue.prototype.$openLink = link => window.open(link, "_blank")
Vue.prototype.$drawer = ({ props = {}, on = {} }) => {
	let vm = null;
	let closeFn = () => {
		if (typeof on.close === 'function') on.close();
		vm.$destroy();
	}
	return {
		open: (child, childOpts = {}) => {
			vm = new Vue({
				render: h => h(Drawer, {
					props: Object.assign({
						visible: false,
						appendToBody: true,
						direction: "rtl",
						destroyOnClose: true
					}, props),
					on: Object.assign({ ...on }, {
						"close": closeFn,
					}),
				}, [h(child, childOpts), h("h2", { slot: "title", ref: 'title' }, props.title)]) // overwrite default title
			}).$mount()
			//document.body.appendChild(vm.$el)
			//console.log('[Vue.$drawer]new()', vm, vm.$refs, vm.$props)
			let headerStyle = vm.$refs.title.parentElement.style;
			headerStyle.padding = '0.1rem 1rem';
			headerStyle.margin = 0;
			headerStyle.textAlign = 'center';
			vm.$children[0].$props.visible = true;
		},
		close: closeFn,
	}
}
Vue.prototype.$dialog = ({ props = {}, on = {}, style = null, ...args }) => {
	let prop = Object.assign({
		destroyOnClose: true,
		visible: true,
		showClose: true,
		appendToBody: true,
		center: true,
	}, props);
	let vm = null;
	return {
		open: (child, childOpts = {}) => {
			vm = new Vue({
				render: h => h(Dialog, {
					ref: 'warp',
					props: prop,
					on: {
						"close": () => {
							vm.$destroy();
						},
					},
					...args,
				}, [h(child, childOpts)]),
			}).$mount()
			//console.log('[Vue.$dialog]new()', vm, vm.$refs, vm.$refs.warp.$refs)

			if (style) {
				let domStyle = vm.$refs.warp.$refs.dialog.style;
				Object.keys(style).forEach(k => {
					domStyle[k] = style[k];
				});
			}
		},
		close: () => {
			vm.$destroy()
		}
	}
}

// VUEX
import store from './store'
console.log(" %c Stroe ", 'background:#bada55;color:#000', store)

Vue.config.productionTip = false

new Vue({
	store,
	render: h => h(App),
	async created() {

		// int commit
		try {
			const res = await (await fetch("https://ocean.taiwan.gov.tw/OacGA_HF/ocatwgatotalpageviews.json")).json()
			this.$store.commit("SET_GA_COUNT", res)
		} catch (e) {
			console.error(e)
		}
		window.addEventListener('resize', () => {
			this.$store.commit("UPDATE_WINDOW_SIZE", { width: window.innerWidth, height: window.innerHeight })
		})

		// register sw
		if (!"serviceWorker" in navigator) return

		function listenForWaitingServiceWorker(reg, callback) {
			function awaitStateChange() {
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
			const reg = await navigator.serviceWorker.getRegistration()
			console.log("[PWA] try update service worker");
			const promptUserToRefresh = async sw => {
				await this.$confirm("有新版本，是否重新整理", { type: 'success' })
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
}).$mount('#app')
