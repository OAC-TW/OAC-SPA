<template lang="pug">

.layerWeatherDetail(v-loading="loading")
	.col
		el-button(
			@click="SET_WINDY_OPTION({visible:true});$parent.$emit('close')"
			size="mini"
			round
		)
			div(style="display: flex;align-items: center;")
				img(src="@/assets/windy_icon.png" style="max-width:1.2rem;margin-right:0.5rem;")
				strong Windy 地圖

		el-button(
			@click="$openLink('https://safesee.cwb.gov.tw/V2/')"
			size="mini"
			round
		)
			div(style="display: flex;align-items: center;")
				img(src="@/assets/safesee.png" style="max-width:1.2rem;margin-right:0.5rem;")
				strong 台灣海象災防平台


	transition-group(name='slide-fade-up' class="col" mode="out-in")
		//- grouped parent
		template(v-for="group in weatherLayerGroup")
			h3(v-if="group.name" :key="group.name") {{group.name}}
			template(v-for="lyr in group.data")
				el-button(
					@click="openNormalLyr(lyr.id)"
					:key="lyr.id"
					:title="lyr.title"
					:type="lyr.visible ? 'primary':''"
					size="mini"
					round
				)
					div(style="display: flex;align-items: center;")
						template(v-if="lyr.iconUrl")
							img(:src="lyr.iconUrl" style="max-width:1.2rem;margin-right:0.5rem;")
						template(v-else)
							font-awesome-icon(:icon="lyr.icon" fixed-width style="margin-right:0.5rem;")
						span {{lyr.title}}
				el-tree(
					v-if="lyr.extra == 'list' && !!layerExtra(lyr.id)"
					:key="lyr.id + '-extra'"
					:data="layerExtra(lyr.id)"
					:props="defaultProps"
					@node-click="handleExtraClick"
				)

</template>

<script>

import { mapGetters, mapMutations } from 'vuex'

export default {
	name:"layerWeatherDetail",
	data:()=>({
		loading:false,
		layerGroup: [],
		defaultProps: {
			children: 'data',
			label: 'title'
		},
		layer2extra: {},
		activedCount: 0,
	}),
	async created(){
		this.updateWeatherLayerGroup();

		const visableLayer = this.weatherLayer.filter(l => l.visible);
		this.activedCount = visableLayer.length;
		this.loadVisableExtraAll();
console.log("[layerWeatherDetail]init", this, this.activedCount, visableLayer, this.weatherLayer)
	},
	computed:{
		...mapGetters({
			weatherLayer:"layer/weatherLayer"
		}),
		activedLayer(){
			const {id} = this.$store.state.layer.activedWeatherLyr
			return this.weatherLayer.find(l=>l.id === id)
		},
		weatherLayerGroup(){
			return this.layerGroup
		},
	},
	watch: {
		weatherLayer(newVal, oldVal) {
			this.updateWeatherLayerGroup();
		},
	},
	methods:{
		...mapMutations({
			UPDATE_LAYER_OPTIONS:"layer/UPDATE_LAYER_OPTIONS",
			SET_ACTIVED_WEATHER_DATA:"layer/SET_ACTIVED_WEATHER_DATA",
			SET_WINDY_OPTION:"SET_WINDY_OPTION",
		}),
		// closeAllNormalLyr(){
		// 	this.weatherLayer.forEach(l=>{
		// 		this.$LayerIns.setVisible(l.id,false)
		// 		this.UPDATE_LAYER_OPTIONS({
		// 			id:l.id,
		// 			payload:{visible:false}
		// 		})
		// 	})
		// 	this.SET_ACTIVED_WEATHER_DATA({
		// 		id:'',
		// 		times:[]
		// 	})
		// },
		loadVisableExtraAll() {
			const layers = this.$LayerIns.normalLayerCollection.filter(l => l.visible && l?.lyrOpts?.extra)
			layers.forEach(l => {
				this.loadExtra(l);
			});
		},
		updateLabel() {
			const visableLayer = this.weatherLayer.filter(l => l.visible);
			if (visableLayer.length == 0) {
				this.SET_ACTIVED_WEATHER_DATA({ id:'' });
				return;
			}
			const layer = visableLayer[0];
			this.SET_ACTIVED_WEATHER_DATA({
				id: layer.id,
				times: layer.times,
				legend: layer.lyrOpts?.layerOption,
			});
		},
		updateWeatherLayerGroup() {
			let showGroup = {};
			let showOrder = [];

			let add2showGroup = (group, order, lay) => {
				if(!showGroup[group]) {
					showGroup[group] = [];
					showOrder.push(group);
				}
				showGroup[group].push([lay, order]);
			};
			this.weatherLayer.forEach((lay, i) => {
				let group = lay.group || ''
				if (lay.enable) {
					if (Array.isArray(group)) {
						group.forEach((g, i) => {
							add2showGroup(g.name, g.order, lay);
						});
					} else {
						add2showGroup(group, i, lay);
					}
				}
			})
			this.layerGroup = [];
			while (showOrder.length) {
				let name = showOrder.shift();
				let layers = showGroup[name].sort((a,b) => {
					return a[1] - b[1];
				});
				layers = layers.map(v => v[0]);
				// console.log('[sort]', layers, layers.map(v => v.title));
				this.layerGroup.push({
					name: name,
					data: layers,
				})
			}
			// console.log('updateWeatherLayerGroup', this, this.layerGroup);
		},
		async openNormalLyr(id){
			if(this.loading) return
			try{
				this.loading = true

				const lyrAwaitToActive = this.$LayerIns.normalLayerCollection.find(l=>l.id === id)
				let hasExtra = lyrAwaitToActive?.lyrOpts?.extra;
				console.log("[lyrAwaitToActive Ins]", lyrAwaitToActive, hasExtra)
				if (!lyrAwaitToActive) {
					throw 'layer not found';
				}

				const visible = !lyrAwaitToActive.visible
				this.$LayerIns.setVisible(id, visible) // will auto close conflict layers

				if (!visible) {
					this.activedCount--;
					if (this.activedCount == 0) {
						this.SET_ACTIVED_WEATHER_DATA({ id:'' });
					} else {
						// disable current showing
						if (this.activedLayer && this.activedLayer.id == id) {
							this.updateLabel();
						}
					}
					if (hasExtra) {
						this.layer2extra[id] = null;
					}
					return;
				} else {
					this.activedCount++;
				}

				let payload = {id}
				// 取得 legend 、保存到狀態、重設圖層實例
				if(lyrAwaitToActive.lyrOpts){
					const legend = lyrAwaitToActive.lyrOpts.layerOption;
					payload.legend = legend // mix original propers
					console.log("[activedWLyr legend]", lyrAwaitToActive, legend)
				}

				// 等待完全建構、提交到狀態保存
				if (lyrAwaitToActive.status == "loading") await new Promise(res=>lyrAwaitToActive.once("loaded",()=>res()))
				payload.times = lyrAwaitToActive.times;
				this.SET_ACTIVED_WEATHER_DATA(payload)

				if (hasExtra) {
					this.loadExtra(lyrAwaitToActive);
				} else {
					this.$parent.$emit('close');
				}

			}catch(e){
				console.error("openNormalLyr()", e)
			}finally{
				this.loading = false
				this.updateWeatherLayerGroup();
console.log("[layerWeatherDetail]", this, this.activedCount)
			}
		},
		loadExtra(layer) {
			const marker = layer.getMarker();
			let out = [];
			// TODO: build multi-level
			let i = marker.length;
			marker.forEach(mk => {
				let title = mk?.feature?.properties?.name;
				if (!title) return;
				let order = mk?.feature?.properties?.NO;
				order = (typeof order === 'undefined' || order === null)? i++ : order;
				out.push({
					title: title,
					order: order,
					//mk: Object.freeze(mk),
					mk: Object.assign(mk, { _isVue: true }), // hacky code
				});
			});
			out.sort((a, b) => a.order - b.order);
			this.layer2extra[layer.id] = out;
			console.log('[openNormalLyr]marker', marker, out);
		},
		layerExtra(lyId) {
			//console.log('[layerWeatherDetail][layerExtra]', this, lyId);
			return this.layer2extra[lyId];
		},
		handleExtraClick(data, nodeState, node) {
			//console.log('[extra]', this, data, nodeState, node);
			data.mk.fireEvent("click", {});
		},
	}
}
</script>

<style lang="scss" scoped >

	.col{
		display:flex;
		flex-direction:column;
		overflow: hidden;
	}
	/deep/ {
		.el-button{
			margin: 0.5rem 0 !important;
		}
	}

</style>
