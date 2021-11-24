<template lang="pug">

//- view data
div(v-if='viewPoint')
	pageHeader(
		:title='viewPoint.CName',
		@back='goBack',
		:useBack='true',
	)
		el-button(circle, @click='flyTo(viewPoint)')
			.flyToButton
				font-awesome-icon(icon='map-marker-alt', fixed-width, size='2x')
	sightseeingSpot(
		v-bind='viewPoint',
		@flyTo='flyTo(viewPoint)',
	)
		template(slot='header') {{ '' }}


//- filter
div.content(v-else)
	div(
		style='display: flex;',
		v-if='!Type'
	)
		el-radio-group(
			style='margin: 0 auto;user-select: none;',
			v-model='filtTypeModel',
			size='medium',
		)
			template(v-for='(v, i) in filters')
				el-radio-button(
					:label='v.k',
				) {{ v.l }}
		hr

	div(v-if='filtType')
		el-checkbox-group(
			style='justify-content: center;display: flex;flex-wrap: wrap;',
			v-model='activeRegionModel',
			size='medium',
		)
			template(v-for='(v, i) in regions')
				el-checkbox(
					:label='v.k',
					border,
				) {{ v.l }}

	//- 縣市
	div(v-if='activeRegion.length && filtType =="region"')
		hr
		el-select(
			key='County'
			v-model='activeCountyModel'
			multiple,
			placeholder='縣市...',
		)
			el-option(
				v-for='(v, i) in countries',
				:key='v',
				:label='v',
				:value='v',
			)

	//- 活動
	div(v-if='activeRegion.length && filtType =="activity"')
		hr
		el-select(
			key='Activity'
			v-model='activeActivityModel'
			multiple,
			placeholder='遊憩活動種類...',
		)
			el-option(
				v-for='(v, i) in activities',
				:key='v',
				:label='activityMap[v]',
				:value='v',
			)
				span.icon
					img(:src='activitieIconUrl(v)', :alt='activityMap[v]')
					| {{ activityMap[v] }}

	hr

	//- TODO: i18n
	div(v-if='!points.length')
		p.warningText 從事水域活動前，務必先詳細閱讀當地政府相關規定，並評估自身能力及注意安全。

	//- list point
	div(v-if='points.length')
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
						span {{ `${v.Zone} ${v.County} - ${v.CName}` }}
					div.el-card__body
						div.columns
							div.column
								p {{ `座標: ${v.Px}, ${v.Py}` }}
								p(v-if='v.CAdd') {{ `地址: ${v.CAdd}` }}
								p(v-if='v.Opentime') {{ `開放時間: ${v.Opentime}` }}
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

import sightseeingSpot from '@/components/result/sightseeingSpot';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'relaxationRegPanel',
	components: {
		splitPages,
		pageHeader,
		sightseeingSpot,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		Layer: {
			type: Object,
		},
		Type: {
			type: String,
		},
	},
	data: () => {
		let filters = [
			{
				l: '區域',
				k: 'region',
			},
			{
				l: '活動',
				k: 'activity',
			},
		];
		let regions = [
			{
				l: '北部',
				k: '北部地區',
			},
			{
				l: '中部',
				k: '中部地區',
			},
			{
				l: '南部',
				k: '南部地區',
			},
			{
				l: '東部',
				k: '東部地區',
			},
			{
				l: '金馬澎',
				k: '金馬澎地區',
			},
		];
		return {
			filters: filters,
			filtType: '',

			regions: regions,
			// activeRegion: [],
			activeRegion: regions.map(v => v.k), // default to all

			// for next filter
			points0: [],

			// by County
			countries: [],
			activeCounty: [],

			// by Activity
			activities: [],
			activeActivity: [],
			activityEdit: true,

			points: [], // for listview
			viewPoint: null, // for item detail
			highlight: null, // point which highlighted
			currentPage: 1,

			// TODO: i18n
			activityMap: Object.freeze({
				1: '獨木舟',
				2: '風帆船',
				3: '船釣',
				4: '遊艇',
				5: '快艇',
				6: '帆船',
				7: '水上摩托車',
				8: '水面飛行傘',
				9: '滑水/香蕉船/水面飛行艇',
				10: '海上拖曳傘',
				11: '大型風箏',
				12: '游泳',
				13: '水上腳踏車',
				14: '橡皮艇(非動力)',
				15: '風浪板',
				16: '衝浪',
				17: '釣客/垂釣',
				18: '岸際遊覽',
				19: '海邊露營',
				20: '浮潛',
				21: '水肺潛水(岸潛)',
				22: '水肺潛水(船潛)',
				23: '玻璃底船',
				24: '賞鯨',
				25: '跳水',
				26: '開放沙灘',
				27: '開放所有海域活動',
				28: '禁止所有海域活動',
				29: '立槳',
			}),
		};
	},
	watch: {
		Layer(newVal, oldVal) {
			console.log(`[Layer] ${oldVal} -> ${newVal}`, this);
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
				this.updateCache();
			},
		},
		activeRegionModel: {
			get() {
				return this.activeRegion;
			},
			set(v) {
				// console.log('[activeRegionModel]set', this, v, this.Layer);
				this.activeRegion = v;
				let all = this.Layer.data.features.map((v, idx) => {
					return v.properties;
				});
				this.points0 = all.filter((p) => {
					return v.indexOf(p.Zone) >= 0;
				});
				this.updateCache();
				console.log('[points]', this, v, this.Layer, this.points, all);
			},
		},
		activeCountyModel: {
			get() {
				return this.activeCounty;
			},
			set(v) {
				this.activeCounty = v;
				this.updatePointList();
				console.log('[activeCounty]set', this, v, this.points0, this.points);
			},
		},
		activeActivityModel: {
			get() {
				return this.activeActivity;
			},
			set(v) {
				this.activeActivity = v;
				this.updatePointList();
				console.log('[activeActivity]set', this, v, this.points0, this.points);
			},
		},
	},
	methods: {
		...mapActions({
			closePanel: 'closePanel',
		}),
		padding(n) {
			if (n < 10) return '0' + n;
			return n;
		},
		activitieIconUrl(id) {
			let ext = 'svg';
			if (id == 29) ext = 'png';
			return `./icons_activities/${this.padding(id)}-b.${ext}`;
		},
		updateCache() {
			if (this.filtType == 'region') {
				this.updateCountyList();
			}
			if (this.filtType == 'activity') {
				this.updateActivityList();
			}
			this.updatePointList();
		},
		updatePointList() {
			if (this.filtType == 'region') {
				let v = this.activeCounty;
				this.points = this.points0.filter((p) => {
					return v.indexOf(p.County) >= 0;
				});
			}
			if (this.filtType == 'activity') {
				let out = [];
				this.activeActivity.forEach((id) => {
					this.points0.forEach((v, idx) => {
						let arr = v.CoastalAct || v.CoastalActivities || '';
						let exist = arr.split(',').indexOf(id);
						if (exist >= 0) out.push(v);
					});
				});
				this.points = out;
			}
			this.currentPage = 1; // reset page
			this.points.sort((a, b) => {
				const cmpA = `${a.Zone} ${a.County} ${a.CName}`;
				const cmpB = `${b.Zone} ${b.County} ${b.CName}`;
				return cmpA.localeCompare(cmpB, undefined, { numeric: true });
			});
		},
		updateCountyList() {
			let countries = {};
			this.points0.forEach((v) => {
				countries[v.County] = true;
			});
			this.countries = Object.keys(countries);

			// clear if not exist
			let newActiveCounty = [];
			this.countries.forEach((v, i) => {
				let idx = this.activeCounty.indexOf(v);
				if (idx >= 0) newActiveCounty.push(v);
			});
			this.activeCounty = newActiveCounty;
		},
		updateActivityList() {
			let activities = new Map();
			this.points0.forEach((v, idx) => {
				let arr = v.CoastalAct || v.CoastalActivities || '';
				arr.split(',').forEach((act) => {
					if (!act) return;
					let arr = activities.get(act);
					if (arr) {
						arr.push(v);
					} else {
						activities.set(act, [v]);
					}
				});
			});
			this.activities = Array.from(activities.keys()).sort();

			// clear if not exist
			this.activeActivity.forEach((v) => {
				let idx = this.activities.indexOf(v);
				if (idx < 0) this.activeActivity.splice(idx, 1);
			});
		},
		onClick(item) {
			console.log('[click]', this, item);
			this.viewPoint = item;
			this.$emit('resetScrollTop');
		},
		goBack() {
			this.viewPoint = null;
			this.$emit('resetScrollTop');
		},
		clearHighlight() {
			if (!this.highlight) return;
			const icon0 = this.Layer.getIconVM()();
			this.highlight.setIcon(icon0);
		},
		flyTo(item) {
			console.log('[flyTo]', this, item);
			if (this.isMobile) this.closePanel();

			// clear old style
			this.clearHighlight();

			const icon = this.Layer.getIconVM()(true);
			const layerGroup = this.Layer.markerClusterGroup;
			const marker = layerGroup.getLayer(item.__leafletID);

			// set highlight style
			marker.setIcon(icon);

			// fly
			layerGroup.zoomToShowLayer(marker, () => {
				const LOffset = !this.isMobile ? this.navWidth : 0;
				const map = this.$InitIns.map;
				map.panTo(marker.getLatLng(), map.getZoom(), {
					animate: false,
					duration: 0.25,
					paddingTopLeft: [LOffset, 0], // fitBounds,flyToBounds [left, top]
				});
				layerGroup.zoomToShowLayer(marker);
			});

			// keep reference
			this.highlight = marker;
		},
	},
	created() {
		console.log('[relaxationRegPanel]created()', this, this.isMobile, this.Type);
		if (this.Type) {
			this.filtTypeModel = this.Type;
		}
		this.activeRegionModel = this.activeRegion; // trigger update
	},
	mounted() {
		console.log('[relaxationRegPanel]mounted()', this, this.isMobile, this.Type);
	},
	deactivated() {
		console.log('[relaxationRegPanel]deactivated()', this, this.isMobile, this.Type);
		this.clearHighlight();
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
.warningText {
	text-align: center;
	color: #f00;
	font-weight: 500;
	font-size: 1.5rem;
}
.icon > img {
	height: 32px;
	margin: 0 0.5rem;
	vertical-align: bottom;
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
	.el-select-dropdown__item {
		margin: 0.3rem 0;
	}
	.el-checkbox.is-bordered {
		margin-right: 0.1rem;
	}
	.el-checkbox.is-bordered.is-checked {
		background-color: $primary;
		.el-checkbox__label {
			color: $white;
		}
	}
	.el-checkbox__input {
		display: none;
	}
	.el-card__body {
		padding: 0.5rem 1rem;
	}

	/* .el-input placeholder color change */
	.el-input__inner::placeholder{
		color: #4b49b7;
	}
}
</style>
