import { h, app, text } from 'hyperapp';

import { Anno, buildLink } from './anno.js';

import { Modal } from 'bootstrap';

// 相關連結、活動申請
const itemView = (v) => {
	const url = v.url?.map(u => buildLink(u)) || [];
	return h('div', { class: 'col-12 col-md-6' }, h('div', { class: 'card mt-2 bg-img' }, h('div', { class: 'card-body opacity' }, [
		h('h5', { class: 'card-title' }, text(v.title)),
		h('div', { class: 'card-text' }, text(v.content || '')),
		...url,
	])));
}

const modalBodyView = (state) => {
	return h('div', { class: 'modal-body' }, [
		(state.data?.length) ? h('div', { class: 'row' }, [
			// h('div', { class: 'col-12' }, h('h5', { class: 'text-justify' }, text(state.desc))),
			...(state.data?.map(v => itemView(v))),
		]) : h('div', { style: { 'text-align': 'center' } }, text('暫無資料')),
	]);
}

//fetch('tmp/info.json')
fetch('api/info.json')
	.then(res => {
		return res.json();
	}).then(data => {
		console.log('[info]', data);

		if (data.terms) document.querySelector('p[data-lang="ua"]').innerText = data.terms;

		app({
			init: () => ({ data: data.link }),
			view: modalBodyView,
			node: document.getElementById('link-content'),
		});

		app({
			init: () => ({ data: data.event }),
			view: modalBodyView,
			node: document.getElementById('apply-content'),
		});

		let token = window?.location?.hash?.substr(1);
		Anno(document.getElementById('anno-content'), data.anno, token);
		if (token) {
			let annoModalE = document.getElementById('exampleModal5');
			let modal = Modal.getInstance(annoModalE) || new Modal(annoModalE);
			modal?.show();
		}
	})


//瀏覽人次
// TODO: auto update?
fetch("https://ocean.taiwan.gov.tw/OacGA_HF/ocatwgatotalpageviews.json")
	.then(res => {
		return res.json();
	}).then(result => {
		let pageViews = result.pageviews
		document.getElementById('pageViews').innerText = pageViews;
	})

//颱風消息與警報
// TODO: auto update?
const onData = (() => {
	const reqFn = (cb) => {
		fetch("https://ocean.taiwan.gov.tw/OpenData/CWB_Typhoon/json/W-C0034-001_002.json")
			.then(res => {
				return res.json();
			}).then(data => {
				const urgency = ["Immediate", "Expected", "Future"]//,"Past","Unknown"
				//調完樣式改為 Past、Unknown 為不須顯示警報，Immediate、Expected、Future 則需

				let capAlerts = []
				data.cap.forEach(function (item) {
					if (urgency.includes(item.urgency)) {
						capAlerts.push(item.description)
					}
				});
				cb(capAlerts);
			});
	}
	const subFn = (dispatch, options) => {
		console.log('[subFn]', dispatch, options);
		// let { interval } = options.opt;

		reqFn((data) => {
			console.log('[dispatch]', options, data);
			dispatch(options.action, data)
		});

		// let id = setTimeout(function update() {
		// 	id = setTimeout(update, interval);
		// 	console.log('[dispatch]', options, interval);
		// 	// reqFn((data) => {
		// 	// 	console.log('[dispatch]', options, data);
		// 	// 	dispatch(options.action, data)
		// 	// });
		// }, interval);
		// return () => clearTimeout(id)

		return () => { }; // return funtion for cancel
	}
	// return (action, opt) => [subFn, { action, opt }] // kept calling?!!
	return (action, opt) => [subFn, { action }] // only once?
})()

// const every = (() => {
// 	const interval = (dispatch, props) => {
// 		console.log('[interval]0');
// 		const id = setInterval(() => {
// 			console.log('[interval]dispatch');
// 			dispatch(props.action, Date.now())
// 		}, props.delay)
// 		return () => clearInterval(id)
// 	}
// 	return (action, delay) => [interval, { action, delay }]
// })()

const Update = (state, capAlerts) => {
	console.log('[data]', state, capAlerts);
	return {
		...state,
		capAlerts
	};
}

const alertView = (v) => {
	const lines = v.split('\n');
	return h('div', { class: "px-2", style: { 'margin-bottom': '1.5rem' } }, lines.map(l => h('div', {}, text(l))));
}

app({
	init: () => {
		let state = {
			capAlerts: [],
		};
		// state.setAlert = (state0, data) => ({ ...state, capAlerts: data });
		return state
	},
	view: (state) => {
		console.log('[Typhoon][view]', state);
		const count = state.capAlerts?.length || 0;
		document.getElementById('typhoonbadge').innerText = count;
		const ele = !count ? text('') : [];
		if (count) {
			state.capAlerts.forEach((v, i) => {
				ele.push(alertView(v));
				if (i !== count - 1) ele.push(h('hr', {}));
			});
			document.getElementById('btnTyphoonAlert').style.display = '';
		} else {
			document.getElementById('btnTyphoonAlert').style.display = 'none';
		}
		return h('span', {
			class: 'row marquee',
			id: 'marquee',
			direction: 'dun',
		}, ele);
	},
	node: document.getElementById('marquee'),
	subscriptions: (state) => [
		onData(Update, { state, interval: 30 * 1000 }),
		// every(Update, 5000),
	],
});
