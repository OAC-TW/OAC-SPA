<template lang="pug">

.search
	el-select(
		style="width:100%;"
		v-model="selectedTagModel"
		filterable
		placeholder="選擇遊憩活動"
		placement="bottom"
		popper-class="selectItems"
		clearable
	)
		el-option(
			v-for="i in tags" 
			:key="i.label" 
			:label="i.label" 
			:value="i.value"
		)
		template(slot="prefix")
			el-button(
				style="position:absolute;"
				circle
				type="primary" 
			)
				.tools__button
					font-awesome-icon(icon="swimmer" fixed-width size="lg")

	.search__locator
		el-input(v-model="lng" clearable)
			small(slot="prefix") 經度
		el-input(v-model="lat" clearable)
			small(slot="prefix") 緯度
			template(slot="suffix")
		el-button(type="primary" round @click="latLngLocate") 查詢

	searchDummy()

</template>

<script>

import {mapGetters,mapActions, mapMutations} from 'vuex'

import searchDummy from '@/components/searchDummy'

export default {
	name :"search",
	data:()=>({
		layerTag:null,
		lng:"",
		lat:""
	}),
	components:{
		searchDummy,
	},
	computed:{
		currentTag(){
			return this.$store.state.currentTag
		},
		layers(){
			return this.$store.state.layer.layer
		},
		selectedTagModel:{
			get(){
				return this.currentTag.label
			},
			set({label,value}){
				
				this.SET_CURRENT_TAG({label,value})
				this.SET_CARD_VISIBLE({key:'layer',bool:true})
				
				this.layers.forEach(l => {
					let visible = l.visible
					if(Array.isArray(l.tag) && value){
						if(l.tag.indexOf(this.currentTag.value) === -1){
							visible = false
						}
					}else{
						console.error("error {value}",value)
						console.error("error tag in layer",l)
					}
					console.log(l.title,visible)
					this.$LayerIns.setVisible(l.id,visible)
				})
				this.$emit("close")
			}
		},
		tags(){
			if(!this.layerTag) return
			const layerTag = this.layerTag
			let qSearchs = []
			Object.keys(layerTag).forEach(k => {
				layerTag[k].forEach(v=>{
					qSearchs.push({label: v,value: {
						label: v,
						value: k
					}})
				})
			})
			return qSearchs
		}
	},
	async created(){
		/** get layerTag (index) */
		this.layerTag = await(await fetch('./layerTag.json')).json()

		// get defailt latlng
		let loc = localStorage.getItem("location")
		if(!loc) return
		loc = loc.split(",")
		this.lat = parseFloat(loc[0]).toFixed(5)
		this.lng = parseFloat(loc[1]).toFixed(5)
		
	},
	methods:{
		...mapMutations([
			"SET_CARD_VISIBLE",
			"SET_CURRENT_TAG"
		]),
		latLngLocate(){
			try{
				if(Number(this.lat)===NaN) throw("格式錯誤")
				if(Number(this.lng)===NaN) throw("格式錯誤")
				
				const {map} = this.$InitIns
				const latlng = L.latLng(this.lat, this.lng)
				
				// place pin
				this.$InitIns.addMark(latlng)
				map.flyTo(latlng,10 , {duration: 0.25})

				this.$emit("close")

			}catch(e){
				this.$alert("經緯度" + e, {type:"error"})
			}
		}
	}
}
</script>

<style lang="scss" scoped>
	
	.search{
		margin:0.5rem 0 !important;
		/deep/ {
			.el-input{
				&__prefix{
					left:0;
				}
				&__inner{
					padding-left: 55px;
					border-radius: 999px;
					box-shadow:0 0 6px 3px rgba(0,0,0,0.2);
				}
			}
		}
		.el-button{
			box-shadow:0 0 6px 3px rgba(0,0,0,0.2);
		}
		&>*{
			margin:1rem 0;
		}
		&__locator{
			display: flex;
			/deep/ {
				.el-input{
					&__prefix{
						margin: 0 1rem;
					}
				}
			}
		}
	}

	.selectItems * {
		color: $primary !important;
		font-weight: normal !important;
	}

</style>
