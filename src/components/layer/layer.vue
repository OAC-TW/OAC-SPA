<template lang='pug'>
	.layer
		.layer__wrapper
			.layer__header
				slot(name="header")
			//- see : https://github.com/Jexordexan/vue-slicksort
			SlickList.slickList(
				ref="slickList"
				v-model="layerSortableModel"
				@sort-end="onSortEnd"
				@sort-start="onSortStart"
				appendTo="body"
				:pressDelay=" !isIE ? 0 : 500 "
				:useDragHandle="!isIE"
				helperClass="dragging"
				:transitionDuration="300"
			)
				.col.closeAll
					label() 圖層總開關:
					el-switch(
						:value='canCloseAll()',
						:disabled='!canCloseAll()',
						title='關閉所有圖層',
						@change='closeAll'
					)

				.col(v-if="pointerLayer.length")
					small 地圖上帶有對應圖示的圓形，在縮放比例尺後可以得到更多關於點的資訊
						.fixedTopList(style="position:relative;" )
							.fixedTopList__collapse(:class="{'fixedTopList__collapse--hide':hideFixedTopList}")
								layerItemFixedCard.slickList__card(
									ref="pointlist"
									v-for="layer in pointerLayer"
									:key="layer.title"
									:class="getStatusClassName(layer)"
									:layer="layer" 
									:status="layer.status"
									:dragging="dragging"
									:useDragger="!isIE"
									:isLoading="isLoading(layer.id)"
									:isPinned="isPinned(layer.id)"
									@switch="handleLayerVisibility(layer.id,$event)"
									@opacitySlide="handleLayerOpacity(layer.id,$event)"
								)
				.col
					small 點擊地圖上的色塊來查詢區域內的資訊，點擊下方圖層來設定顏色或透明度，亦可以拖動來改變順序!
					SlickItem(
						ref="toggleAble"
						v-for="(layer,index) in layerSortableModel"
						:key="`${layer.id}`"
						:index="index"
						v-loading="updatingLayerList.indexOf(layer.id)>-1"
					)
						layerItemCard.slickList__card(
							:class="getStatusClassName(layer)"
							:layer="layer" 
							:status="layer.status"
							:dragging="dragging"
							:useDragger="!isIE"
							:isLoading="isLoading(layer.id)"
							:isPinned="isPinned(layer.id)"
							@switch="handleLayerVisibility(layer.id,$event)"
							@opacitySlide="handleLayerOpacity(layer.id,$event)"
						)

			//- baseMaps
			//- .layer__footer
			//- 	layerBaseMap

		//- 詮釋
		el-dialog(
			v-if="dataSetDialogVisible"
			@close="closeDataSet"
			title="圖層詮釋"
			visible
			show-close
			append-to-body	
			center
		)
			template(v-for="data in dataSet")
				el-link(
					type="primary"
					:href="data.value" 
					:key="data.value"
					target="_blank"
					rel="noopener"
				) {{data.label}}
				| 、
</template>



<script>

import { SlickList, SlickItem } from "vue-slicksort"
import {mapGetters,mapActions, mapMutations} from "vuex"
import layerItemCard from "./layerItemCard"
import layerBaseMap from "./layerBaseMap"

import layerItemFixedCard from "./layerItemFixedCard"

export default {
	name:'layers',
	components:{
		SlickList,
		SlickItem,
		layerItemCard,
		layerBaseMap,
		layerItemFixedCard,
	},
	props: {
		AutoScroll: {
			type: Boolean,
			default: false,
		},
	},
	data:()=>({
		dragging:false,
		lastDraggingLyrPtr:'',
		//
		layerKeyword:'',
		matchKeywordLayers:[],
		updatingLayerList:[], // 存放正在更新的圖層名稱或ID
		//
		hideFixedTopList: false,
		// 詮釋
		dataSetDialogVisible:false,
		dataSet:[],

		loadingLayers: [],
	}),
	computed:{
		...mapGetters({
			pointerLayer: 'layer/pointerLayer',
			sortableLayer: 'layer/sortableLayer',
			unsortableLayer: 'layer/unsortableLayer',
			weatherLayer: 'layer/weatherLayer',
			pinnedLayer: 'layer/pinnedLayer',
			visableLayer: 'layer/visableLayer',
		}),
		layer(){
			return this.$store.state.layer.layer
		},
		isIE(){
			return Boolean(document.documentMode)
		},
		// layerKeywordModel:{
		// 	get(){
		// 		return this.layerKeyword
		// 	},
		// 	set(str){
		// 		this.matchKeywordLayers = str ? this.layerSortableModel.filter(lyr=>lyr.title.match(new RegExp(str,"g"))) : []
		// 		if(this.matchKeywordLayers.length > 0){ //- matched keyword
		// 			this.$refs.slickList.$children.forEach(comp=>{
		// 				if(comp.$vnode.elm.innerText === this.matchKeywordLayers[0].title){ // first one
		// 					document.documentElement.scrollIntoView ? comp.$el.scrollIntoView({behavior: "smooth"}) : c.$el.focus()
		// 				}
		// 			})
		// 		}
		// 		this.layerKeyword = str
		// 	}
		// },
		layerSortableModel:{
			get(){
				return this.sortableLayer
			},
			set(newSortedLayerArr){
				this.SNAPSHOT_RAW_LAYER({
					type:'layer', 
					payload:[...this.layerUnSortable,...newSortedLayerArr]
				})
			}
		},
		layerUnSortable(){
			return this.unsortableLayer
		},
		layerUnSortableCount(){
			return this.layerUnSortable.length
		}
	},
	methods:{
		...mapMutations({
			UPDATE_LAYER_OPTIONS:'layer/UPDATE_LAYER_OPTIONS',
			SNAPSHOT_RAW_LAYER:'layer/SNAPSHOT_RAW_LAYER',
		}),
		_toggleLayerWiggle(bool){
			this.$nextTick(()=>{
				this.$refs['toggleAble'].forEach(v=>{
					const dom = v.$el.children[0]
					dom.classList.toggle('wiggle',bool)
					if(bool) dom.style.animationDuration = `${Math.random() * (2000 - 1000) + 1000}ms`
				})
			})
		},
		onSortEnd(evt){
			const oi = evt.oldIndex 
			const ni = evt.newIndex 
			
			//- 地圖實例順序更新
			console.log("順序移動 : 索引 " + oi + " 至 " + ni,this.layerSortableModel[oi], this.layerUnSortableCount)

			/** 加上不可排序的長度 來偏移 */
			const offset_oi = oi + this.layerUnSortableCount
			const offset_ni = ni + this.layerUnSortableCount
			this.$LayerIns.reorderNormalLayer(this.layerSortableModel[oi].id,offset_oi,offset_ni)

			this.dragging = false
			this._toggleLayerWiggle(false) //- dom wiggle effect

		},
		onSortStart(evt){
			this.dragging = true
			this._toggleLayerWiggle(true) //- dom wiggle effect
			this.lastDraggingLyrPtr = this.layerSortableModel[evt.index]
		},
		isPinned(id) {
			return this.pinnedLayer.indexOf(id) >= 0;
		},
		isLoading(id) {
			return this.loadingLayers.indexOf(id) >= 0;
		},
		setLoading(id, bool) {
			if (bool) {
				if (!this.isLoading(id)) this.loadingLayers.push(id);
			} else {
				let idx = this.loadingLayers.indexOf(id);
				if (idx >= 0) this.loadingLayers.splice(idx, 1);
			}
		},
		handleLayerVisibility(id,bool){
			const lyrIns = this.$LayerIns.normalLayerCollection.find(l=>l.id === id)
			if( lyrIns.status === "loading" ){
				console.log("lyr loading now", lyrIns)
				return
			}

			if (bool) {
				// disable switch
				this.setLoading(id, true);
				lyrIns.once("loaded", ()=>{
					// restore previous options in state
					const {opacity,legendColor} = this.layer.find(l=>l.id === id)
					this.$LayerIns.setOpts(id,{opacity,color:`rgb(${legendColor})`})
					console.log("[handleLayerVisibility , when layer open restore style in state]", lyrIns, opacity, legendColor)

					// enable switch
					this.setLoading(id, false);
				});
				lyrIns.once("error", (e) => {
					console.log("lyr loading err", lyrIns, e);
					this.$alert(`圖層資料載入發生錯誤:
title: ${lyrIns?.title}
UUID: ${lyrIns?.id}`, { type: 'error' });
					this.$LayerIns.setVisible(id, false);
					this.setLoading(id, false);
				});
			}
			this.$LayerIns.setVisible(id, bool)
		},
		handleLayerOpacity(id,opacity){
			this.$LayerIns.setOpts(id,{opacity})
			this.UPDATE_LAYER_OPTIONS({
				id:id,
				payload:{opacity}
			})
		},
		getStatusClassName(layer){
			return {
				'slickList__card--matched-keyword':this.matchKeywordLayers.indexOf(layer)>-1,
				'slickList__card--last-move':(this.lastDraggingLyrPtr === layer),
				'slickList__card--outScale':(layer.status==='outScale'),
				'slickList__card--simple':(layer.status==='simple') || (this.matchKeywordLayers.length>0 && !this.matchKeywordLayers.indexOf(layer)>-1)
			}
		},
		canCloseAll() {
			let canClose = 0;
			this.visableLayer.forEach((layer, i) => {
				const id = layer.id;
				if (!this.isPinned(id)) canClose++;
			});
			return canClose > 0;
		},
		closeAll(e) {
			// console.log('[closeAll]', this, e);
			this.visableLayer.forEach((layer, i) => {
				const id = layer.id;
				if (!this.isPinned(id)) this.$LayerIns.setVisible(id, false);
			});
		},
		scrollToLay(lay) {
			for (let v of lay) {
				const dom = v.$el.children[0]
				const comp = (v.$children[0].layer)? v.$children[0]: v;
				if (comp?.layer?.visible) {
					// console.log('[layer][toggleAble]', this, comp, dom, dom.offsetTop, comp.layer.visible, this.$refs['slickList'])
					this.$refs['slickList']?.$el?.scrollTo(0, dom.offsetTop);
					return;
				}
			}
		},
	},
	mounted() {
		// console.log('[layer]mounted()', this);
		if (!this.AutoScroll) return;
		this.scrollToLay(this.$refs['pointlist']);
		this.scrollToLay(this.$refs['toggleAble']);
	},
}
</script>




<style lang="scss" scoped>

	.col {
		border-top: 0.75px solid rgba($info,0.5);
		padding: 1rem 0;
	}

	.col.closeAll {
		display: flex;
		justify-content: space-between;
		padding-left: 0.6rem;
		padding-right: 0.6rem;
		span {
			align-self: center;
		}
		/deep/ .el-switch.is-checked .el-switch__core {
			border-color: #0c67af;
			background-color: #0c67af;
		}
	}

	/deep/ .el-collapse-item__content{padding: 0;}
	.layer{
		overflow:hidden;
		margin:-1rem;
		&__wrapper{
			height:100%;
			display:flex;
			flex-direction: column;
		}
		&__header{
			display: flex;
			flex-direction: column;;
			margin:1rem;
			/deep/ {
				.el-input__inner{
					border: 1.5px solid $primary;
				}
			}
		}
		&__footer{
			z-index: 1;
		}
	}
	.fixedTopList{
		position: relative;
		// &__collapse{
		// 	max-height: 50vh;
		// 	overflow: hidden;
		// 	will-change: max-height;
		// 	&--hide{
		// 		max-height: 0vh;
		// 	}
		// }
	}
	.slickList{ 
		padding: 0 1rem;
		overflow-y: auto;
		box-sizing: border-box;
		position: relative;
		height:100vh;
		
		&__card{
			transition: all 0.2s ease-in-out;
			&--matched-keyword{
				color: red !important;
				border-color: red !important;
				border-width: 2px;
			}
			&--last-move{
				border-color: $primary;
				border-width: 2px;
			}
			&--outScale{
				color:#E6A23C;
				background-color:#fdf6ec;
			}
			&--simple {
				opacity:0.5;
			}
		}
	}

	.wiggle {
		animation-name: wiggle;
		animation-duration: 1500ms;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		transform: scale(0.95,0.95);
	}

	@keyframes wiggle {
		0% { transform: translate(0, 0) rotate(0); }
		10% { transform: translate(-0.5px, -1px) rotate(-0.2deg); }
		20% { transform: translate(-1.5px, 0px) rotate(0.2deg); }
		30% { transform: translate(1.5px, 1px) rotate(0deg); }
		40% { transform: translate(0.5px, -0.5px) rotate(0.2deg); }
		50% { transform: translate(-0.5px, 1px) rotate(-0.2deg); }
		60% { transform: translate(-1.5px, 0.5px) rotate(0deg); }
		70% { transform: translate(1.5px, 0.5px) rotate(-0.2deg); }
		80% { transform: translate(-0.5px, -0.5px) rotate(0.2deg); }
		90% { transform: translate(0.5px, 1px) rotate(0deg); }
		100% { transform: translate(0, 0) rotate(0); }
	}
	
	.flicker{
		animation-name: flicker;
		animation-duration: 800ms;
		animation-iteration-count: 3;
	}
	@keyframes flicker {
		0%,100%{
			opacity: 1;
		}
		50%{
			opacity: 0.3;
		}
	}

	.dragging{
		margin: 0;
		z-index: 9999;
		@include boxShadow;
		&>*{
			margin: 0;
		}
	}

</style>
