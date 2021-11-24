<template lang="pug">
transition(name="slide-fade-up" mode="out-in")
	div
		//- Mobile style - time wheel
		template(v-if="isMobile && DATES.length > 1")
			div(v-loading="loading" )
				.scroll-label(:style="loading?'opacity:0.7;':'opacity:1;'") 
					strong {{currentDateTimeString}}
					.scroll-label__pointer
			.scroll
				.scroll__wrapper(ref="bsScroll")
					.scroll__content(
						ref='bsScrollContent',
						:style='`padding: 0 ${screenWidth / 2}px`',
					)
						.scroll__item(
							v-for="o in DATES_MOBILE_MODEL" 
							:key="o.label"
						)
							strong(style="display:block;margin:0.5rem 0;") {{o.label}}
							span(v-for="h in o.hours" ref="timeScale" style="padding-right:0.5rem;padding-left:0.5rem;") {{ padding(h) }}

		//- Default style - time slider
		.timeSilder(
			v-else-if="DATES.length > 1" 
			key="timeSilder"
		)
			div(style="display:flex;align-items:center;position: absolute;right: 0;bottom: 1rem;")
				.custom-tooltip( v-loading="loading" style="display:flex;") 
					el-button(icon="el-icon-caret-left" type="text" style="padding:0;" :disabled="loading || valueModel===0" @click="valueModel-=1")
					span(:style="loading?'opacity:0.3;':'opacity:1;'") {{ currentDateTimeString }}
					el-button(icon="el-icon-caret-right" type="text" style="padding:0;" :disabled="loading || valueModel===DATES.length-1" @click="valueModel+=1")
			
				div
					VueSlider(
						ref="VueSlider"
						class="VueSlider"
						style="width: 60vw;max-width: 650px;"
						v-model="valueModel"
						v-bind="options"
						@mouseenter.native="mouseEnter"
						@mousemove.native="mouseMove"
						@mouseleave.native="mouseLeave"
						@drag-start="hoverTooltipVisibility= false"
						@drag-end="hoverTooltipVisibility= true"
						@click.native="value=hoverDateIndex?hoverDateIndex:0"
					)
						small(
							v-if="hoverTooltipVisibility"
							:style="customTooltipStyle" 
							ref="hoverCaption"
						) {{hoverTimeString}}

		//- 圖例
		.legend(
			v-if="legendVisible"
			:style="isMobile?'border-radius:0;':''"
			key="legend"
		) 
			small.legend__title(v-if="legend.label") {{legend.label}}
			.legend__row(:style="legendGradient")
				small.legend__row__text(v-for="label in legendScaleLabel") {{isNaN(label)?label:Number(label)}}

</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
/** @see https://nightcatsama.github.io/vue-slider-component/#/zh-CN/advanced/components-slots */
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';
import BScroll from 'better-scroll';

export default {
	name: 'layerWeatherTool',
	components: {
		VueSlider,
	},
	props: {},
	data: () => ({
		value: 0,
		timer: null,
		loading: false,
		//
		hoverTooltipVisibility: false,
		hoverTimeString: '',
		hoverDateIndex: 0,
		hoverTooltipOffsetX: 0,
		//
		BScrollInstance: null,
	}),
	watch: {
		DATES: {
			async handler(dates) {
				/** init to start */
				this.valueModel = 0;
				this.BScrollInstance && this.BScrollInstance.scrollTo(0, 0);

				if (dates.length <= 1) {
					this.BScrollInstance && this.BScrollInstance.destroy();
					return;
				}
				// await this.ininMobileScroll();
				if (this.BScrollInstance) {
					// refresh after data render
					this.$nextTick(() => {
						this.BScrollInstance.refresh();
					});
				} else {
					await this.ininMobileScroll();
				}
			},
		},
	},
	computed: {
		...mapGetters({
			isMobile: 'isMobile',
			screenWidth: 'screenWidth',
		}),
		//** legend */
		legendGradient() {
			let gArr = [];
			const avg = 100 / (this.legend.colorScaleValue.length - 1);
			let cnt = 0;
			this.legend.colorScaleValue.forEach((color) => {
				gArr.push(`${color} ${cnt}%`);
				cnt += avg;
			});
			return {
				background: `linear-gradient(90deg,${gArr.join(',')})`,
			};
		},
		legend() {
			return this.$store.state.layer.legend;
		},
		legendVisible() {
			return (
				this.legend.colorScaleLabel.length && this.legend.colorScaleValue.length
			);
		},
		legendScaleLabel() {
			const legend = this.legend;
			//console.log("[legendScaleLabel]", legend)
			if (legend.type === 'text' && legend.colorScaleLabelName) {
				const { colorScaleLabel, colorScaleLabelName } = legend;
				return colorScaleLabel.map((i) => colorScaleLabelName[i]);
			}
			return legend.colorScaleLabel;
		},
		currentDateTimeString() {
			return this.getUnionDateString(this.value);
		},
		//** timeSlider */
		customTooltipStyle() {
			let defaultStyle = {
				position: 'absolute',
				background: 'rgba(0,0,0,0.7)',
				color: '#fff',
				top: '100%',
				bottom: 'auto',
				padding: '0.2rem 1rem',
				borderRadius: '1rem',
			};
			defaultStyle['transform'] = `translateX(${this.hoverTooltipOffsetX}px)`;
			return defaultStyle;
		},
		valueModel: {
			get() {
				return this.value;
			},
			set(index) {
				this.loading = true;
				if (this.timer) clearTimeout(this.timer);
				this.timer = setTimeout(async () => {
					const TIME_STR = this.DATES[index];
					if (!TIME_STR) return;
					const activedLyr = this.$LayerIns.normalLayerCollection.find(
						(l) => l.id === this.activedWeatherLyr.id,
					);
					try {
						if (activedLyr) await activedLyr.setTimeData(TIME_STR);
					} catch (e) {
						console.error(e);
					} finally {
						this.loading = false;
					}
					this.value = index;
				}, 300);
			},
		},
		activedWeatherLyr() {
			return this.$store.state.layer.activedWeatherLyr;
		},
		DATES() {
			return this.activedWeatherLyr.times;
		},
		MARKS() {
			let bucket = {};
			this.DATES.forEach((dStr, index) => {
				const D = new Date(dStr);
				const yy = D.getFullYear();
				const mm = D.getMonth() + 1;
				const dd = D.getDate();

				const lD = new Date(this.DATES[index - 1]);
				const lyy = lD.getFullYear();
				const lmm = lD.getMonth() + 1;
				const ldd = lD.getDate();

				if (index === 0 || dd > ldd || mm > lmm || yy > lyy) {
					bucket[index] = {
						label: `${mm}/${dd}`,
					};
				}
			});
			return bucket;
		},
		options() {
			return {
				dotSize: 18,
				width: 'auto',
				height: '0.8rem',
				// contained: true,
				direction: 'ltr',
				// data: DATES,
				// min: 0,
				max: this.DATES.length ? this.DATES.length - 1 : 0,
				// interval: 1,
				// disabled: false,
				// clickable: true,
				// duration: 0.5,
				// lazy: true,
				tooltip: 'none',
				// tooltip: 'always',
				// // tooltipPlacement: 'top',
				// tooltipFormatter: i=>this.getUnionDateString(new Date(this.DATES[i])),
				// tooltipStyle: {
				// 	pointerEvents: 'auto'
				// },
				// useKeyboard: false,
				// keydownHook: null,
				// dragOnClick: false,
				// enableCross: true,
				// fixed: false,
				// minRange: void 0,
				// maxRange: void 0,
				// order: true,
				included: false,
				marks: this.MARKS,
				dotOptions: {
					style: {
						pointerEvents: 'auto',
					},
				},
				// process: true,
				// dotStyle: {},
				railStyle: {
					pointerEvents: 'none',
				},
				// processStyle: void 0,
				stepStyle: {
					boxShadow: 'none',
					backgroundColor: '#ffffff',
					width: '2px',
					borderRadius: 0,
				},
				// stepActiveStyle: void 0,
				// labelStyle: void 0
				// labelActiveStyle: void 0,
			};
		},
		//- scroll bar
		DATES_MOBILE_MODEL() {
			console.log('[DATES_MOBILE_MODEL RAW]', this.MARKS);

			const result = Object.values(this.MARKS).map((v) => ({
				label: v.label,
				hours: this.DATES.filter((dstr) => {
					const d = new Date(dstr);
					const mm = d.getMonth() + 1;
					const dd = d.getDate();
					return `${mm}/${dd}` === v.label;
				}).map((dstr) => new Date(dstr).getHours()),
			}));
			console.log('[DATES_MOBILE_MODEL RESULT]', result);
			return result;
		},
	},
	methods: {
		mouseEnter(e) {
			this.hoverTimeString = this.getDateBymouseEvt(e);
		},
		mouseMove(e) {
			if (e.target.classList.contains('vue-slider')) {
				this.hoverTooltipVisibility = true;
				this.hoverTimeString = this.getDateBymouseEvt(e);
			} else {
				this.hoverTooltipVisibility = false;
			}
		},
		mouseLeave() {
			this.hoverTooltipVisibility = false;
		},
		getDateBymouseEvt({ offsetX }) {
			this.hoverTooltipOffsetX = offsetX;
			const width = this.$refs.VueSlider.$el.clientWidth;
			let idx = Math.floor((this.DATES.length * offsetX) / width);
			idx = idx < 0 ? 0 : idx;
			this.hoverDateIndex = idx;

			const hoverCaption = this.$refs.hoverCaption;
			if (idx >= 50 && hoverCaption) {
				// 靠右邊位移至左
				this.hoverTooltipOffsetX -= hoverCaption.clientWidth;
			}

			return this.getUnionDateString(idx);
		},
		getUnionDateString(idxOrDate) {
			let now = null;
			if (idxOrDate instanceof Date) {
				now = idxOrDate;
			} else if (typeof idxOrDate === 'number') {
				now = new Date(this.DATES[idxOrDate]);
			}
			const mm = now.getMonth() + 1;
			const dd = now.getDate();
			const hh = now.getHours();
			return `${mm}月${dd}日 ${hh}時`;
		},
		padding(n) {
			if (n < 10) return '0' + n;
			return n;
		},
		async ininMobileScroll() {
			const dom = await new Promise((res) =>
				this.$nextTick(() => res(this.$refs.bsScroll)),
			);
			if (!dom) {
				// !isMobile
				return;
			}

			this.BScrollInstance && this.BScrollInstance.destroy();
			this.BScrollInstance = new BScroll(dom, {
				scrollX: true,
				bindToWrapper: true,
				disableMouse: false,
				disableTouch: false,
				//probeType: 3, // listening scroll hook
				stopPropagation: true,
				tap: 'tap',
			});
			// console.log('[BScrollInstance]', this.$refs.bsScroll, this.BScrollInstance, this.BScrollInstance.scroller, this.$refs.timeScale);
			this.BScrollInstance.on('scrollEnd', (e) => {
				if (!this.$refs.timeScale[0]) return;
				const CENTER = this.$refs.timeScale[0].offsetLeft + Math.abs(e.x);
				// find min diff from all hours elms
				let pos = this.$refs.timeScale.map((el, idx) => {
					return el.offsetLeft;
				});
				// console.log("[CENTER]diff", CENTER, e, pos)
				let idx = pos.length - 1;
				for (let i = 0; i < pos.length; i++) {
					if (pos[i] < CENTER) continue;
					idx = i - 1;
					break;
				}
				this.valueModel = idx < 0 ? 0 : idx;
			});
		},
	},
	created() {
		// console.log('[layerWeatherTool]created()', this, this.isMobile, this.BScrollInstance);
		// TODO: keep this.valueModel when switch PC <-> mobile
		if (this.isMobile) this.ininMobileScroll();
	},
};
</script>

<style lang="scss" scoped>
.legend {
	width: 100%;
	background-color: rgba(0, 0, 0, 0.45);
	color: #fff;
	display: flex;
	align-items: center;
	position: relative;
	overflow: hidden;
	border-radius: 1rem;
	&__title {
		white-space: nowrap;
		padding: 0 1rem;
		z-index: 1;
	}
	&__row {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-evenly;
		&__text {
			position: relative;
			padding: 0.25rem 0.5rem;
			text-shadow: 1px 1px 0px rgba(0, 0, 0, 1);
		}
	}
}
</style>

<style lang="scss" scoped>
.timeSilder {
	position: relative;
	/deep/ {
		.vue-slider-rail {
			background-color: rgba(0, 0, 0, 0.5) !important;
		}
		.vue-slider-mark {
			width: 0 !important;
			position: absolute;
		}
		.vue-slider-mark-label {
			color: #fff;
			left: 50%;
			transform: translateX(0);
			bottom: 100%;
			top: auto;
			margin: 0.25rem 0;
			text-shadow: 1px 1px 1px rgba(0, 0, 0, 1);
		}
		.vue-slider-process {
			background-color: $primary !important;
		}
	}

	.custom-tooltip {
		background: rgba(0, 0, 0, 0.8);
		color: #fff;
		white-space: nowrap;
		border-radius: 1rem;
		padding: 0.2rem 0.5rem;
		margin: 0 1rem;
		pointer-events: auto;
	}
}
</style>

<style lang="scss" scoped>
.scroll {
	width: 100%;
	overflow: hidden;
	background: rgba(0, 0, 0, 0.5);
	&__wrapper {
		white-space: nowrap;
	}
	&__content {
		display: inline-block;
	}
	&__item {
		display: inline-block;
		color: #fff;
		padding: 0 0 0.5rem 0.5rem;
		&:nth-of-type(odd) {
			background-color: rgba(0, 0, 0, 0.5);
		}
	}
}
.scroll-label {
	width: 100%;
	text-align: center;
	position: relative;
	color: #fff;
	background: $primary;
	padding: 0.25rem 0;
	&__pointer {
		width: 0;
		height: 0;
		border-style: solid;
		border-width: 0.8rem 0.8rem 0 0.8rem;
		border-color: $primary transparent transparent transparent;
		//-
		position: absolute;
		left: 0;
		right: 0;
		margin: 0 auto;
		z-index: 2;
	}
}
</style>

<style lang="scss" scoped>
/deep/ {
	.el-loading-mask {
		background-color: transparent;
	}
	.el-loading-spinner {
		display: flex;
		justify-content: center;
		align-items: center;
		top: 0;
		position: relative;
		margin: 0;
		height: 100%;
		.path {
			stroke: #fff !important;
			stroke-width: 5px !important;
		}
		.circular {
			width: 18px !important;
			height: 18px !important;
		}
	}
}
</style>
