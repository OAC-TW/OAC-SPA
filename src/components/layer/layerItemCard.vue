<template lang='pug'>

	el-card.layer-card(
		shadow="hover"
		:class="isOutScaleStyle ? 'layer-card--outscale' : !layer.visible ? 'layer-card--disabled ' :'layer-card--default'"
		@click.native.stop="handleOpacitySlider"
	)
		
		.dragger(
			ref="dragger"
			v-if="!isIE"
			v-handle
			:style="isRetrival?'color:red;':''"
			@click.stop="emitDeActiveLayer(layer)"
		)
			font-awesome-icon(:icon="isRetrival?'trash-alt':'arrows-alt-v'")

		//- 透明度背景
		.layer-card__bgOpacity(
			v-if="!isOutScaleStyle && layer.visible" 
			:style="opacityTransformScaleStyle"
		)

		.layer-card__content
			//- 超過比例尺樣式 -- 顯示提示
			template(v-if="isOutScaleStyle")
				.layer-card__content__notify
					strong {{layer.title}}
					br
					small 限定比例尺範圍
					strong {{layer.minScale && layer.maxScale ? ` 1/${layer.minScale} ~ 1/${layer.maxScale} ` : layer.maxScale ? ` 1/${layer.maxScale}以下 ` : ` 1/${layer.minScale}以上 ` }}
					small 目前 1/{{mapScale}}

			//- 比例尺內樣式 -- 正常顯示
			template(v-else)

				.layer-card__content__head

					//- 名稱
					strong(style="line-height:200%;")
						
						div(style="display:flex;align-items:center;")
							.color-legendColor(:style="`backgroundColor:${colorModel};`")
							span {{layer.title}}

					div(ref="outterButton" style="display:flex;align-items:center;")
						el-switch(
							:disabled="isLoading || isPinned"
							:value="layer.visible"
							:title="switchTitle"
							@change="$emit('switch',$event)"
						)

						el-tooltip(
							placement="right"
						)
							el-button(
								type="text" 
								title="圖層來源網址"
								:disabled="!layer.dataSet"
								style="padding:0 0 0 0.5rem;"
							)
								font-awesome-icon(icon="question-circle")

							.dataSetLink(slot="content")
								strong 資料來源
								div(v-for="(i,index) in layer.dataSet")
									a(
										target="_blank"
										rel="noopener"
										:href="i.value"
									) {{i.label}}

				div.layer-card__content__slider(
					v-if="detailVisibility && layer.visible && !isOutScaleStyle"
					ref="detailConfig"
					style="z-index:1;"
				)
					transition(name="fade")
						.layer-card__content__opacity
							el-slider(
								:value="handleOpacityPercentage"
								:show-tooltip="false"
								@input="$emit('opacitySlide',$event)"
							)
					transition(name="fade")
						.layer-card__content__colorPicker
							colorSliderPicker(v-model="colorModel")

</template>

<script>

import { mapGetters, mapMutations } from 'vuex'
import { HandleDirective } from 'vue-slicksort'

/** @see https://www.npmjs.com/package/vue-color */
import {Slider as colorSliderPicker} from "vue-color"

export default {
	name:'layerItemCard',
	directives: { handle: HandleDirective },
	components:{
		colorSliderPicker
	},
	data:()=>({
		detailVisibility:false
	}),
	props:{
		layer:{
			type:Object
		},
		dragging:{
			type:Boolean
		},
		isLoading:{
			type:Boolean
		},
		isPinned:{
			type:Boolean
		},
		status: {
			type:String,
			validator: status => status === "" || status === "simple" || status === "outScale"
		},
		isRetrival:{
			type: Boolean,
		}
	},
	computed:{
		// ...mapGetters({
		// 	pinnedLayer: 'layer/pinnedLayer',
		// }),
		// isPinned() {
		// 	return this.pinnedLayer.indexOf(this.layer.id) >= 0;
		// },
		isIE(){
			return Boolean(document.documentMode)
		},
		dragAvaliable(){
			return this.layer.type === "geojson"
		},
		switchTitle() {
			if (this.isLoading) return '載入中...';
			return this.layer.visible ? '關閉圖層' : '開啟圖層';
		},
		colorModel:{
			get(){
				return this.layer.visible ? `rgb(${this.layer.legendColor})` : `rgb(239,239,239)`
			},
			set(color){
				console.log("[colorModel setter]", color)
				const {r,g,b} = color.rgba
				// update map 
				this.$LayerIns.setOpts(this.layer.id,{
					color:`rgb(${r},${g},${b})`
				})
				// update state
				this.UPDATE_LAYER_OPTIONS({
					id:this.layer.id,
					payload:{
						legendColor:`${r},${g},${b}`
					}
				})

			}
		},
		handleOpacityPercentage(){
			return Number((Number(this.layer.opacity)*100).toFixed(0))
		},
		handleOpacityFloat(){
			return this.handleOpacityPercentage/100
		},
		opacityTransformScaleStyle(){
			return {
				transform: `scale(${ this.handleOpacityFloat },1)`
			}
		},
		isSimpleStyle(){
			return this.status === 'simple'
		},
		isOutScaleStyle(){
			return this.status === 'outScale'
		}
	},
	methods:{
		...mapMutations({
			UPDATE_LAYER_OPTIONS:"layer/UPDATE_LAYER_OPTIONS"
		}),
		handleOpacitySlider(evt){
			//console.log("[handleOpacitySlider]", evt, evt.target, this.$refs)
			if(this.$refs.detailConfig?.contains(evt.target)) return
			if(this.$refs.dragger.contains(evt.target)) return
			if(this.$refs.outterButton.contains(evt.target)) return
			if(this.layer.visible) this.detailVisibility = !this.detailVisibility
		},
		emitDeActiveLayer(layer){
			if(this.isRetrival){
				this.$emit("deActiveLayer",layer)
			}
		}
	},
}
</script>




<style lang="scss" scoped>
	.layer-card{
		margin: 1rem auto;
		box-sizing: border-box;
		position: relative;
		cursor: pointer;
		/deep/ {
			.el-card__body{
                font-size: 1rem;
				padding:0.35rem 0.6rem;
				display:flex;
				align-items: center;
			}
		}
		
		&__bgOpacity{
			position: absolute;
			top: 0; left: 0; bottom: 0; right: 0;
			background-color: rgba($primary, 0.1);
			transform-origin: left;
			transform: scale(0.5,1);
			z-index: 0;
		}

		&__content{
			display:flex;
			flex-direction:column;
			align-items: space-between;
			justify-content:center;
			flex: 1 1 100%;

			&__head{
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
			&__slider{
				cursor: initial;
			}
			&__detail{
				display: flex;
				align-items: center;
			}
			&__notify{
				line-height: 150%;
			}
			&__opacity{
				width: 97%;
			}
			&__colorPicker{
				margin:0.5rem 0 1rem 0;
				/deep/ {
					.vc-slider{
						width: 98%;
					}
					.vc-slider-swatches{
						display: none;
					}
					.vc-hue-container {
						cursor: ew-resize;
					}
				}
			}

			/deep/ .el-slider__runway {
				cursor: ew-resize;
			}
		}

		&--disabled{
			border:0;
			border: 1px dashed darken($info,20);
			color: darken($info,20);
			background-color: lighten($info,20);
			/deep/ {
				.el-card__body{
					cursor: initial;
				}
			}
		}
		&--default{
			border:0;
			border: 1px dashed darken($info,20);
		}
		&--outscale{
			border:0;
			border: 1px dashed $warning;
		}

	}

	.dragger{
		padding: .5rem 1rem;
		cursor: ns-resize;
		z-index: 2;
	}

	.color-legendColor{
		border:2px solid #ffffff;
		border-radius: 100%;
		margin-right: 0.5rem;
		width:0.9rem;
		height:0.9rem;
		// box-shadow: 0 0 1px 2px rgba(0,0,0,0.1);
	}
	
	.dataSetLink{
		width:auto;
		max-width:250px;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		line-height: 200%;
		&>*{
			margin: 0 0.5rem;
		}
		a{
			color:$primary;
		}
	}

</style>
