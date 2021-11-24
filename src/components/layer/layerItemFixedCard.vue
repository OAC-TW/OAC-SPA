<template lang='pug'>

	el-card.layer-card(
		shadow="hover"
		:class="isOutScaleStyle ? 'layer-card--outscale' : !layer.visible ? 'layer-card--disabled ' :'layer-card--default'"
	)
		.icon
			template(v-if="typeof layer.icon === 'string' && layer.icon.startsWith('url:')")
				img.iconImg(:src="layer.icon.replace(/^(url:)/, '')")
			template(v-else)
				font-awesome-icon(:icon="layer.icon" fixed-width)

		.layer-card__content
			.layer-card__content__head
				//- 名稱
				strong(style="line-height:200%;")
					div(style="display:flex;align-items:center;")
						span {{layer.title}}
				div(ref="outterButton" style="display:flex;align-items:center;")
					//- 開關
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
							:visible-arrow='false'
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

</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

/**
 * @switch()
 * @opacitySlide()
 * @openExplain()
 */
export default {
	name:'layerItemCard',
	components:{
		
	},
	data:()=>({
		//-
		dataSetDialogVisible:false,
		dataSetDialogDetail:"",
	}),
	props:{
		layer:{
			type:Object
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
	},
	computed:{
		switchTitle() {
			if (this.isLoading) return '載入中...';
			return this.layer.visible ? '關閉圖層' : '開啟圖層';
		},
		isOutScaleStyle(){
			return this.status === 'outScale'
		},
	},
	methods:{
	},
}
</script>




<style lang="scss" scoped>

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

	.icon{
		padding: 0 1rem;
		color: $primary;
		z-index: 2;

		.iconImg{
			height: 1rem;
		}
	}
	
	.layer-card{
		margin: 1rem auto;
		box-sizing: border-box;
        position: relative;
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
				}
			}
		}

		&--disabled{
			border:0;
			border: 1px dashed darken($info,20);
			color: darken($info,20);
			background-color: lighten($info,20);
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


</style>
