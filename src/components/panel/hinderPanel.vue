<template lang="pug">
.layerHinderDetail(v-loading='loading')
	template(v-if='!getData.length')
		.center(style='font-size: 1.5rem') 暫無資料
	el-collapse(v-else, v-model='activeNames', @change='handleChange')
		template(v-for='(row, idx) in getData')
			el-collapse-item(
				v-if='!isOutdate(row)',
				:title='formatTitle(row)',
				:name='idx'
			)
				el-card.dataCard(shadow='never')
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 通報單位
								span.caption {{ row["通報單位"] }}
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 礙航類別
								span.caption {{ row["礙航類別"] }}
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 礙航原因
								span.caption {{ row["礙航原因"] }}
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 時段
								span.caption {{ getDateTime(row["開始時間"]) }} ~ {{ getDateTime(row["結束時間"]) }}
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 單位
								span.caption {{ row["單位"] }}
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 座標系統
								span.caption {{ row["座標系統"] }}
					.dataCard__row
						el-card.dataCard(
							shadow='never',
							style='cursor: pointer',
							@click.native='showCenter(row["區域中心"], row["限制區域"], true)'
						)
							.dataCard__row
								h3 限制區域
								span.caption {{ row["限制區域"] }}
								el-tag(type='warning', size='medium')
									font-awesome-icon(icon='map-pin', fixed-width)
					.dataCard__row
						el-card.dataCard(
							shadow='never',
							style='cursor: pointer',
							@click.native='showCenter(row["區域中心"], row["限制區域"], true)'
						)
							.dataCard__row
								h3 區域中心
								span.caption {{ row["區域中心"] }}
								el-tag(type='warning', size='medium')
									font-awesome-icon(icon='map-pin', fixed-width)
					.dataCard__row
						el-card.dataCard(shadow='never')
							.dataCard__row
								h3 限制高度
								span.caption {{ row["限制高度"] }}
					.dataCard__row(v-if='row["公告網址"]')
						el-card.dataCard(shadow='never')
							a.dataCard__row(
								:href='row["公告網址"]',
								target='_blank',
								rel='noopener noreferrer nofollow',
								style='color: inherit; text-decoration: inherit'
							)
								h3 公告網址
								span.caption
									font-awesome-icon(:icon='["fas", "external-link-alt"]', fixed-width)
</template>

<script>
import { mapMutations } from 'vuex';

export default {
	name: 'hinderPanel',
	data: () => ({
		loading: false,
		mappedData: [],
		activeNames: [],
	}),
	props: {
		data: Array,
		dataUrl: String,
		drawLayerID: String,
		autoExpand: {
			type: Boolean,
			default: false,
		}
	},
	watch: {
		// '$props':{
		// 	handler: function (val, oldVal) {
		// 		// console.log('watch all prop', val, oldVal);
		// 		this.init();
		// 	},
		// 	deep: true,
		// },
		data(newVal, oldVal) {
			this.init();
		},
		autoExpand(newVal, oldVal) {
			this.init();
		},
	},
	async created() {
		this.init();
		console.log('[hinderPanel][created]', this, this.data, this.mappedData);
	},
	computed: {
		getData() {
			return this.mappedData || [];
		},
	},
	methods: {
		...mapMutations({
			UPDATE_LAYER_OPTIONS: 'layer/UPDATE_LAYER_OPTIONS',
		}),
		getDateTime(datetime) {
			return new Date(datetime).toLocaleString();
		},
		formatTitle(row) {
			let t0 = new Date(row['開始時間']);
			return `${t0.toLocaleDateString()} - ${row['通報單位']}`;
		},
		isOutdate(row) {
			let t0 = new Date(row['結束時間']);
			let now = new Date();
			return now > t0;
		},
		transReg(str) {
			return JSON.parse('[' + str + ']');
		},
		drawRegion(layer, regStr, flyTo) {
			let pts = this.transReg(regStr);
			let newGeojson = {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						geometry: {
							type: 'Polygon',
							coordinates: [pts],
						},
						properties: {},
					},
				],
			};
			layer.clearLayers();
			layer.addData(newGeojson);

			// show up
			this.$LayerIns.setVisible(this.drawLayerID, true);
			this.UPDATE_LAYER_OPTIONS({
				id: this.drawLayerID,
				payload: { visible: true },
			});

			if (flyTo) {
				const bound = layer.getBounds();
				if (!bound) return;
				this.$InitIns.map.flyToBounds(bound, { padding: [50, 50] });
			}
		},
		showCenter(centerStr, regStr, flyTo) {
			const layer = this.$LayerIns.normalLayerCollection.find(
				(l) => l.id == this.drawLayerID
			);
			if (!layer) {
				throw 'draw layer not found!';
				return;
			}
			let loc = JSON.parse(centerStr);
			loc = L.latLng(loc[1], loc[0]);
			this.$InitIns.addMark(loc);
			console.log('[hinderPanel][center]click', this, regStr, layer, loc);

			this.drawRegion(layer, regStr, flyTo);
		},
		handleChange(val) {
			if (val.length == 0) {
				// clear
				const layer = this.$LayerIns.normalLayerCollection.find(
					(l) => l.id == this.drawLayerID
				);
				if (layer) layer.clearLayers();
				this.$InitIns.removeMark();
			}
			let rowIdx = val[val.length - 1];
			let row = this.mappedData[rowIdx];
			console.log('[hinderPanel]onChange', this, val, row);
			if (!row) return;
			this.showCenter(row['區域中心'], row['限制區域'], false);
		},
		init() {
			if (Array.isArray(this.data)) {
				let now = new Date();
				this.mappedData = this.data.filter(
					(row) => now <= new Date(row['結束時間'])
				);
			}
			if (this.autoExpand && this.mappedData.length > 0) {
				this.activeNames.push(0);
				this.handleChange(this.activeNames);
			}
		},
	},
};
</script>

<style lang="scss" scoped >
/deep/ {
	.el-button {
		margin: 0.5rem 0 !important;
	}
}

.caption {
	color: $primary;
	display: inline;
	margin: 0 0.5rem;
	font-weight: 700;
}

/deep/ {
	.el-card {
		border-radius: 1rem;
		background-color: #fff;
		&__body {
			line-height: 150%;
		}
	}
}

.cardGrid {
	flex-wrap: wrap;
}

.dataCard {
	flex: 1 1 300px;
	margin: 0.5rem;
	&--actived {
		background-color: rgba($primary, 0.1);
		border: 1px solid $primary;
	}
	@media screen and (max-width: 768px) {
		flex: 1 1 300px;
		&--actived {
			position: sticky;
			bottom: 1rem;
			background-color: $primary;
			color: #ffffff;
			.caption {
				color: #ffffff;
			}
		}
	}
	&__row {
		& > * {
			margin: 0;
		}
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
}

.center {
	text-align: center;
}
</style>
