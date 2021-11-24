<template lang="pug">
.google_translate(ref='translatePanel')
</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'translatePanel',
	components: {},
	props: {
		isMobile: {
			type: Boolean,
		},
		isShow: {
			type: Boolean,
		},
	},
	data: () => ({}),
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
			navWidth: 'navWidth',
		}),
	},
	methods: {
		resetScrollTop() {
			this.$emit('resetScrollTop');
		},
	},
	mounted() {
		console.log('[translatePanel]', this, this.isMobile);
		const fnName = 'googleTranslateElementInit';
		const initTool = (ev) => {
			console.log('[translatePanel]loaded', this, ev);
			new google.translate.TranslateElement(
				{ pageLanguage: 'zh-TW', includedLanguages: 'en,ja,zh-TW' },
				this.$refs['translatePanel'],
			);
			delete window[fnName]; // remove
		};
		window[fnName] = initTool; // need set to window/global scope
		let sc = document.createElement('script');
		// sc.onload = initTool; // not work
		sc.setAttribute(
			'src',
			`//translate.google.com/translate_a/element.js?cb=${fnName}`,
		);
		this.$refs['translatePanel'].appendChild(sc);
	},
	activated() {},
	deactivated() {},
};
</script>

<style lang="scss" scoped>
.google_translate {
	margin: 0.5rem 1rem;
	text-align: center;
}
</style>
