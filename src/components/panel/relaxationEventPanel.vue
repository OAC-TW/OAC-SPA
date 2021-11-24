<template lang="pug">
div.content
	splitPages(
		:items='relaxationEventData',
		:isMobile='isMobile',
		:currentPage='currentPage',
		@pageChange="currentPage = $event",
	)
		template(
			v-slot:default='v',
		)
			div.el-card.is-hover-shadow.item(
				:key='v.itemIdx',
				@click='onClick(v)',
			)
				div.el-card__header.itemHeader
					span {{ `${v[1]}` }}
				div.el-card__body
					p {{ `時間: ${v[0]}` }}
					p {{ `性質: ${v[2]}` }}
					p {{ `地點: ${v[3]}` }}
					p {{ `備註: ${v[4]}` }}

</template>

<script>
import splitPages from '@/components/common/splitPages';
export default {
	name: 'relaxationEventPanel',
	components: {
		splitPages,
	},
	props: {
		isMobile: {
			type: Boolean,
		},
	},
	data: () => ({
		currentPage: 1,
		relaxationEventData: [
			[
				'2020.11.18- 2020.11.22 ',
				'台灣國際衝浪公開賽 ',
				'國際賽 ',
				'台東縣金樽港 ',
				'自2010年每年均舉辦 ',
			],
			[
				'2020.09.25- 2020.09.27 ',
				'大鵬灣盃全國帆船錦標賽 ',
				'全國賽 ',
				'大鵬灣國家風景區濱灣公園 ',
				'自2013每年均有舉辦 ',
			],
			[
				'2020.03.08 ',
				'台南亞洲盃鐵人三項競賽 ',
				'國際賽 ',
				'台南市安平觀夕平台 ',
				'自2012年每年舉辦 ',
			],
			[
				'2019.12.21- 2019.12.25 ',
				'「Red Bull紅牛」國際風箏衝浪「空中王者」挑戰賽 ',
				'國際賽 ',
				'苗栗縣竹南假日之森 ',
				'此為亞洲區資格賽 ',
			],
			[
				'2019.10.11- 2019.10.13 ',
				'佳樂水國際衝浪大賽 ',
				'國際賽 ',
				'屏東縣滿州鄉佳樂水 ',
				'自2010年每年均舉辦 ',
			],
			[
				'2019.10.12- 2019.10.13 ',
				'風箏衝浪競賽活動 ',
				'全國賽 ',
				'台中市大安濱海遊憩區 ',
				'自2013年每年均有舉辦 ',
			],
			[
				'2019.09.06- 2019.09.08 ',
				'108學年總統盃全國帆船錦標賽 ',
				'全國賽 ',
				'桃園市竹園海域 ',
				'自2009年每年均有舉辦* ',
			],
			[
				'2019.07.12- 2019.07.14 ',
				'108年台灣盃全國帆船錦標賽 ',
				'全國賽 ',
				'澎湖觀音亭海域 ',
				'自2012年每年均有舉辦* ',
			],
			[
				'2019.04.20- 2019.04.21 ',
				'2019台灣SUP競速聯賽(大鵬灣) ',
				'全國賽 ',
				'大鵬灣濱海遊憩區 ',
				'自2017年年每年均有舉辦 ',
			],
			[
				'2018.04.28- 2018.04.29 ',
				'2018 大鵬灣休閒獨木舟趣味競賽賽 ',
				'全國賽 ',
				'大鵬灣國家風景區濱灣公園 ',
				'自2014-2018每年均有舉辦 ',
			],
		],
	}),
	computed: {},
	methods: {
		onClick(item) {
			console.log('[click]', this, item);
			// this.viewPoint = item;
			// this.$emit('resetScrollTop');
		},
		goBack() {
			// this.viewPoint = null;
			// this.$emit('resetScrollTop');
		},
	},
};
</script>

<style lang="scss" scoped>
.content {
	margin: 0.5rem 1rem;
}
.icon > img {
	height: 32px;
	margin: 0 0.5rem;
	vertical-align: bottom;
}
.el-card.item {
	background-color: #ffffff;
	cursor: pointer;
	margin-bottom: 0.5rem;
}
.itemHeader {
	// background:linear-gradient(to bottom, #006588 5%, #004568 100%);
	background-color: #006588;
	color: #ffffff;
}

/deep/ {
	.el-card__body {
		padding: 0.5rem 1rem;
	}
}
</style>
