<template lang="pug">
div
	//- view data
	div(v-if='viewPoint')
		pageHeader(
			:title='viewPoint["名稱"]',
			@back='goBack',
			:useBack='true',
		)
			el-button(circle, @click='flyTo(viewPoint)')
				.flyToButton
					font-awesome-icon(icon='map-marker-alt', fixed-width, size='2x')
		resultObstructShootingView(
			v-bind:data='viewPoint',
			@flyTo='flyTo(viewPoint)',
		)


	//- filter, v-show to keep state
	div.content(v-show='!viewPoint')
		//- 中央, 地方
		div(style='display: flex;margin-bottom: .5rem;')
			el-radio-group(
				style='margin: 0 auto;user-select: none;',
				v-model='filtTypeModel',
				size='medium',
			)
				template(v-for='(v, i) in filters')
					el-radio-button(
						:label='v.k',
					) {{ v.l }}

		//- 主管單位
		el-select(
			key='Unit'
			v-model='unitModel'
			placeholder='主管單位...',
		)
			el-option(
				v-for='(v, i) in units',
				:key='v',
				:label='v',
				:value='v',
			)

		//- list point
		div(v-if='points')
			hr
			splitPages(
				:items='points',
				:isMobile='isMobile',
				:currentPage='currentPage',
				@pageChange="currentPage = $event; $emit('resetScrollTop')",
			)
				template(
					v-slot:default='v',
				)
					div.el-card.is-hover-shadow.item(
						:key='v.itemIdx',
					)
						div.el-card__header.itemHeader
							span {{ `${v['名稱']}` }}
						div.el-card__body
							div.columns
								div.column
									p {{ `${v['限制活動']}` }}
								div.column.columnBtn
									div.btns
										el-button(
											type='primary',
											@click='onClick(v)',
										)
											font-awesome-icon(:icon='["fas", "info"]', fixed-width)
											span 詳細
										el-button(
											type='warning',
											@click='flyTo(v)',
										)
											font-awesome-icon(:icon='["fas", "map-marked-alt"]', fixed-width)
											span 定位

</template>

<script>
import splitPages from '@/components/common/splitPages';
import pageHeader from '@/components/common/pageHeader';
import datePicker from '@/components/common/datePicker';

import resultObstructShootingView from '@/components/result/resultObstructShootingView';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'shootingPanel',
	components: {
		splitPages,
		pageHeader,
		datePicker,
		resultObstructShootingView,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		isShow: {
			type: Boolean,
		},
		Layer: {
			type: Object,
		},
	},
	data: () => {
		let unitMap = {
			center: [
				'交通部觀光局大鵬灣國家風景區管理處',
				'交通部觀光局北海岸及觀音山國家風景區管理處',
				'交通部觀光局東北角暨宜蘭海岸國家風景區管理處',
				'交通部觀光局東部海岸國家風景區管理處',
				'交通部觀光局馬祖國家風景區管理處',
				'交通部觀光局雲嘉南濱海國家風景區管理處',
				'交通部觀光局澎湖國家風景區管理處',
				'海洋國家公園管理處',
				'墾丁國家公園管理處',
			],
			local: [
				'宜蘭縣政府',
				'基隆市政府',
				'新北市政府',
				'新竹市政府',
				'桃園市政府',
				'新竹縣政府',
				'苗栗縣政府',
				'臺中市政府',
				'彰化縣政府',
				'雲林縣政府',
				'臺南市政府',
				'高雄市政府',
				'屏東縣政府',
				'臺東縣政府',
				'花蓮縣政府',
				'金門縣政府',
			],
		};
		let filters = [
			{
				l: '中央',
				k: 'center',
			},
			{
				l: '地方',
				k: 'local',
			},
		];
		return {
			// for filter
			filters: filters,
			filtType: '',

			// for next filter
			units: [],
			unit: '',

			unitMap: unitMap,
			layerToFilt: null,

			points: [], // for listview
			viewPoint: null, // for item detail
			currentPage: 1,
		};
	},
	watch: {
		Layer(newVal, oldVal) {
			console.log(`[Layer] ${oldVal} -> ${newVal}`, this);
		},
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
				console.log('[filtTypeModel]set', this, v);
				this.filtType = v;
				this.updateUnitList();
			},
		},
		unitModel: {
			get() {
				return this.unit;
			},
			set(v) {
				console.log('[unitModel]set', this, v, this.Layer);
				this.unit = v;
				this.updatePointList();
			},
		},
	},
	methods: {
		...mapMutations({
			UPDATE_LAYER_OPTIONS: 'layer/UPDATE_LAYER_OPTIONS',
		}),
		...mapActions({
			closePanel: 'closePanel',
		}),
		updateUnitList() {
			this.units = this.unitMap[this.filtType];
			if (this.unit != '') {
				this.unit = '';
				this.points = [];
			}
		},
		updatePointList() {
			let selectUnit = this.unit;
			let lays = this.layerToFilt?.getLayers() || [];
			let all = lays.map((v, idx) => {
				return v.feature.properties;
			});
			// console.log('[updatePointList]', this, this.layerToFilt, lays, all);
			this.points = all.filter((p) => {
				return p['主管機關'] == selectUnit;
			});
			this.currentPage = 1; // reset page
		},
		onClick(item) {
			console.log('[click]', this, item);
			this.viewPoint = item;
			this.viewPoint.viewtype = 'prohibit';
			// this.$parent.$parent.$parent.$emit('resetScrollTop');
			this.$emit('resetScrollTop');
		},
		goBack() {
			this.viewPoint = null;
			this.$emit('resetScrollTop');
		},
		flyTo(item) {
			if (this.isMobile) this.closePanel();

			const LOffset = !this.isMobile ? this.navWidth : 0;
			// console.log('[flyTo]', this, item);
			const layer = this.layerToFilt?.getLayer(item.__leafletID);
			if (!layer) return;

			// highlight
			this.layerToFilt.deHighLightPath();
			this.layerToFilt.highLightPath([layer]);

			const bound = layer.getBounds();
			if (!bound) return;
			this.$InitIns.map.flyToBounds(bound, {
				padding: [50, 50],
				paddingTopLeft: [LOffset, 0],
				duration: 0.25,
			});
		},
		loadLayerData() {
			const layer = this.$LayerIns.normalLayerCollection.find(
				(l) => l.id == 'f260390e-cd15-4ee5-bfce-2bdf3fd36252', // TODO: not hardcoded
			);
			if (!layer) return;
			console.log('[prohibitPanel]layer', this, layer, this.$LayerIns.isPinned(id));

			// pin & auto load data
			let id = layer.id;
			this.$LayerIns.setPin(id, true);
			if (!layer.visible) {
				this.$LayerIns.setVisible(id, true);
				if (layer.status == 'loading') {
					layer.once('loaded', () => {
						this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
					});
				}
			} else {
				this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
			}
		},
	},
	activated() {
		// console.log('[prohibitPanel]activated()', this, this.isMobile);
		if (this.isShow) this.loadLayerData();
	},
	deactivated() {
		// un-pin layer
		// console.log('[prohibitPanel]deactivated()', this, this.isMobile);
		this.$LayerIns.setPin(this.layerToFilt?.id, false);
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
.el-card.item {
	background-color: #ffffff;
	margin-bottom: 0.5rem;
}
.itemHeader {
	// background:linear-gradient(to bottom, #006588 5%, #004568 100%);
	background-color: #006588;
	color: #ffffff;
}

.column {
	flex-basis: 0;
	flex-grow: 1;
	flex-shrink: 1;
}
.btns {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
}
@media screen and (min-width: 769px) {
	.columns {
		display: flex;
	}
	.columnBtn {
		flex: none;
		width: 25%;
	}
	/deep/ {
		.btns .el-button {
			margin: 0.2rem auto;
		}
	}
}

.flyToButton {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	position: relative;
}

/deep/ {
	.el-card__body {
		padding: 0.5rem 1rem;
	}

	.table {
		display: flex;
		flex-wrap: wrap;
		line-height: 150%;
		margin: 0 0 1rem 0;
		width: 100%;
		.link {
			color: darken($primary, 20);
			font-weight: bold;
			justify-content: flex-start;
		}
		&__col {
			width: auto;
			flex: 1 0 100%;
			display: flex;
			align-items: flex-start;
			box-sizing: border-box;

			transition: all 0.2s ease;
			&:not(:nth-last-of-type(1)) {
				border-bottom: 1px dashed rgba($info, 0.7);
			}
			&:nth-of-type(odd) {
				background-color: rgba($info, 0.1);
			}
			&:hover {
				background-color: rgba($primary, 0.1);
			}

			&__title,
			&__content,
			&__content-file {
				padding: 0.8rem 1rem;
				text-align: left;
			}
			&__title {
				align-self: stretch;
				flex: 0 0 20%;
			}
			&__content {
				flex: 1 1 85%;
				background-color: transparent;
				display: flex;
				flex-direction: column;
				word-break: break-all;
				overflow: hidden;
			}
			&__content-file {
				a {
					margin: 0.5rem 0;
					color: rgba($primary, 1);
					display: flex;
					align-items: center;
				}
			}
		}
	}
}
</style>
