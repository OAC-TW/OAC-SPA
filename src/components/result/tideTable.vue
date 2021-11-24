<template lang="pug">
.popup(v-if='data')
	pageHeader(:useBack='false', :title='`${data.locationName}`')
		el-link(
			:href='data.opendataLinkUrl',
			target='_blank',
			rel='noopener',
			icon='el-icon-question',
			style='float: right; margin: 0.5rem 0',
			title='查看資料來源'
		)

	.picker
		el-button(
			type='info',
			icon='el-icon-arrow-left',
			:disabled='prevDayDis()',
			@click='currentDateIdx -= currentDateIdx > 0 ? 1 : 0'
		)
		el-date-picker(
			type='date',
			:clearable='false',
			placeholder='跳到',
			popper-class='date-picker',
			v-model='currentDate',
			:picker-options='pickerOptions'
		)
		el-button(
			type='info',
			icon='el-icon-arrow-right',
			:disabled='nextDayDis()',
			@click='currentDateIdx += 1'
		)

	//- 項目卡片
	.cardGrid
		//- tideData
		template(v-if='dataModel')
			h3.info 農曆: {{ dataModel.lunarDate }}
			h3.info 潮差: {{ dataModel.tidalRange }}
			template(v-for='(obj, idx) in dataModel.time')
				el-card.dataCard(shadow='hover')
					.dataCard__row
						h3 {{ getDateTime(obj["時間"]) }}
					.dataCard__row
						el-card.dataCard(shadow='hover')
							.dataCard__row
								h3 潮汐
								span
									h3.caption
										big {{ obj["潮汐"] }}

						el-card.dataCard(shadow='hover')
							.dataCard__row
								h3 潮高(TWVD)
								span
									h3.caption
										big {{ obj["潮高(TWVD)"] }}
									el-tag(type='warning', size='medium') {{ obj["潮高(TWVD).unit"] }}
					.dataCard__row
						el-card.dataCard(shadow='hover')
							.dataCard__row
								h3 潮高(當地)
								span
									h3.caption
										big {{ obj["潮高(當地)"] }}
									el-tag(type='warning', size='medium') {{ obj["潮高(當地).unit"] }}

						el-card.dataCard(shadow='hover')
							.dataCard__row
								h3 潮高(相對海圖)
								span
									h3.caption
										big {{ obj["潮高(相對海圖)"] }}
									el-tag(type='warning', size='medium') {{ obj["潮高(相對海圖).unit"] }}
</template>

<script>
import pageHeader from '@/components/common/pageHeader';

/** @see https://nightcatsama.github.io/vue-slider-component/#/zh-CN/advanced/components-slots */
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

export default {
	name: 'popup',
	components: {
		VueSlider,
		pageHeader,
	},
	data: () => ({
		currentDateIdx: 0,
		time: null,
	}),
	props: {
		data: {
			type: Object, // {title,type,data,opendataLinkUrl}
		},
		layer: {
			lyr: Object,
		},
	},
	computed: {
		pickerOptions() {
			return {
				disabledDate: (time) => {
					if (!this.time) return true;
					const firstData = this.time[0];
					const lastData = this.time[this.time.length - 1];
					const select = time.getTime();
					return (
						select < firstData.startTime ||
						select >= lastData.endTime
					);
				},
			};
		},
		dataModel() {
			if (!this.time) return null;
			console.log('dataModel()', this, this.time, this.currentDateIdx);
			return this.time[this.currentDateIdx];
		},
		currentDate: {
			get() {
				return this.time
					? this.time[this.currentDateIdx].startTime
					: null;
			},
			set(time) {
				this.time?.every((obj, index) => {
					const t0 = obj.startTime;
					const t1 = obj.endTime;
					if (time < t0 || time >= t1) {
						return true;
					}
					this.currentDateIdx = index;
					return false;
				});
				//console.log("[currentDate]set", this, time);
			},
		},
	},
	async created() {
		//		console.log("tideTable0", this, this.data);
		const url = this.layer.lyr.lyrOpts.url.replace(
			/geo_index.json$/gi,
			this.data.detailfilename
		); // TODO: not hardcoded
		const detail = await (await fetch(url)).json();
		const time = [];
		detail.time.forEach((val, idx) => {
			let ele = val.weatherElement;
			let obj = {
				startTime: new Date(val.validTime.startTime),
				endTime: new Date(val.validTime.endTime),
				lunarDate: ele[0].value,
				tidalRange: ele[1].value,
				time: [],
			};
			ele[2].time.forEach((val, idx) => {
				let d = val.weatherElement;
				let dd = {};
				dd[d[0].elementName] = d[0].value;
				dd[d[1].elementName] = d[1].value;
				dd[d[2].elementName] = d[2].elementValue.value;
				dd[d[2].elementName + '.unit'] = d[2].elementValue.measures;
				dd[d[3].elementName] = d[3].elementValue.value;
				dd[d[3].elementName + '.unit'] = d[3].elementValue.measures;
				dd[d[4].elementName] = d[4].elementValue.value;
				dd[d[4].elementName + '.unit'] = d[4].elementValue.measures;
				obj.time.push(Object.freeze(dd));
			});
			time.push(Object.freeze(obj));
		});
		this.time = time;
		//		console.log("tideTable", this, this.time);
	},
	mounted() {},
	methods: {
		getDateTime(datetime) {
			return new Date(datetime).toLocaleString();
		},
		nextDayDis() {
			if (!this.time) return true;
			return this.currentDateIdx + 1 >= this.time.length;
		},
		prevDayDis() {
			if (!this.time) return true;
			return this.currentDateIdx <= 0;
		},
	},
};
</script>

<style lang="scss">
.el-picker-panel.el-date-picker.el-popper.date-picker {
	max-width: unset;
}
</style>
<style lang="scss" scoped>
.popup {
	margin: 0 auto;
	max-width: 90vw;
	min-width: 300px;
}

.caption {
	color: $primary;
	display: inline;
	margin: 0 0.5rem;
}

.picker {
	display: table;
	margin: 0 auto;
}

.el-date-editor.el-input.el-input--prefix.el-input--suffix.el-date-editor--date {
	max-width: max-content;
}

/deep/ {
	.el-tag,
	.el-card {
		border-radius: 1rem;
	}
	.el-tag {
		margin-left: 0.5rem;
	}
	.el-card {
		background-color: #fff;
		&__body {
			line-height: 150%;
		}
	}
}

.scroll {
	width: 100%;
	overflow: hidden;
	&__wrapper {
		white-space: nowrap;
	}
	&__content {
		display: inline-block;
	}
	&__item {
		display: inline-block;
		padding: 1rem;
		margin: 0.5rem;
		border-radius: 1rem;
		border: 1px solid $info;
	}
}

.cardGrid {
	flex-wrap: wrap;
	/*	display: flex;
	align-items: center;
	margin: 0 -0.5rem;*/
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
</style>
