<template lang="pug">

.baseMap
	transition(name="slide-fade-up" mode="out-in")
	
		.baseMap__current(v-if="!layerListVisibility" key="current")

			el-image.baseMap__current__image(
				style="cursor:pointer;"
				fit="cover" 
				@click="layerListVisibility=true"
				:alt="currentName"
				:src="currentImgPath"
			)

			.baseMap__current__slider
				el-slider(
					:value="currentOpacity"
					@input="handleBaseLayerOpacity($event)"
					:step='10'
					:show-tooltip='false'
				)
				
				el-button(
					plain
					round
					:size="size"
					title="切換其他底圖"
					type="primary"
					@click="layerListVisibility=true"
					icon="el-icon-arrow-up"
				)
					strong {{ currentName }}

		.baseMap__list(
			key="list"
			v-else
		)
			//- baseLayers
			el-radio-group(
				:value="currentID" 
				@input="handleBaseLayerVisibility($event);layerListVisibility=false"
			)
				el-radio(
					v-for="(lyr,index) in allLayerList"
					:key="`${index}`"
					:label="`${lyr.id}`"
					border
				)
					el-image(
						fit="cover" 
						:alt="'選擇'+lyr.title"
						:src="require('@/assets/basemap/'+lyr.imgUrl)"
					)
					strong {{ lyr.title }}

			el-button(
				style="width:100%;"
				round
				plain
				:size="size"
				icon="el-icon-arrow-down"
				title="取消選擇底圖"
				@click="layerListVisibility=false"
				type="danger"
			) 取消

</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

export default {
	name: "baseLayer",
	data:()=>({
		layerListVisibility: false
	}),
	computed: {
		size(){
			return this.$store.getters.isMobile ? 'mini' : 'small'
		},
		allLayerList(){
			return this.$store.state.layer.baseLayer
		},
		currentLayer(){
			return this.allLayerList.find(l=>l.visible)
		},
		currentName(){
			let name = this.currentLayer.title
			// 黑底底圖直接操作 DOM 改背景顏色
			document.querySelector("#viewDiv").style.backgroundColor = /黑底/g.test(name) ? "#2a2a2a" : 'transparent'
			return name
		},
		currentID(){
			return this.currentLayer.id
		},
		currentImgPath(){
			return require('@/assets/basemap/'+this.currentLayer.imgUrl)
		},
		currentOpacity(){
			return Number(Number(this.currentLayer.opacity*100).toFixed(0))
		}
	},
	methods: {
		...mapMutations({
			UPDATE_BASELAYER_OPTIONS:'layer/UPDATE_BASELAYER_OPTIONS',
		}),
		handleBaseLayerVisibility(id){
			//- update map instance
			this.$LayerIns.setVisible(id)
			//- update state snapshot
			this.UPDATE_BASELAYER_OPTIONS({
				id:id,
				payload:{
					visible: true
				}
			})
		},
		handleBaseLayerOpacity(opacity){
			console.log("baseMap opacity chaged : ", opacity)
			//- update map instance
			this.$LayerIns.setOpts(this.currentID,{opacity})
			//- update state snapshot
			this.UPDATE_BASELAYER_OPTIONS({
				id:this.currentID,
				payload:{
					opacity: opacity
				}
			})
		},
	}
}
</script>

<style lang="scss" scoped>

	$baseWidth: 4rem;

	.baseMap {
		
		@include boxShadow;
		// overflow: hidden;
		max-height: 400px;
		overflow-y: auto;
		border-top-right-radius: 0.8rem;
		border-top-left-radius: 0.8rem;

		&__current{
			
			margin: 0.8rem;
			display: flex;
			align-items: center;
			justify-content: space-between;

			&__image{
				flex: 0 0 $baseWidth;
				height: $baseWidth;
				border-radius: 100%;
			}
			&__slider{
				margin: 0 1rem;
				box-sizing: border-box;
				flex: 1 1 auto;
				display: flex;
				flex-direction:column;
			}
		}

		&__list {
			margin: 1rem;
			display: flex;
			flex-direction: column;
			align-items: center;

			/deep/ {
				.el-radio-group {
					width:100%;
					display: flex;
					flex-direction: column;
				}
				.el-radio{
					padding: 0.5rem 1rem;
					margin: 0.5rem 0 !important;
					height: auto;
					display: flex;
					align-items: center;
					&__label{
						flex: 1 1 auto;
						display: flex;
						align-items: center;
						justify-content: flex-start;
						img{
							border-radius:100%;
							width: $baseWidth*1.2;
							height: $baseWidth*1.2;
							margin-right: 0.5rem;
						}
					}
				}
			}

		}

	}

</style>