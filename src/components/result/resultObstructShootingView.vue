<template lang="pug">
.table
	template(v-for='(v, k) in getViewType()')
		.table__col(v-if="(typeof v.showFn === 'function') ? v.showFn(getData(v.k), data) : true")
			.table__col__title {{ v.l || v.k }}
			.table__col__content(v-if='v.lk')
				a.link(:href='data[v.lk]', type='primary', target='_blank', rel='noopener noreferrer nofollow') {{ getData(v.k) }}
			.table__col__content(v-else) {{ (typeof v.fn === 'function') ? v.fn(getData(v.k), data) : getData(v.k) }}

</template>

<script>
import datePicker from '@/components/common/datePicker';

const formatDate = (val, obj) => {
	if (!val) return '--';
	if (val === '--') return val;
	return datePicker.formatDate(val, !!obj['時間']);
};

const shootingView = [
	{ k: 'Category', l: '礙航類別' },
	{ k: 'Unit', l: '單位' },
	{ k: 'date', l: '日期時間', fn: formatDate, showFn: (val, obj) => { return !obj['時間']} },
	{ k: 'date', l: '日期', fn: formatDate, showFn: (val, obj) => { return !!obj['時間']} },
	{ k: '時間', showFn: (val, obj) => { return !!obj['時間']} },
	{ k: 'Central', l: '限制中心' },
	{ k: 'Height', l: '限制高度' },
	{ k: 'Cause', l: '礙航原因' },
	// { k: '坐標系統' },
	{ k: 'AnnounceNo', l: '公告文號' },
	{ k: 'Url', lk: 'Url', l: '原發布公告' },
	{ k: 'Phone', k: '聯絡資訊' },
];
const obstructView = [
	{ k: 'Category', l: '礙航類別' },
	{ k: 'Unit', l: '單位' },
	{ k: 'date', l: '日期時間', fn: formatDate },
	{ k: 'Cause', l: '礙航原因' },
	// { k: '坐標系統' },
	{ k: 'AnnounceNo', l: '公告文號' },
	{ k: 'Url', lk: 'Url', l: '原發布公告' },
	{ k: 'Phone', k: '聯絡資訊' },
];
const prohibitView = [
	{ k: '主管機關' },
	{ k: '限制活動' },
	{ k: '備註' },
	{ k: '違規罰則' },
	{ k: '法令依據' },
	{ k: '坐標系統' },
	{ k: ['限制區域座', '區域座標'], l: '限制區域座標' },
	{ k: ['限制區域文', '區域文字'], l: '限制區域說明' },
	{ k: '公告連結', lk: '公告連結' },
	{ k: '法令連結', lk: '法令連結' },
];

export default {
	name: 'ObstructShootingProhibitView',
	props: {
		data: {
			type: Object,
			default: {},
		},
	},
	computed: {},
	methods: {
		getViewType() {
			switch (this.data.viewtype) {
				case 'obstruct':
					return obstructView;
				case 'shooting':
					return shootingView;
				case 'prohibit':
					return prohibitView;
			}
		},
		getData(key) {
			const data = this.data;
			if (!Array.isArray(key)) return data[key] || '--';
			for (let i=0; i<key.length; i++) {
				let k = key[i];
				if ((k in data) && data[k]) {
					return data[k];
				}
			}
			return '--';
		},
	},
	// mounted() {
	// 	console.log('[ObstructShootingProhibitView]', this);
	// },
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

.center {
	text-align: center;
}

.info {
	margin: 0.5rem 0;
}

.large,
.large .el-link {
	font-size: xx-large;
}
</style>
