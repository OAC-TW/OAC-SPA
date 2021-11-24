<template lang="pug">
div.content
	div(style='display: flex;text-align: center;')
		el-radio-group(
			style='margin: 0 auto;user-select: none;',
			v-model='filtTypeModel',
			size='medium',
		)
			template(v-for='(v, i) in tabs')
				el-radio(
					:label='v.k',
					border,
				) {{ v.l }}

	//- TODO: i18n
	div(v-if='filtType === ""')
		hr
		p.nofilter 請選擇類別
		p.warningText 從事水域活動前，務必先詳細閱讀當地政府相關規定，並評估自身能力及注意安全。

	div(v-show='filtType !== ""')
		hr
		keep-alive
			component(
				v-if='filtType',
				v-bind:is='comps[filtType]',
				v-bind='passProps[filtType]',
				:isMobile='isMobile',
				@resetScrollTop='resetScrollTop',
				:isShow='isShow',
			)

</template>

<script>
import relaxationRegPanel from './relaxationRegPanel';
import relaxationEventPanel from './relaxationEventPanel';
import relaxationSearchPanel from './relaxationSearchPanel';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'relaxationPanel',
	components: {},
	props: {
		isMobile: {
			type: Boolean,
		},
		isShow: {
			type: Boolean,
		},
	},
	data: () => {
		let props = {};
		let comps = {};
		let tabs = [
			{
				l: '景點關鍵字查詢',
				k: 'search',
				comp: relaxationSearchPanel,
			},
			{
				l: '遊憩景點',
				k: 'relaxation',
				comp: relaxationRegPanel,
			},
			{
				l: '水域活動',
				k: 'relaxationActivity',
				comp: relaxationRegPanel,
			},
			{
				l: '年度賽事',
				k: 'event',
				comp: relaxationEventPanel,
			},
		].map((v, idx) => {
			if (!props[v.k]) props[v.k] = { key: v.k };
			comps[v.k] = v.comp;
			return v;
		});
		return {
			comps: comps,
			passProps: props,

			tabs: tabs,
			filtType: '',
			layerToFilt: null,

			// search
			currentKeyword: '',
			results: [],
			loading: false,
			loadingText: '搜尋中...',
		};
	},
	watch: {
		isShow: function(val, oldVal) {
			if (val) this.loadLayerData();
			this.$LayerIns.setPin(this.layerToFilt?.id, val);
		},
	},
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
			navWidth: 'navWidth',
		}),
		filtTypeModel: {
			get() {
				return this.filtType;
			},
			set(v) {
				console.log('[relaxationPanel][filtTypeModel]set', this, v);
				// pass layer data to child
				switch (v) {
					case 'search':
						this.passProps[v] = {
							key: v,
							Layer: this.layerToFilt,
						};
						break;
					case 'relaxation':
						this.passProps[v] = {
							key: v, // or reuse & watch prop update?
							Layer: this.layerToFilt,
							Type: 'region',
						};
						break;
					case 'relaxationActivity':
						this.passProps[v] = {
							key: v, // or reuse & watch prop update?
							Layer: this.layerToFilt,
							Type: 'activity',
						};
						break;
				}
				this.filtType = v;
			},
		},
	},
	methods: {
		...mapMutations({
			UPDATE_LAYER_OPTIONS:'layer/UPDATE_LAYER_OPTIONS',
		}),
		loadLayerData() {
			const layer = this.$LayerIns.normalLayerCollection.find(
				(l) => l.id == 'fd0165da-1f57-4335-bbf2-8114c7ff0e6f', // TODO: not hardcoded
			);
			if (!layer) return;
			console.log('[relaxationPanel]layer', this, layer, this.$LayerIns.isPinned(id));

			// TODO: auto visible when manually hide
			// pin & auto load data
			let id = layer.id;
			this.$LayerIns.setPin(id, true);
			if (!layer.visible) {
				this.$LayerIns.setVisible(id, true);
				if (layer.status == 'loading') {
					layer.once('loaded', () => {
						// this.layerToFilt = Object.assign({}, layer, { _isVue: true }); // copy & hacky for no proxy
						this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
					});
				}
			} else {
				// this.layerToFilt = Object.assign({}, layer, { _isVue: true }); // copy & hacky for no proxy
				this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
			}
			// console.log('[relaxationPanel]layer0', this, layer, this.$LayerIns.isPinned(id));
		},
		resetScrollTop() {
			this.$emit('resetScrollTop');
		},
	},
	mounted() {
		console.log('[relaxationPanel]', this, this.isMobile);
	},
	activated() {
		// console.log('[relaxationPanel]activated()', this, this.isMobile, this.isShow);
		this.loadLayerData();
	},
	deactivated() {
		// un-pin layer
		// console.log('[relaxationPanel]deactivated()', this, this.isMobile, this.isShow);
		this.$LayerIns.setPin(this.layerToFilt?.id, false);
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
.nofilter {
	text-align: center;
}
.warningText {
	text-align: center;
	color: #f00;
	font-weight: 500;
	font-size: 1.5rem;
}
:deep() {
	.el-radio .el-radio__input {
		display: none;
	}
	.el-radio.is-bordered, .el-checkbox.is-bordered {
		margin-right: 0.1rem;
	}
	.el-radio.is-bordered.is-checked {
		background-color: $primary;
	}
	.el-radio__input.is-checked + .el-radio__label {
		color: #fff;
	}
}
/deep/ {
	.el-radio .el-radio__input {
		display: none;
	}
	.el-radio.is-bordered, .el-checkbox.is-bordered {
		margin-right: 0.1rem;
	}
	.el-radio.is-bordered.is-checked {
		background-color: $primary;
	}
	.el-radio__input.is-checked + .el-radio__label {
		color: #fff;
	}
}
</style>
