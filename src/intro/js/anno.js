import { h, app, text } from 'hyperapp';

import Icon from './icon.js';
import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
// import { Collapse } from 'bootstrap';

const buildLink = (v) => h('a', {
	class: 'card-link',
	target: '_blank',
	rel: 'noopener noreferrer nofollow',
	href: v.url,
}, [
	Icon({ src: faLink }), // link or external-link-alt?
	text(v.title),
]);

// 活動布告欄
const listItemView = (v) => {
	if (!v.title) return null;

	const showDetail = (state, ev) => {
		return {
			...state,
			viewToken: v.token,
			viewData: v,
		}
	};
	return h('div', {
		class: 'list-group-item list-group-item-action py-3 lh-tight cursorPointer',
		token: v.token,
		onclick: showDetail,
	}, [
		h('div', { class: 'd-flex w-100 align-items-center justify-content-between' }, [
			h('strong', { class: 'mb-1' }, text(v.title)),
			h('small', { class: 'text-muted' }, text(new Date(v.time).toLocaleString())),
		]),
		// h('div', { class: 'col-10 mb-1 small' }, text(v.content || '')),
	]);
}

const itemDetailView = (state) => {
	const goBack = (state, ev) => {
		// TODO: auto scroll to top
		return {
			...state,
			viewToken: null,
			viewData: null,
		}
	};
	const v = state.viewData;
	const url = v.url?.map(u => buildLink(u)) || [];

	const buildAttach = (v) => {
		const id = `attach-${v.token}`;
		const detailClass = { class: 'mt-2 mb-2 d-flex flex-wrap justify-content-between' };
		const detailTextStyle = {
			style: {
				'overflow-wrap': 'anywhere',
			},
		};
		const badgeStyle = {
			class: 'badge bg-secondary',
			style: {
				'line-height': 'unset',
			},
		};
		return h('div', { class: 'card card-body' }, [
			h('div', { class: 'input-group' }, [
				h('a', {
					class: 'btn btn-outline-secondary',
					href: `api/f/${v.token}`,
					target: '_blank',
					rel: 'noopener noreferrer nofollow',
				}, text('下載')), // open & force download?
				h('input', { class: 'form-control', type: 'text', readonly: true, value: v.name }),
				h('button', {
					class: 'btn btn-outline-secondary dropdown-toggle dropdown-toggle-split',
					'data-bs-toggle': 'collapse',
					'data-bs-target': `#${id}`,
					'aria-expanded': 'false',
				}, h('span', {}, text('附檔資訊'))),
			]),
			h('div', { class: 'collapse', id }, [
				h('div', { class: 'list-group' }, [
					h('div', detailClass, [h('span', badgeStyle, text('filename')), h('span', detailTextStyle, text(v.name))]),
					h('div', detailClass, [h('span', badgeStyle, text('sha256')), h('span', detailTextStyle, text(v.hash))]),
					h('div', detailClass, [h('span', badgeStyle, text('time')), h('span', detailTextStyle, text(new Date(v.time).toLocaleString()))]),
					h('div', detailClass, [h('span', badgeStyle, text('size')), h('span', detailTextStyle, text(byte2Size(v.sz)))]),
				]),
			]),
		]);
	};
	const attach = v.attach?.map(u => buildAttach(u)) || [];
	let lines = (v.content || '').split('\n').map((v, i) => text(v));
	const content = [];
	for (let i = 0; i < lines.length; i++) {
		content.push(lines[i]);
		if (i < lines.length - 1) content.push(h('br', {}));
	}

	return h('div', { class: 'card scrollarea' }, [
		h('div', { class: 'card-body scrollarea' }, [
			h('h5', { class: 'card-title' }, text(v.title)),
			h('h6', { class: 'card-subtitle mb-2 text-muted' }, text(new Date(v.time).toLocaleString())),

			h('p', { class: 'card-text' }, content),

			url.length && h('div', { class: 'card card-body mb-2 mt-4' }, [
				h('h6', { class: 'bold' }, text('連結:')),
				...url,
			]),
			attach.length && h('div', { class: 'card card-body mb-2' }, [
				h('h6', { class: 'bold' }, text('附檔:')),
				...attach,
			]),
		]),
		h('div', { class: 'card-footer text-muted' }, [
			h('div', { class: 'btn btn-secondary', onclick: goBack }, text('< 返回')),
		]),
	]);
}

const modalAnnoBodyView = (state) => {
	console.log('[modalAnnoBodyView]', state);
	if (state.viewToken) {
		return itemDetailView(state);
	}
	let items = [];
	state.data?.forEach(v => {
		let it = listItemView(v);
		if (v) items.push(it);
	});
	return (items.length) ? h('div', { class: 'list-group list-group-flush border-bottom scrollarea' }, items) : h('div', { style: { 'text-align': 'center' } }, text('暫無資料'));
}

function mountApp(ele, data, token) {
	let viewToken = null;
	let viewData = null;
	if (token) {
		for (let it of data) {
			if (it.token == token) {
				viewToken = it.token;
				viewData = it;
				break;
			}
		}
	}
	console.log('[anno]init', token, viewData);
	app({
		init: () => ({
			data,
			viewToken,
			viewData,
		}),
		view: modalAnnoBodyView,
		node: ele,
	});
}

export { mountApp as Anno, buildLink };

function byte2Size(bytes, decimals = 2) {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
