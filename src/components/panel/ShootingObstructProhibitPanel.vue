<template lang="pug">
div.content
	el-tabs(
		type='card',
		:value='activeTab',
		@tab-click="handleClick"
	)
		template(v-for='(v, i) in tabs')
			el-tab-pane(
				:label='v.l',
				:name='v.k',
			)
				//- p {{ v.k }}
				keep-alive
					component(
						v-bind:is='v.comp',
						v-bind='passProps[v.k] || {}',
						@resetScrollTop='resetScrollTop',
						:isMobile='isMobile',
						:isShow='isShow && v.k == activeTab',
					)

		//- el-tab-pane(
		//- 	label='isMobile',
		//- )
		//- 	p {{ `isMobile: ${isMobile}` }}

	//- keep-alive
	//- 	component(
	//- 		v-if='activeTab',
	//- 		v-bind:is='resultView(activeTab)',
	//- 		v-bind='passProps[activeTab]',
	//- 	)

</template>

<script>
import shootingObstructPanel from './shootingObstructPanel';
import prohibitPanel from './prohibitPanel';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'ShootingObstructProhibitPanel',
	components: {},
	props: {
		isMobile: {
			type: Boolean,
		},
		isShow: {
			type: Boolean,
		},
	},
	// watch: {
	// 	isMobile(val, oldVal) {
	// 		console.log('[ShootingObstructProhibitPanel]isMobile', val, oldVal);
	// 	},
	// },
	data: () => {
		let props = {};
		let tabs = [
			{
				l: '射擊通報',
				k: 'shooting',
				comp: shootingObstructPanel,
				prop: {
					layerUUID: '6d91636d-dbb2-41e4-b21c-2d50dcecf4b7', // TODO: not hardcoded
					viewType: 'shooting',
				},
			},
			{
				l: '礙航通報',
				k: 'obstruct',
				comp: shootingObstructPanel,
				prop: {
					layerUUID: 'c622837a-cbee-4d8c-90e1-21cb48b88d0f', // TODO: not hardcoded
					viewType: 'obstruct',
				},
			},
			{
				l: '禁止海域',
				k: 'prohibit',
				comp: prohibitPanel,
			},
		].map((v, idx) => {
			if (!props[v.k]) props[v.k] = v.prop || {};
			return v;
		});
		return {
			activeTab: tabs[0].k,
			passProps: props,
			tabs: tabs,
		};
	},
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
			navWidth: 'navWidth',
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
			return {
				left: `${this.navWidth}px`,
				'border-left-style': 'solid',
			};
		},
	},
	methods: {
		handleClick(tab, event) {
			console.log('[handleClick]', this, tab, event);

			// setup props
			this.resultData(tab.name);
			this.activeTab = tab.name;
		},
		resultView(key) {
			let key2comp = {
				shooting: null,
				obstruct: null,
				prohibit: null,
				weather: layerWeatherDetail,
			};
			let comp = key2comp[key];
			console.log('[resultView]', this, key, comp);
			return comp ? comp : null;
		},
		resultData(key) {
			console.log('[resultData]set prop', this, key, this.activeTab);
		},
		resetScrollTop() {
			this.$emit('resetScrollTop');
		},
	},
	mounted() {
		console.log('[ShootingObstructProhibitPanel]', this, this.isMobile);
		this.resultData(this.activeTab);
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
</style>
