<template lang="pug">
div
	slot(name='header')
		h2 {{ name }}
	.locinfo
		.text {{ locStr }}
		el-tooltip(effect='dark', :content='langTipStr', placement='top')
			el-button(
				style='padding: .5rem;',
				@click='changeLang()',
			)
				font-awesome-icon(icon='language', fixed-width, size='lg')

	//- img.image(
	//- 	v-for='(it, i) in img',
	//- 	:style='imgStyle(i)',
	//- 	:class='cursorClass',
	//- 	:src='it.src',
	//- 	:alt='it.desc',
	//- 	@mousemove="mousemove",
	//- 	@click='changeImg',
	//- )

	el-tabs(
		v-if='img.length > 1',
		style='margin-bottom: 1rem;',
		type='card',
		tab-position='bottom',
		:value='currImgModel',
		@tab-click='handleTabChange',
	)
		template(v-for='(it, i) in img')
			el-tab-pane(
				:key='`img-tab-${i}`',
				:label='(i+1).toString()',
				:name='i.toString()',
			)
				img.image(
					:key='`img-${i}`',
					:class='cursorClass',
					:src='it.src',
					:alt='it.desc',
					@mousemove="mousemove",
					@click='changeImg',
				)

	.imgBox(v-if='img.length == 1')
		img.image(
			:src='img[0].src',
			:alt='img[0].desc',
		)

	el-divider(v-if='img.length == 0')

	template(v-if='toldescribe')
		.text {{ toldescribe }}
	template(v-else)
		.center 暫無簡介

	el-divider(content-position='left') 遊憩活動
	div(v-if='coastalActivities')
		template(v-for='(icon, idx) in coastalActivities')
			el-tooltip(effect='dark', :content='icon.title', placement='top')
				span.icon
					img(:src='basePath + icon.img', :alt='icon.title')
	template(v-else)
		.center 暫無資料

	el-divider(content-position='left') 設施
	div(v-if='amenities')
		template(v-for='(icon, idx) in amenities')
			el-tooltip(effect='dark', :content='icon.title', placement='top')
				span.icon
					img(:src='basePath + icon.img', :alt='icon.title')
	template(v-else)
		.center 暫無資料

	el-divider(content-position='left') 開放時間
	template(v-if='Opentime')
		.center {{ Opentime }}
		.center(v-if='openremark') {{ openremark }}
	template(v-else)
		.center 暫無資料
	el-divider

	template(v-if='Tel || Website || Facebook || Twitter || Video || MapLink')
		.large.info(v-if='Tel')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='`tel:${Tel}`'
			)
				font-awesome-icon(icon='phone-alt', fixed-width)
				| {{ Tel }}

		.large.info(v-if='Website')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='Website'
			)
				font-awesome-icon(icon='external-link-alt', fixed-width)
				| 網站連結(WebSite)

		.large.info(v-if='Facebook')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='Facebook'
			)
				font-awesome-icon(:icon='["fab", "facebook-square"]', fixed-width)
				| Facebook

		.large.info(v-if='Twitter')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='Twitter'
			)
				font-awesome-icon(:icon='["fab", "twitter"]', fixed-width)
				| Twitter

		.large.info(v-if='Video')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='Video'
			)
				font-awesome-icon(icon='photo-video', fixed-width)
				| Video

		.large.info(v-if='MapLink')
			el-link(
				type='primary',
				target='_blank',
				rel='noopener noreferrer nofollow',
				:href='MapLink'
			)
				font-awesome-icon(:icon='["far", "map"]', fixed-width)
				| 地圖連結(MapLink)

		el-divider

	riskTable(
		:RegName='Oname',
		:TableID='Onum',
	)

</template>

<script>
import riskTable from './riskTable';

export default {
	name: 'sightseeingSpot',
	components: {
		riskTable,
	},
	props: [
		'Px',
		'Py',
		'Changtime',

		'CName',
		'CToldescribe',
		'CAdd',
		'EName',
		'EToldescribe',
		'EAdd',

		'CoastalActivities',
		'CoastalAct', // workaround
		'Amenities',

		'Opentime',
		'OpenremarkC',
		'Openremark', // workaround
		'OpenremarkE',
		'Openrema_1', // workaround
		'Tel',
		'Website',
		'Facebook',
		'Twitter',
		'Video',
		'MapLink',

		'Ticketinfo',
		'Remarks',

		'Picture1',
		'Picdescribe1C',
		'Picdescrib', // workaround
		'Picdescribe1E',
		'Picdescr_1', // workaround
		'Picture2',
		'Picdescribe2C',
		'Picdescr_2', // workaround
		'Picdescribe2E',
		'Picdescr_3', // workaround

		'Oname',
		'Onum',
	],
	data: () => ({
		currImg: 0,
		cursorClass: '',

		lang: 'cht', // TODO: i18n
		basePath: './icons_activities/',

		// TODO: i18n
		activityMap: Object.freeze({
			1: '獨木舟',
			2: '風帆船',
			3: '船釣',
			4: '遊艇',
			5: '快艇',
			6: '帆船',
			7: '水上摩托車',
			8: '水面飛行傘',
			9: '滑水/香蕉船/水面飛行艇',
			10: '海上拖曳傘',
			11: '大型風箏',
			12: '游泳',
			13: '水上腳踏車',
			14: '橡皮艇(非動力)',
			15: '風浪板',
			16: '衝浪',
			17: '釣客/垂釣',
			18: '岸際遊覽',
			19: '海邊露營',
			20: '浮潛',
			21: '水肺潛水(岸潛)',
			22: '水肺潛水(船潛)',
			23: '玻璃底船',
			24: '賞鯨',
			25: '跳水',
			26: '開放沙灘',
			27: '開放所有海域活動',
			28: '禁止所有海域活動',
			29: '立槳',
		}),
		amenityMap: Object.freeze({
			1: 'AED',
			2: '廁所',
			3: '女士洗手間',
			4: '男士洗手間',
			5: '救生衣/水上救生設施',
			6: '緊急救護包',
			7: '醫護站',
			8: '服務台/遊客中心',
			9: '露營營地/設施',
			10: '野餐烤肉設施',
			11: '育嬰室/哺集乳設施',
			12: '告示牌/入口意象設施',
			13: '盲人無障礙設施',
			14: '輪椅無障礙設施',
			15: '停車場',
			16: '淋浴間',
			17: '溫泉設施',
			18: '穆斯林友善設施',
		}),
	}),
	computed: {
		name() {
			let ret = this.CName || '';
			switch (this.lang) {
				case 'en':
					ret = this.EName || ret;
					break;
				default:
			}
			return ret;
		},
		toldescribe() {
			let ret = this.CToldescribe || '';
			switch (this.lang) {
				case 'en':
					ret = this.EToldescribe || ret;
					break;
				default:
			}
			return ret;
		},
		img() {
			let out = [];
			if (this.Picture1) {
				out.push({
					src: this.Picture1,
					desc: this.imgDesc(0),
				});
			}
			if (this.Picture2) {
				out.push({
					src: this.Picture2,
					desc: this.imgDesc(2),
				});
			}
			return out;
		},
		locStr() {
			switch (this.lang) {
				case 'en':
					return `longitude ${this.Px}, latitude ${this.Py}`;
					break;
				default:
			}
			return `經度 ${this.Px} 緯度 ${this.Py}`;
		},
		langTipStr() {
			switch (this.lang) {
				case 'en':
					return `切換語系`;
					break;
				default:
			}
			return `change language`;
		},
		coastalActivities() {
			let arr = this.CoastalActivities || this.CoastalAct;
			return arr?.split(',').map((v) => {
				return { img: this.activitieIconUrl(v), title: this.activityMap[v] };
			});
		},
		amenities() {
			return this.Amenities?.split(',').map((v) => {
				return { img: this.amenitiesIconUrl(v), title: this.amenityMap[v] };
			});
		},
		openremark() {
			let ret = this.OpenremarkC || this.Openremark || '';
			switch (this.lang) {
				case 'en':
					ret =  this.OpenremarkE || this.Openrema_1 || ret;
					break;
				default:
			}
			return ret;
		},
		currImgModel() {
			return this.currImg.toString();
		},
	},
	methods: {
		padding(n) {
			if (n < 10) return '0' + n;
			return n;
		},
		activitieIconUrl(id) {
			let ext = 'svg';
			if (id == 29) ext = 'png';
			return `${this.padding(id)}-b.${ext}`;
		},
		amenitiesIconUrl(id) {
			let ext = 'svg';
			return `${this.padding(id)}-a.${ext}`;
		},
		imgDescC(i) {
			switch (i) {
				case 0:
					return this.Picdescribe1C || this.Picdescrib || '';
				case 1:
					return this.Picdescribe2C || this.Picdescr_2 || '';
				default:
			}
		},
		imgDescE(i) {
			switch (i) {
				case 0:
					return this.Picdescribe1E || this.Picdescr_1 || '';
				case 1:
					return this.Picdescribe2E || this.Picdescr_3 || '';
				default:
			}
		},
		imgDesc(i) {
			let desc = this.imgDescC(i) || this.name;
			switch (this.lang) {
				case 'en':
					desc = this.imgDescE(i) || desc;
					break;
				default:
			}
			return desc;
		},
		imgStyle(i) {
			// bad windows: cursor: 'w-resize' == 'e-resize' == ''ew-resize'
			return i == this.currImg ? '' : 'display: none;';
		},
		mousemove(ev) {
			const len = this.img.length;
			if (len <= 1) {
				this.cursorClass = '';
				return;
			}
			let rate = ev.offsetX / ev.target.width;
			if (rate <= 0.32) {
				this.cursorClass = 'arrow-left';
				return;
			}
			if (rate >= 0.68) {
				this.cursorClass = 'arrow-right';
				return;
			}
			this.cursorClass = '';
		},
		changeImg(ev) {
			let rate = ev.offsetX / ev.target.width;
			if (rate <= 0.32) {
				const len = this.img.length;
				this.currImg = (this.currImg - 1 + len) % len;
			}
			if (rate >= 0.68) {
				const len = this.img.length;
				this.currImg = (this.currImg + 1 + len) % len;
			}
		},
		handleTabChange(tab, event) {
			// console.log('[handleTabChange]', this, tab, event);
			this.currImg = parseInt(tab.name);
		},
		changeLang() {
			switch (this.lang) {
				case 'cht':
					this.lang = 'en';
					break;
				case 'en':
					this.lang = 'cht';
					break;
			}
		},
	},
	mounted() {
		console.log('[sightseeingSpot]', this);
	},
};
</script>

<style lang="scss" scoped>
.el-card {
	background-color: #fff;
}

.icon > img {
	height: 32px;
	margin: 0 0.5rem;
}

.image {
	max-width: 100%;
}

.imgBox {
	margin: 1rem 0 1rem 0;
	padding: 0.1rem;
	border: 1px solid #e4e7ed;
	box-sizing: border-box;
}

.center {
	text-align: center;
}

.info {
	margin: 0.5rem 0;
}

.locinfo {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
}

.large,
.large .el-link {
	font-size: xx-large;
}

.carouselImage {
	max-height: 100%;
	margin: 0 auto;
	display: block;
}
/deep/ {
	.arrow-left {
		cursor: url('~@/assets/angle-left-solid.png') 0 16, w-resize;
	}
	.arrow-right {
		cursor: url('~@/assets/angle-right-solid.png') 16 16, e-resize;
	}

	.el-tabs__content {
		margin: 1rem 0 0 0;
		padding: 0.1rem;
		border: 1px solid #e4e7ed;
		border-bottom: none;
		box-sizing: border-box;
	}
	.el-tabs--bottom .el-tabs__header.is-bottom {
		margin-top: 0.1rem;
	}
	.el-tabs__nav-wrap {
		margin-top: -1px;
		border-bottom: unset;
	}
	.el-tabs--card > .el-tabs__header {
		border-top: 1px solid #e4e7ed;
		border-bottom: unset;
	}
	.el-tabs--card > .el-tabs__header .el-tabs__nav {
		border: 1px solid #e4e7ed;
		border-top: none;
		border-radius: 0 0 4px 4px;
		box-sizing: border-box;
	}

	.el-tabs--card > .el-tabs__header .el-tabs__item {
		border-top: 1px solid transparent;
		border-bottom: unset;
	}
	.el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
		border-top-color: #ffffff;
		border-bottom-color: unset;
	}

	.el-carousel__container {
		height: 320px;
	}
	.el-carousel__item {
		height: 100%;
	}
}
</style>
