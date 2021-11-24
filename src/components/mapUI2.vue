<template lang="pug">
div
	//- desktop
	template(v-if='!isMobile')
		transition(name='slide-fade-right2left', mode='out-in')
			//- 圖層操作
			el-card.content-card(v-if='layerCardVisible')
				layer(
					key='layer',
					:AutoScroll='layerCardAutoScroll',
				)
					pageHeader(
						slot='header',
						title='海域遊憩資訊總覽',
						@back='SET_CARD_VISIBLE({ key: "layer", bool: false })',
						right2left=true,
					)

			//- 查詢結果
			el-card.content-card(v-if='resultCardVisible', v-resize="'r2l'")
				result

			//- 底圖設定
			el-card.content-card(v-if='baseMapCardVisible')
				layerBaseMap()
					pageHeader(
						slot='header',
						title='底圖設定',
						@back='SET_CARD_VISIBLE({ key: "baseMap", bool: false })',
						right2left=true,
					)

		.br
			layerWeatherTool
			div(
				style='display: flex; align-items: center; justify-content: flex-end; margin-top: 1rem'
			)
				.scaleCoordInfo(ref='scaleCoordInfo')
				small(style='margin-left: 1rem; color: #fff') 人次 {{ pageviews }}
		//- a.bl(href='./')
		//- 	img(style='max-width: 180px', src='@/assets/logo.png')
		.mask(style='height: 50px;')

	//- mobile
	template(v-else)
		//- 圖層
		transition(name='slide-fade-up')
			layer(
				v-if='layerCardVisible',
				:AutoScroll='layerCardAutoScroll',
				style='position: absolute; z-index: 999; transition: all ease 0.2s; height: 100%; left: 0; right: 0; margin: 0 auto; max-width: 100%; bottom: 0; top: 0; background: #fff',
			)
				pageHeader(
					slot='header',
					title='海域遊憩資訊總覽',
					@back='SET_CARD_VISIBLE({ key: "layer", bool: false })',
					right2left=true,
				)

		transition(name='slide-fade-up')
			layerBaseMap(
				v-if='baseMapCardVisible',
				style='position: absolute; z-index: 999; transition: all ease 0.2s; height: 100%; left: 0; right: 0; margin: 0 auto; max-width: 100%; bottom: 0; top: 0; background: #fff',
			)
				pageHeader(
					style='margin-top: 1rem;',
					slot='header',
					title='底圖設定',
					@back='SET_CARD_VISIBLE({ key: "baseMap", bool: false })',
					right2left=true,
				)

		//- 可拉動卡片
		pullup(
			ref='pullup',
			:reservedHeight='0',
			:height=90,
			v-model='pullupStatus',
			@move='toggleUIFade(1 - $event)',
			style='z-index: 20; position: absolute; bottom: 0',
			@click.native='$refs.pullup.caculatePullupHeight()'
		) 
			result
			template(slot='fixedFooter')
				.footerMobile
					//- img(style='width: 120px', src='@/assets/logo.png')
					.footerMobile__r
						.scaleCoordInfo(ref='scaleCoordInfo')
						small(style='margin-left: 0.5rem') 人次 {{ pageviews }}
					.mask(style='z-index: -1; position: absolute; width: 100%;height: 50px;')
				layerWeatherTool

	//- CUSTOM CONER UI
	//- .tr
	//- 	toolTopRight(:openTitle='initOpen')
	.tl
		tools
</template>

<script>
import Vue from 'vue';

import result from '@/components/result/result';
import layer from '@/components/layer/layer';
import layerBaseMap from '@/components/layer/layerBaseMap2';
import pullup from '@/components/pullup';
import tools from '@/components/tools';
import toolTopRight from '@/components/toolTopRight';

import { mapGetters, mapActions, mapMutations } from 'vuex';
import pageHeader from '@/components/common/pageHeader';
import { resize } from '@/directives/directives';

import layerWeatherTool from '@/components/layer/layerWeatherTool';

export default {
	name: 'mapui',
	directives: {
		resize,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
		openTitle: {
			type: String,
		},
	},
	data: () => ({
		layerToolVisible: false,
		//- pullup 目前所處位置
		pullupStatus: 'close',
		//- uiDoms - pullup 以外的 DOM
		uiDoms: null,
	}),
	components: {
		result,
		layer,
		layerBaseMap,
		pageHeader,
		pullup,
		tools,
		toolTopRight,
		layerWeatherTool,
	},
	watch: {
		isMobile: function(newVal, oldVal) {
			if (newVal !== oldVal) {
				console.log('Prop changed: ', newVal, ' | was: ', oldVal);
				this.$nextTick(() => {
					this.initDom();
				});
				if (!newVal) this.toggleUIFade(1);
			}
		},
	},
	computed: {
		resultCardVisible() {
			return this.$store.state.resultCardVisible;
		},
		layerCardVisible() {
			return this.$store.state.layerCardVisible;
		},
		layerCardAutoScroll() {
			return this.$store.state.layerCardAutoScroll;
		},
		baseMapCardVisible() {
			return this.$store.state.baseMapCardVisible || false;
		},
		pageviews() {
			return this.$store.state.GACount.pageviews;
		},
		initOpen() {
			return this.openTitle;
		},
	},
	methods: {
		...mapMutations(['SET_CARD_VISIBLE']),
		/** UI 隨資訊卡片上下拉動 淡出、入 @overload +1 */
		toggleUIFade(boolOrNumber) {
			if (!this.uiDoms) return;
			this.uiDoms.forEach((el) => {
				if (typeof boolOrNumber === 'number') {
					// 依據 pull 高度變動(比例)回傳的透明度
					const opacity = boolOrNumber;
					el.style.opacity = opacity;
					el.style.visibility = opacity ? 'visible' : 'hidden';
				} else if (typeof boolOrNumber === 'boolean') {
					// 依據 指定布林
					const bool = boolOrNumber;
					this._fadeTransition(el, bool);
				}
			});
		},
		/** UI 淡出、入 */
		_fadeTransition(element, bool) {
			let nativeFade = (target) => {
				let op = 1;
				let inc = -0.15;
				if (bool) {
					op = 0;
					inc = 0.1;
				}
				let timer = setInterval(() => {
					op += inc;
					target.opacity = op;
					if (bool && op > 0) {
						target.visibility = 'visible';
						op >= 1 && clearInterval(timer);
					} else if (!bool && op <= 0) {
						target.visibility = 'hidden';
						clearInterval(timer);
					} else {
						inc += inc;
					}
				}, 25);
			};
			nativeFade(element.style);
		},
		initDom() {
			this.$InitIns.unmountScaleDom(this.ScaleRef);
			this.ScaleRef = this.$InitIns.mountScaleDom(this.$refs.scaleCoordInfo);

			this.$InitIns.unmountCoordDom(this.CoordRef);
			this.CoordRef = this.$InitIns.mountCoordDom(this.$refs.scaleCoordInfo);

			this.uiDoms = document.querySelectorAll('.tr,.tl');
			console.log('[initDom]', this, this.uiDoms, this.$refs.scaleCoordInfo);
		},
	},
	mounted() {
		this.initDom();
		/** subscribe SET_CARD_VISIBLE  to toggleUp pullup card */
		this.$store.subscribe(async (mutation, state) => {
			if (mutation.type === 'SET_CARD_VISIBLE') {
				const { key, bool } = mutation.payload;
				if (key !== 'result') return;
				const pullup = await new Promise((res) =>
					this.$nextTick(() => res(this.$refs.pullup)),
				);
				if (!pullup) return;
				if (bool) {
					pullup.toggleUp();
					pullup.caculatePullupHeight();
				} else {
					pullup.toggleDown();
					this.pullupStatus = 'close';
				}
			}
		});
	},
};
</script>

<style lang="scss" scoped>
.footerMobile {
	position: relative;
	padding: 0 0.5rem 1rem 0.5rem;
	display: flex;
	align-items: center;
	// justify-content: space-between;
	justify-content: flex-end;
	&__r {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #fff;
	}
}

/**	.content-card 	*/
.content-card {
	will-change: width;
	position: absolute;
	z-index: 999;
	top: 0;
	left: auto;
	bottom: auto;
	right: 0;
	width: 420px;
	height: 100%;
	overflow-y: auto !important;
	/deep/ {
		& > .el-card__body {
			//- for layer sorting
			height: 100%;
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
		}
	}
}

.tr,
.tl,
.br,
.bl {
	position: absolute;
	z-index: 2;
	& > * {
		position: relative;
	}
}
.tr,
.tl {
	top: 1rem;
	bottom: auto;
}
.br,
.bl {
	top: auto;
	bottom: 1rem;
}
.tl,
.bl {
	// left: 1rem;
	// right: auto;
	right: 0;
	left: auto;
}
.tr,
.br {
	left: auto;
	right: 1rem;
}

.tools {
	display: flex;
	flex-direction: column;
	button {
		margin: 0.5rem 0;
		box-shadow: 0 0 8px 4px rgba(0, 0, 0, 0.15);
		width: 2.8rem;
		height: 2.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
}

.result {
	position: relative;
	&__num {
		position: absolute;
		right: -0.5rem;
		top: 0;
		background-color: darken($info, 10);
		color: #fff;
		width: 1.1rem;
		height: 1.1rem;
		text-align: center;
		border-radius: 100%;
		font-size: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		&--active {
			background-color: darken($danger, 10);
			color: #fff;
		}
	}
}

.header {
	margin: 1rem;
}
</style>
