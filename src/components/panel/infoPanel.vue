<template lang="pug">
transition(name='slide-fade', mode='out-in')
	div.panel(
		v-show='showPanel',
		:style="(isMobile) ? mobileStyle: desktopStyle",
		ref='panel',
	)
		pageHeader(
			:title='(isMobile) ? title || "" : ""',
			@back='back',
			:useBack='useBack || isMobile',
		)
		div.content
			slot(
				:resetScrollTop='resetScrollTop',
				:isShow='showPanel',
			)

</template>

<script>
import pageHeader from '@/components/common/pageHeader';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'panel',
	components: {
		pageHeader,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		useBack: {
			type: Boolean,
		},
		title: {
			type: String,
		},
	},
	data: () => ({
		activeKey: '',
		passProps: {},
	}),
	computed: {
		...mapGetters({
			showPanel: 'showPanel',
			navWidth: 'navWidth',
			screenWidth: 'screenWidth',
		}),
		mobileStyle() {
			return {
				left: '0px',
				width: '100%',
				'border-left-style': 'none',
				'padding-right': '2rem',
			};
		},
		desktopStyle() {
			let w = this.screenWidth - this.navWidth;
			w = w > 400 ? 400 : w;
			return {
				left: `${this.navWidth}px`,
				'border-left-style': 'solid',
				width: this.screenWidth * 0.3 > 400 ? '30vw' : `${w}px`,
			};
		},
	},
	methods: {
		...mapActions({
			closePanel: 'closePanel',
		}),
		back() {
			this.closePanel();
		},
		resetScrollTop() {
			// console.log('[resetScrollTop]', this);
			this.$nextTick(() => {
				this.$refs.panel.scrollTop = 0;
			});
		},
	},
};
</script>

<style lang="scss" scoped>
.panel {
	z-index: 32;
	position: fixed;
	// background-color: $white;
	background-color: #fff;
	height: 100%;
	overflow: auto;
	padding: 0.5rem 1rem 0 1rem;

	border-left-color: $primary;
	// border-left-style: solid;

	// left: 133px;
	width: 30vw;
}

.content {
	margin: 0.5rem 1rem 1rem 1rem;
}
</style>
