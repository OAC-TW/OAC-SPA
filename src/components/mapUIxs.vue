<template lang="pug">
div
	//- 圖層
	transition(name='slide-fade-up')
		layer(
			v-if='layerCardVisible',
			style='position: fixed; z-index: 999; transition: all ease 0.2s; height: 100%; left: 0; right: 0; margin: 0 auto; max-width: 100%; bottom: 0; top: 0; background: #fff'
		)
			pageHeader(
				slot='header',
				title='海域與遊憩資訊總覽',
				@back='SET_CARD_VISIBLE({ key: "layer", bool: false })'
			)

	//- 可拉動卡片
	pullup(
		ref='pullup',
		:reservedHeight='0',
		:height=90,
		v-model='pullupStatus',
		@move='toggleUIFade(1 - $event)',
		style='z-index: 10; position: absolute; bottom: 0',
		@click.native='$refs.pullup.caculatePullupHeight()'
	) 
		result
		template(slot='fixedFooter')
			.footer
				img(style='width: 120px', src='@/assets/logo.png')
				.footer__r
					.scaleCoordInfo(ref='scaleCoordInfo')
					small(style='margin-left: 0.5rem') 人次 {{ pageviews }}
				.mask(style='z-index: -1; position: absolute; width: 100%')
			layerWeatherTool

	//- CUSTOM CONER UI
	//- .tr
	//- 	toolTopRight(:openTitle='initOpen')
	.tl
		tools
</template> 

<script>
import toolTopRight from '@/components/toolTopRight';
import tools from '@/components/tools';
import pullup from '@/components/pullup';

import result from '@/components/result/result';
import layer from '@/components/layer/layer';
import pageHeader from '@/components/common/pageHeader';

import { mapGetters, mapActions, mapMutations } from 'vuex';
import layerWeatherTool from '@/components/layer/layerWeatherTool';

export default {
	name: 'mapuixs',
	props: {
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
		pageHeader,
		pullup,
		tools,
		layer,
		layerWeatherTool,
		toolTopRight,
	},
	computed: {
		layerCardVisible() {
			return this.$store.state.layerCardVisible;
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
	},
	mounted() {
		this.uiDoms = document.querySelectorAll('.tr,.tl');
		this.$InitIns.mountScaleDom(this.$refs.scaleCoordInfo);
		/** subscribe SET_CARD_VISIBLE  to toggleUp pullup card */
		this.$store.subscribe(async (mutation, state) => {
			if (mutation.type === 'SET_CARD_VISIBLE') {
				const { key, bool } = mutation.payload;
				if (key !== 'result') return;
				const pullup = await new Promise((res) =>
					this.$nextTick(() => res(this.$refs.pullup))
				);
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
.footer {
	position: relative;
	padding: 0 0.5rem 1rem 0.5rem;
	display: flex;
	align-items: center;
	justify-content: space-between;
	&__r {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: #fff;
	}
}

/**
	.content-card 
	*/
.content-card {
	border-top-right-radius: 1rem !important;
	border-bottom-right-radius: 1rem !important;
	will-change: width;
	position: fixed;
	z-index: 999;
	top: 0;
	left: 0;
	bottom: auto;
	right: auto;
	width: 450px;
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
.tl {
	position: absolute;
	z-index: 2;
	top: 2rem;
	bottom: auto;
	& > * {
		position: relative;
	}
}
.tl {
	// left: 1rem;
	// right: auto;
	right: 0;
	left: auto;
}
.tr {
	left: auto;
	right: 1rem;
}

.result {
	position: relative;
	&__num {
		position: absolute;
		right: -2%;
		top: 1%;
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

.layerTool {
	width: 100%;
	height: 10vh;
	border-top-right-radius: 1rem;
	border-top-left-radius: 1rem;
	padding-bottom: 2rem;
	pointer-events: auto;
	background-color: rgba($black, 0.7);
	color: #fff;
	transition: all 0.2s ease;
	&__item {
		margin: 0 1rem;
		display: flex;
		align-items: space-between;
		flex-direction: column;
		justify-content: center;
	}
}
</style>
