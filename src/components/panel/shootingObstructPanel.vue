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
		//- 年月選擇
		datePicker(
			v-model='selectDateRangeModel',
			:initDate='initDate',
			:isMobile='isMobile',
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
							span {{ `${v['Category']} - ${v['Announce']}` }}
						div.el-card__body
							div.columns
								div.column
									p {{ `單位: ${v['Unit']}` }}
									p(v-if='!v["時間"]') {{ `日期時間: ${formatDate(v['date'])}` }}
									p(v-if='v["時間"]') {{ `日期: ${formatDate(v['date'], true)}` }}
									p(v-if='v["時間"]') {{ `時間: ${v['時間']}` }}
									p {{ v['Cause'] || '' }}
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

function padding(n) {
	return (n < 10)? `0${n}` : `${n}`;
}

export default {
	name: 'shootingObstructPanel',
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
		layerUUID: {
			type: String,
		},
		viewType: {
			type: String,
		},
	},
	data: () => {
		let now = new Date();
		let dd = padding(now.getDate());
		let mm = padding(now.getMonth() + 1);
		let yyyy = now.getFullYear();
		let initDate = `${yyyy}/${mm}/${dd}`; // "2021/04/01"
		// let mmStr = `${yyyy}/${(mm < 10)? '0' + mm: mm}`;
		// let lastDayOfMonth = new Date(yyyy, mm, 0).getDate();
		// let initDate = `${mmStr}/01-${mmStr}/${lastDayOfMonth}`; // "2021/04/01-2021/04/30"
		return {
			// for filter
			initDate: initDate,
			selectDateRange: [],
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
		datePicker() {
			return datePicker;
		},
		selectDateRangeModel: {
			get() {
				return this.selectDateRange;
			},
			set(v) {
				// console.log('[selectDateRange]set', this, v, datePicker);
				this.selectDateRange = v;
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
		formatDate(timeStr, dateOnly) {
			return datePicker.formatDate(timeStr, dateOnly);
		},
		createFilterFn() {
			const selectDateRange = this.selectDateRange;
			return (feature) => {
				const match = datePicker.filterByTime([feature.properties], selectDateRange);
				// console.log('[filter]', feature, feature.properties, match);
				return match.length > 0;
			};
		},
		updatePointList() {
			this.layerToFilt?.setFilter(this.createFilterFn()); // set filter
			let lays = this.layerToFilt?.getLayers() || []; // .getLayers() will affected by filter
			let all = lays.map((v, idx) => {
				return v.feature.properties;
			});
			// console.log('[updatePointList]', this, this.layerToFilt, lays, all);
			// this.points = datePicker.filterByTime(all, this.selectDateRange);
			this.points = all;
			this.currentPage = 1; // reset page
		},
		onClick(item) {
			console.log('[click]', this, item);
			this.viewPoint = item;
			this.viewPoint.viewtype = this.viewType;
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
				(l) => l.id == this.layerUUID, // TODO: not hardcoded
			);
			if (!layer) return;
			console.log('[shootingObstructPanel]layer', this, layer, this.$LayerIns.isPinned(id));

			// pin & auto load data
			let id = layer.id;
			this.$LayerIns.setPin(id, true);
			if (!layer.visible) {
				this.$LayerIns.setVisible(id, true);
				if (layer.status == 'loading') {
					layer.once('loaded', () => {
						this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
						this.updatePointList();
					});
				}
			} else {
				this.layerToFilt = Object.assign(layer, { _isVue: true }); // hacky for no proxy
				this.updatePointList();
			}
		},
	},
	activated() {
		console.log('[shootingObstructPanel]activated()', this, this.isMobile, this.isShow);
		if (this.isShow) this.loadLayerData();
	},
	deactivated() {
		// un-pin layer
		console.log('[shootingObstructPanel]deactivated()', this, this.isMobile, this.isShow);
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
