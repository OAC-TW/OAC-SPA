<template lang="pug">
div
	//- 歷史紀錄才顯示
	pageHeader(
		v-if='!isMobile',
		:title='newAdd.length ? "查詢結果" : "歷史紀錄"',
		@back='back',
		right2left=true,
	)
		div(v-if='!newAdd.length')
			el-button(
				style='color: red; padding-right: 0',
				icon='el-icon-delete',
				type='text',
				round,
				size='mini',
				slot='prepend',
				@click='DELETE_RESULT(null)'
			) 全部清空

	div(v-if='newAdd.length')
		.table(v-for='i in newAdd')
			div(
				style='display: flex; justify-content: space-between; align-items: center; width: 100%'
			)
				h2(style='display: flex; align-items: center')
					el-tag(size='small') {{ i.layerCatelog.map((c) => c.label).join("、") }}
					el-divider(direction='vertical')
					| {{ resultTitle(i) }}
				el-button(@click='locate(i)', type='primary', plain, size='mini', circle)
					font-awesome-icon(icon='map-marker-alt', fixed-width)
			component(v-bind:is='resultView(i)', :data='i.data')

		div(style='text-align: center; position: sticky; bottom: 1rem')
			el-button(
				style='box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.1)',
				type='primary',
				round,
				size='small',
				@click='INIT_NEWADD'
			)
				font-awesome-icon(icon='stream', fixed-width, transform='left-4')
				span 檢視紀錄

	template(v-else)
		.sticky-header(v-if='!dataId', style='text-align: right')
			el-button(
				v-if='isMobile',
				style='color: red; padding-right: 0',
				type='text',
				round,
				size='mini',
				slot='prepend',
				@click='DELETE_RESULT(null)',
				icon='el-icon-delete'
			) 全部清空
			resultTabbar(:tabsNames='tabsNames', v-model='activeName')

		//- 內容
		transition(name='fade')
			resultScrollList(:data='dataModel')
				template(slot='body', slot-scope='scope')
					resultScrollListItem(
						:data='scope.singleCaseData.data',
						@fetchDetail='openDetail(scope.singleCaseData.dataId)',
						@delete='DELETE_RESULT(scope.singleCaseData.dataId)',
						@locate='locate(scope.singleCaseData)'
					)
						template(slot='title') 
							div(
								:is='dataId ? "h2" : "big"',
								style='display: flex; align-items: center'
							) 
								template(v-if='activeName === "全部" || dataId')
									el-tag(size='small', effect='dark') {{ scope.singleCaseData.layerCatelog.map((i) => i.label).join("、") }}
									el-divider(direction='vertical')
								div(v-marquee='{width:"100%"}') {{ resultTitle(scope.singleCaseData) }}

						template(slot='detail')
							component(
								v-if='dataId',
								v-bind:is='resultView(scope.singleCaseData)',
								:data='scope.singleCaseData.data'
							)

		div(style='text-align: center; position: sticky; bottom: 1rem')
			el-button(
				style='box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.1)',
				v-if='dataId',
				size='small',
				type='primary',
				round,
				title='返回列表',
				@click='back'
			) 
				font-awesome-icon(icon='stream', fixed-width, transform='left-4')
				span 回到列表
		p
			small 查詢結果僅供參考 - 正確資料應以提供單位為準
</template>

<script>
import resultTabbar from './resultTabbar';
import resultScrollList from './resultScrollList';
import resultScrollListItem from './resultScrollListItem';
import { marquee } from '@/directives/directives';
import pageHeader from '@/components/common/pageHeader';

import law from './law';
import resultDefaultView from './resultDefaultView';
import resultRiskView from './resultRiskView';
import resultObstructShootingView from './resultObstructShootingView';

import { mapGetters, mapMutations, mapActions } from 'vuex';

export default {
	name: 'result',
	directives: {
		marquee,
	},
	components: {
		resultTabbar,
		resultScrollList,
		resultScrollListItem,
		pageHeader,
		law,
	},
	props: {
		locateLTOffset: {
			// 定位時偏移 [left,top]
			type: Array,
		},
	},
	data: () => ({
		activeName: '全部',
		dataId: '',
	}),
	computed: {
		...mapGetters({
			isMobile: 'isMobile',
			history: 'result/history',
			newAdd: 'result/newAdd',
			tabsNames: 'result/tabsNames' /** {id,title} */,
		}),
		dataModel() {
			let data = [];

			if (this.activeName === '全部') {
				Object.values(this.history()).forEach((arr) => {
					arr.forEach((i) => {
						if (!data.some((ei) => ei.dataId === i.dataId)) {
							data.push(i);
						}
					});
				});
				console.log('[result dataModel all]', data);
			} else {
				const obj = this.tabsNames.find((t) => t.title === this.activeName);
				console.log('[result dataModel of ]', obj);
				if (obj) data = this.history(obj.id);
			}

			if (this.dataId) {
				data = data.filter((i) => i.dataId === this.dataId);
			}

			return data;
		},
	},
	methods: {
		resultSubTitle(appendProp, data) {
			if (!Array.isArray(appendProp)) return data[appendProp];
			for (let i = 0; i < appendProp.length; i++) {
				let val = data[appendProp[i]];
				if (val !== null && val !== undefined) return val;
			}
		},
		resultTitle(res) {
			let layer = this.$LayerIns.normalLayerCollection.find(
				(l) => l.id == res.layerId,
			);
			if (layer?.appendProp) {
				let subtitle = this.resultSubTitle(layer.appendProp, res.data);
				return `${res.layerTitle} - ${subtitle}`;
			}
			return res.layerTitle;
		},
		resultView(res) {
			let layer = this.$LayerIns.normalLayerCollection.find(
				(l) => l.id == res.layerId,
			);
			// console.log('[resultView]0', this, res, layer);
			if (layer) {
				let type2comp = {
					law: law,
					'': resultDefaultView,
					'arearisk': resultRiskView,
					'obstruct': resultObstructShootingView,
					'shooting': resultObstructShootingView,
					'prohibit': resultObstructShootingView,
				};
				res.data.viewtype = layer.template;
				let comp = type2comp[layer.template];
				// console.log('[resultView]', this, res, layer, comp);
				return comp ? comp : resultDefaultView;
			}
			return resultDefaultView;
		},
		...mapMutations({
			DELETE_RESULT: 'result/DELETE_RESULT',
			INIT_NEWADD: 'result/INIT_NEWADD',
			SET_CARD_VISIBLE: 'SET_CARD_VISIBLE',
			UPDATE_LAYER_OPTIONS: 'layer/UPDATE_LAYER_OPTIONS',
		}),
		locate(evt) {
			// 定位時連動打開圖層可視
			this.UPDATE_LAYER_OPTIONS({
				id: evt.layerId,
				payload: { visible: true },
			});

			// let dom = document.querySelector('.content-card');
			let dom = document.querySelector('.navbar');
			const LOffset = (dom && !this.isMobile) ? dom.clientWidth : 0;
			evt.goTo({
				duration: 0.25,
				paddingTopLeft: [LOffset, 0] /** [left,top] */,
			});
		},
		openDetail(dataId) {
			this.dataId = dataId;
		},
		back() {
			if (this.dataId) {
				this.dataId = '';
			} else {
				this.SET_CARD_VISIBLE({ key: 'result', bool: false });
			}
		},
	},
};
</script>

<style lang="scss" scoped>
.sticky-header {
	position: sticky;
	top: -1px;
	z-index: 99;
	background-color: $aux;
	box-sizing: border-box;
	margin: 0 -1rem;
	padding: 0 1rem 1rem 1rem;
	&__operator {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
}
/deep/ {
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
