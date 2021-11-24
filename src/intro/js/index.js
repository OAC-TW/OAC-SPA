'use strict';

function scrollTop() {
	const scrollTop = document.querySelector('.scrollTop');
	const scrollTopStyle = scrollTop.style;

	const updateScrollTop = () => {
		let topPos = window.scrollY || window.pageYOffset;
		if (topPos > 100) {
			scrollTopStyle.opacity = '1';
			scrollTopStyle.display = '';
		} else {
			scrollTopStyle.opacity = '0';
			scrollTopStyle.display = 'none';
		}
	}
	window.addEventListener('scroll', updateScrollTop, false);
	updateScrollTop();

	scrollTop.addEventListener('click', (ev) => {
		window.scrollTo(0, 0);
		return false;
	}, false);
}

function tabChang() {
	document.querySelectorAll('.tab').forEach((tab, i) => {
		tab.addEventListener('click', (ev) => {
			//手機板其他頁籤remove
			const ele = tab.parentNode.parentNode.querySelectorAll('.active');
			// console.log('[tab]', tab, ev, ele)
			for (const it of ele) {
				it.classList.remove('active');
			}
			tab.classList.add('active'); //頁籤+active
			tabText(this);
		}, false);
	});
}

function tabText(self) {
	const text = (self) ? self.innerText : document.querySelector('.active').innerText;
	document.getElementById('buttontext').innerText = text;
}

function initLangSelecter() {
	document.querySelectorAll('.lang').forEach((item, i) => {
		item.addEventListener('click', (ev) => {
			const ele = item.parentNode.parentNode.querySelectorAll('.active');
			// console.log('[item]', item, ev, ele)
			for (const it of ele) {
				it.classList.remove('active');
			}
			item.classList.add('active');

			const btn = document.querySelectorAll('[data-lang="comm-lang"]');
			const langStr = item.innerText;
			for (const it of btn) {
				it.innerText = langStr;
			}

			const newLang = item.getAttribute('data-setlang');
			updateLang(newLang);
		}, false);
	});
}

window.addEventListener('DOMContentLoaded', () => {
	scrollTop();
	tabText();
	tabChang();
	initLangSelecter();
})

function applyi18n(lang, langCode) {
	const langTag = 'data-lang';
	const nodes = document.querySelectorAll(`[${langTag}]`);
	for (const n of nodes) {
		const tag = n.getAttribute(langTag);
		let str = lang[tag];
		if (str) {
			n.innerText = str;
		}
	}
	tabText(); // TODO: auto

	// TODO: auto
	const langNodes = document.querySelectorAll(`[data-setlang]`);
	for (const n of langNodes) {
		const tag = n.getAttribute('data-setlang');
		if (langCode == tag) {
			n.classList.add('active');
		} else {
			n.classList.remove('active');
		}
	}
}

function updateLang(setlang) {
	let userLang = setlang || navigator.language || navigator.userLanguage;
	// console.log('[userLang]', userLang);
	let langCode = 'en';
	switch (true) {
		case /zh/.test(userLang):
			langCode = 'zh';
			break;
		case /en/.test(userLang):
			langCode = 'en';
			break;
	}
	fetch(`api/lang-${langCode}.json`)
		.then(res => {
			return res.json();
		}).then(data => {
			// console.log('[lang]', data);
			applyi18n(data, langCode);
		});
}
updateLang();
