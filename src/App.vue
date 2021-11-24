<template lang="pug">
#app
	//- Windy Map
	div(
		v-if='windyOption.visible',
		style='position: fixed; z-index: 999; left: 0; right: 0'
	)
		el-button(
			type='danger',
			plain,
			style='padding: 0.6rem 0; width: 100%; border-radius: 0',
			@click='SET_WINDY_OPTION({ visible: false })'
		) 
			font-awesome-icon(icon='chevron-left', fixed-width, tansform='left-2')
			strong 返回

		div(v-loading='windyLoading')
			iframe#windy(
				frameborder='0',
				:style='`height:${ifh}px`',
				:src='`https://embed.windy.com/?${windyOption.location}`'
			)

	navbar(:isMobile='isMobile')
	infoPanel(
		:title='panelTitle',
		:useBack='forceUseBack',
		:isMobile='isMobile',
	)
		template(v-slot:default='{resetScrollTop, isShow}')
			keep-alive
				component(
					v-if='viewComp',
					v-bind:is='viewComp',
					v-bind='passProps',
					:isMobile='isMobile',
					@resetScrollTop='resetScrollTop',
					:isShow='isShow',
				)
					//- template(slot='header') {{ '' }}
	mapUI2(
		v-if='mapConstructed',
		ref='mapUI',
		v-bind:openTitle='openPanel'
		:isMobile='isMobile'
	)

	//- Map Container
	#viewDiv(:style='windyOption.visible ? "z-index:-10;" : ""')

	//- Mark Template - reserve for "markClick" event 
	div(ref='mark')
</template>

<script>
import Vue from 'vue';

import { mapGetters, mapActions, mapMutations } from 'vuex';

import navbar from '@/components/navbar';
import infoPanel from '@/components/panel/infoPanel';
import relaxationPanel from '@/components/panel/relaxationPanel';
import ShootingObstructProhibitPanel from '@/components/panel/ShootingObstructProhibitPanel';
import translatePanel from '@/components/panel/translatePanel';
import layerWeatherDetail from '@/components/layer/layerWeatherDetail';
import mapUI2 from '@/components/mapUI2';

import dumpProp from '@/components/result/dumpProp';
import isoheStation from '@/components/result/isoheStation';
import coastWeather from '@/components/result/coastWeather';
import tideTable from '@/components/result/tideTable';
import forecastResult from '@/components/result/forecastResult';
import youtubePlayer from '@/components/youtubePlayer';
import scenicSpot from '@/components/result/scenicSpot';
import sightseeingSpot from '@/components/result/sightseeingSpot';
import yachtArea from '@/components/result/yachtArea';
import fishingPort from '@/components/result/fishingPort';
import fishingPortR from '@/components/result/fishingPortR';
import waterQuality from '@/components/result/waterQuality';
import sandybeach from '@/components/result/sandybeach';
import radiation from '@/components/result/radiation';
import seaSurfaceStorm from '@/components/result/seaSurfaceStorm';

import { Init } from '@/../typescript/dist/init';
import { Layer } from '@/../typescript/dist/layer/layer';
import { marquee } from '@/directives/directives';

function getRequestParm(name) {
	var re = location.search.match(
		'[?&]' + encodeURIComponent(name) + '=([^&]*)',
	);
	if (re) {
		return decodeURIComponent(re[1]);
	}
	return false;
}

export default {
	name: 'app',
	directives: {
		marquee,
	},
	data: () => ({
		loading: null,
		windyLoading: true,
		mapConstructed: false,
		initCate: null,
		initUUIDs: null,
		openPanel: null,
		//
		alertData: [],

		panelTitle: '',
		forceUseBack: false,
		viewComp: null,
		passProps: {},
	}),
	components: {
		navbar,
		infoPanel,
		mapUI2,
		isoheStation,
		coastWeather,
	},
	computed: {
		...mapGetters(['isMobile', 'windyOption', 'screenWidth', 'screenHeight']),
		...mapGetters({
			openedPanel: 'openedPanel',
		}),
		ifh() {
			// iframe 高度 減 上方按鈕高度
			return window.innerHeight - 32;
		},
	},
	watch: {
		'windyOption.visible': {
			handler(bool) {
				if (!bool) return;
				this.windyLoading = true;
				this.$nextTick(() => {
					const Iframe = this.$el.querySelector('#windy');
					Iframe.onload = () => (this.windyLoading = false);
				});
			},
		},
		openedPanel(newVal, oldVal) {
			console.log(`[openedPanel] ${oldVal} -> ${newVal}`);

			if (newVal === '') return;
			this.setOpenPanel(newVal);
		},
	},
	async mounted() {
		this.loading = this.$loading({
			lock: true,
			text: '圖資載入中',
			spinner: 'el-icon-loading',
			background: 'rgba(0, 0, 0, 0.8)',
		});

		var initPos = {
			center: ['23.830576', '121.20172'],
			zoom: 7,
		};
		var loc = getRequestParm('loc');
		if (loc) {
			var p = loc.split(',');
			initPos.center = [p[0], p[1]];
			initPos.zoom = p[2];
		} else {
			if (localStorage.getItem('location')) {
				const p = localStorage.getItem('location').split(',');
				initPos.center = [p[0], p[1]];
				initPos.zoom = p[2];
			}
		}
		Vue.prototype.$InitIns = new Init('viewDiv', initPos);
		this.mapConstructed = true;
		this.loadLayer();
	},
	methods: {
		...mapActions({
			commitOpenPanel: 'openPanel',
		}),
		...mapMutations({
			UPDATE_LAYER_OPTIONS:"layer/UPDATE_LAYER_OPTIONS",
			UPDATE_BASELAYER_OPTIONS:'layer/UPDATE_BASELAYER_OPTIONS',
			SET_LAYER_PIN: 'layer/SET_LAYER_PIN',
			SET_LAYER_CARD_AUTO_SCROLL: 'SET_LAYER_CARD_AUTO_SCROLL',
		}),
		setPanelView(comp, prop, title = '', forceUseBack = true) {
			this.forceUseBack = forceUseBack;
			this.viewComp = comp;
			this.passProps = prop;
			this.panelTitle = title;
			console.log('[setPanelView]', this, comp, prop);
		},
		setOpenPanel(key) {
			let key2comp = {
				relaxation: relaxationPanel,
				obstruct: ShootingObstructProhibitPanel,
				weather: layerWeatherDetail,
				translate: translatePanel,
			};
			let comp = key2comp[key];
			if (!comp) return;

			let key2title = {
				relaxation: '海域遊憩',
				obstruct: '射擊礙航',
				weather: '海情海象',
				translate: '翻譯',
			};
			this.setPanelView(comp, null, key2title[key] || key, !comp);
		},
		...mapMutations({
			SNAPSHOT_RAW_LAYER: 'layer/SNAPSHOT_RAW_LAYER',
			SET_ACTIVED_WEATHER_DATA: 'layer/SET_ACTIVED_WEATHER_DATA',
			SET_RESULT: 'result/SET_RESULT',
			SET_CARD_VISIBLE: 'SET_CARD_VISIBLE',
			SET_WINDY_OPTION: 'SET_WINDY_OPTION',
		}),
		async eventHandler() {
			const lay = this.$LayerIns;
			const ins = this.$InitIns;
			const map = this.$InitIns.map;
			map.on({
				typhoonAlert: ({ data }) => {
					const h = this.$createElement;
					const ele = h(
						'div',
						{
							style:
								'display: flex;align-items: center;white-space: nowrap;height:0;',
						},
						[
							h('strong', { style: 'margin-right:0.5rem;' }, '颱風警報'),
							h(
								'div',
								{
									directives: [
										{
											name: 'marquee',
											value: {
												width: '60vw',
												play: true,
											},
										},
									],
								},
								data,
							),
							h(
								'el-button',
								{
									props: { type: 'text' },
									on: {
										click: () => {
											this.$message.closeAll();
										},
									},
								},
								[
									h('i', {
										class: 'el-icon-close',
										style: 'color:red;',
									}),
								],
							),
						],
					);
					console.log(' [ typhoonAlert ] ', data);

					this.$message.closeAll();
					this.$message({
						message: ele,
						duration: 0,
						type: 'warning',
					});
				},
				moveend: (evt) => {
					const lat = map.getCenter().lat;
					const lng = map.getCenter().lng;
					const zoom = map.getZoom();
					const locStr = `${lat},${lng},${zoom}`;
					localStorage.setItem('location', `${locStr}`);
					this.SET_WINDY_OPTION({ location: `${locStr}` });
					let url = `?loc=${locStr}`;
					if (this.initCate) url += `&cate=${this.initCate}`;
					if (this.initUUIDs) url += `&uuid=${this.initUUIDs}`;
					if (this.openPanel) url += `&panel=${this.openPanel}`;
					history.replaceState(null, document.title, url);
				},
				markerClick: async ({ dataType, layer, data, event }) => {
					console.log('[markerClick]', {
						dataType,
						layer,
						data,
						event,
					});
					switch (dataType) {
						case 'isoheStation':
							const drawerIns = this.$drawer({
								props: {
									title: '',
									size: this.isMobile ? '100%' : '400px',
									direction: 'btt',
								},
								on: {
									close: () => {
										console.log('drawer close');
									},
								},
							});
							drawerIns.open(
								{ ...isoheStation, store: this.$store },
								{
									props: { data },
								},
							);
							break;
						case 'tidal':
							this.$drawer({
								props: {
									title: '',
									size: this.isMobile ? '100%' : '80vh',
									direction: 'btt',
								},
								on: {
									close: () => {
										console.log('drawer close');
									},
								},
							}).open(
								{ ...tideTable, store: this.$store },
								{
									props: {
										data,
										layer,
									},
								},
							);
							break;
						case 'forecast':
							this.$drawer({
								props: {
									title: '',
									size: this.isMobile ? '100%' : '80vh',
									direction: 'btt',
								},
								on: {
									close: () => {
										console.log('drawer close');
									},
								},
							}).open(
								{ ...forecastResult, store: this.$store },
								{
									props: {
										data: data.data,
										tab: data.tab,
										layer: layer,
									},
								},
							);
							break;
						case 'cctv':
							console.log('[CCTV]', this, data, layer, event);
							let url = data?.note;
							let title = data?.name;
							if (!url || !title) return;
							this.$drawer({
								props: {
									title: title,
									size: this.isMobile ? '100%' : '80vh',
									direction: 'btt',
								},
								on: {
									close: () => {
										console.log('drawer close');
									},
								},
							}).open(
								{ ...youtubePlayer, store: this.$store },
								{
									props: {
										url,
										data,
									},
								},
							);
							break;
						case 'dump':
							this.showPopup(layer, { data }, dumpProp);
							break;
						case 'sightseeingSpot':
							this.setPanelView(sightseeingSpot, data);
							this.commitOpenPanel('');
							break;
						default:
							let type2comp = {
								scenicSpot: scenicSpot,
								yachtArea: yachtArea,
								fishingPort: fishingPort,
								fishingPortR: fishingPortR,
								//'sightseeingSpot': sightseeingSpot,
								waterQuality: waterQuality,
								sandybeach: sandybeach,
								radiation: radiation,
								seaSurfaceStorm: seaSurfaceStorm,
							};
							let comp = type2comp[dataType];
							if (!comp) {
								setTimeout(() => layer.openPopup(), 100);
								return;
							}
							this.showPopup(layer, data, comp);
					}
				},
				click: (ev) => {
					//let layers = lay.getLayersAt(ev.containerPoint);
					//console.log("[map.click]", layers)
					let result = lay.query(ev.latlng, map);
					console.log('[geojsonClick Result]', result);

					if (!result.length) return;

					let hasDrawer = false;
					for (const r of result) {
						if (r.layerTitle === '海面天氣預報(近海海象)') {
							const { data } = r;
							const drawerIns = this.$drawer({
								props: {
									title: data.locationName,
									size: this.isMobile ? '100%' : '400px',
									direction: 'btt',
								},
								on: {
									close: () => {
										console.log('drawer close');
									},
								},
							});
							drawerIns.open(
								{ ...coastWeather, store: this.$store },
								{
									props: { data },
								},
							);
							hasDrawer = true;
						} else {
							this.SET_RESULT(r);
						}
					}
					if (!hasDrawer) {
						this.SET_CARD_VISIBLE({ key: 'layer', bool: false });
						this.SET_CARD_VISIBLE({ key: 'result', bool: true });
					}
				},
			});
		},
		showPopup(mk, data, comp, popupOpt = {}) {
			let vm = new Vue({
				render: (h) => h(comp, { props: data }),
			});
			let el = vm.$mount().$el;
			mk.unbindPopup().bindPopup(el, {
				maxHeight: this.screenHeight * 0.8,
				minWidth: 250,
				maxWidth: this.screenWidth * 0.8,
				...popupOpt,
			});
			mk.openPopup();
			return el;
		},
		async layerHandler(cate, uuid, panel) {
			const layerDef = await (await fetch('./layerDef.json')).json();

			Vue.prototype.$LayerIns = new Layer(this.$InitIns.map, layerDef.catelog);
			this.eventHandler();

			// TODO: better way
			this.$LayerIns._setVisible = this.$LayerIns.setVisible;
			this.$LayerIns.setVisible = (id, visible) => {
				// basemap
				if (visible === undefined) {
					this.$LayerIns._setVisible(id);
					return;
				}
				console.log('[setVisible]', id, visible, this.$LayerIns.isPinned(id));
				const pinned = this.$LayerIns.isPinned(id);
				if (pinned && !visible) return;
				const autoClosed = this.$LayerIns._setVisible(id, visible)
				this.UPDATE_LAYER_OPTIONS({
					id: id,
					payload: {visible:visible},
				});
				autoClosed.forEach((l, idx) => {
					this.UPDATE_LAYER_OPTIONS({
						id: l.id,
						payload: {visible:false},
					});
				});
				return autoClosed;
			};
			this.$LayerIns._setPin = this.$LayerIns.setPin;
			this.$LayerIns.setPin = (id, pin) => {
				console.log('[setPin]', id, pin, this.$LayerIns.isPinned(id));
				this.$LayerIns._setPin(id, pin);
				this.SET_LAYER_PIN({ id, pin });
			};


			/** baselayer must before normal -> "zoom" */
			this.$LayerIns.addBaseLayer(layerDef.baseLayers);

			if (Array.isArray(layerDef.layers)) {
				let hasCate = !!cate;
				let hasUUID = uuid && uuid.length > 0;

				if (hasCate) {
					this.initCate = cate;
				}
				if (!hasCate && hasUUID) {
					cate = 'force';
				}
				if (hasCate || hasUUID) {
					layerDef.layers.forEach((l, idx) => {
						let found = l.catelog.find((c) => c == cate || c == 'force');
						l.visible = !!found;
						if (l.visible) console.log('[layer][cate]', l.title, l.uuid);
					});
				}
				if (hasUUID) {
					this.initUUIDs = uuid.join(',');
					layerDef.layers.forEach((l, idx) => {
						let found = uuid.indexOf(l.uuid);
						l.visible = l.visible || found >= 0;
						if (l.visible) console.log('[layer][uuid]', l.title, l.uuid);
					});
				}

				// pin catelog == force
				layerDef.layers.forEach((l, idx) => {
					let found = l?.catelog.find((c) => c == 'force');
					if (found) {
						console.log('[layer][pin]', l.title, l.uuid);
						this.$LayerIns.setPin(l.uuid, true);
					}
				});
			}
			await this.$LayerIns.addLayer(layerDef.layers);

			console.log('%c $layerIns:', 'background:red;', this.$LayerIns);

			this.SNAPSHOT_RAW_LAYER({
				type: 'baseLayer',
				payload: this.$LayerIns.baseLayerColletion
					.map(
						({
							type,
							id,
							title,
							name,
							dataSet,
							opacity,
							visible,
							imgUrl,
							catelog,
							tag,
						}) => ({
							type,
							id,
							title,
							name,
							dataSet,
							opacity,
							visible,
							imgUrl,
							catelog,
							tag,
						}),
					)
					.reverse(),
			});
			this.SNAPSHOT_RAW_LAYER({
				type: 'layer',
				payload: this.$LayerIns.normalLayerCollection
					.map(
						({
							type,
							title,
							name,
							id,
							icon,
							iconUrl,
							dataSet,
							opacity,
							visible,
							sortable,
							legendColor = '145,145,145',
							catelog,
							tag,
							group,
							enable,
							lyrOpts,
						}) => {
							return {
								type,
								title,
								name,
								id,
								icon,
								iconUrl,
								dataSet,
								opacity,
								visible,
								sortable,
								legendColor,
								catelog,
								tag,
								group,
								enable,
								extra: lyrOpts?.extra,
							};
						},
					)
					.reverse(),
			});

			// Only first layer which need/has legend
			const lyrAwaitToActive = this.$LayerIns.normalLayerCollection.find(
				(l) => l.visible && l.lyrOpts?.layerOption?.colorScaleValue,
			);
			console.log('[lyrAwaitToActive Ins]', lyrAwaitToActive);
			if (lyrAwaitToActive) {
				let payload = { id: lyrAwaitToActive.id };
				// 取得 legend 、保存到狀態、重設圖層實例
				if (lyrAwaitToActive.lyrOpts) {
					const legend = lyrAwaitToActive.lyrOpts.layerOption;
					payload.legend = legend; // mix original propers
					console.log('[activedWLyr legend]', lyrAwaitToActive, legend);
				}

				// 等待完全建構、提交到狀態保存
				if (lyrAwaitToActive.status == 'loading')
					await new Promise((res) =>
						lyrAwaitToActive.once('loaded', () => res()),
					);
				payload.times = lyrAwaitToActive.times;
				this.SET_ACTIVED_WEATHER_DATA(payload);
			}

			if (panel) {
				this.openPanel = panel;
				if (panel.startsWith('$')) {
					this.SET_CARD_VISIBLE({ key: panel.slice(1), bool: true }); // eg: 'panel=$layer'
				} else {
					this.commitOpenPanel(panel);
				}
			}
		},
		async loadLayer() {
			try {
				let cate = getRequestParm('cate');
				let uuid = getRequestParm('uuid');
				if (uuid && uuid !== '') {
					uuid = uuid.split(',').filter((id) => id !== '');
				}
				let panel = getRequestParm('panel');
				console.log('[RequestParm]', cate, uuid, panel);
				if (panel === '$layer' && getRequestParm('autoscroll')) {
					this.SET_LAYER_CARD_AUTO_SCROLL(true);
				}
				await this.layerHandler(cate, uuid, panel);
			} catch (e) {
				console.error(e);
				this.$alert(`地圖載入過程發生錯誤 : ${e}`, { type: 'error' });
			} finally {
				this.loading.close();
			}
		},
	},
};
</script>

<style lang="scss">
#windy {
	width: 100%;
	z-index: 999;
}

#viewDiv {
	position: fixed;
	top: 0;
	left: 0;
	right: auto;
	bottom: auto;
	padding: 0;
	margin: 0;
	height: 100%;
	width: 100%;
	z-index: 0;
}
</style>
