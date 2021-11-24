<template lang="pug">
.waterquality-popup
	h3.header 測站: {{ STATION_NAME }}
	p.location {{ locStr }}
	//- .table
	//- 	template(v-for='(v, k) in getViewType()')
	//- 		.table__col(v-if='isShow(v.k, v)' :class='{ stderr: !isStdOk(v.k, v) }')
	//- 			.table__col__title {{ v.l || v.k }}
	//- 			.table__col__content
	//- 				| {{ getData(v.k, v) }}
	//- 				span {{ getStd(v.k, v) }}

	template(v-for='(v, k) in getViewType()')
		.row(:class='{ stderr: !isStdOk(v.k, v) }')
			| {{ `${v.l || v.k}: ${getData(v.k, v)} ${getStd(v.k, v)}` }}
</template>

<script>
const view = [
	{ k: 'SAMPLE_DATE', l: '最新監測日期', u: '' },
	{ k: 'TEM_AIR', l: '氣溫', u: '℃' },
	{ k: 'TEM_WATER', l: '水溫', u: '℃' },
	{ k: 'SALINITY', l: '鹽度', u: 'psu' },
	{ k: 'PH', l: 'PH', u: '', std: [7.5, 8.5] }, // 標準值:7.5-8.5
	{ k: 'DO_S', l: '溶氧量(電極法)', u: 'mg/L', std: [5] }, // 標準值:5以上
	{ k: 'CHL_a', l: '葉綠素a', u: 'μg/L' },

	{ k: 'Cd', l: '鎘', u: 'mg/L', std: [null, 0.005] }, // 標準值:0.005以下
	{ k: 'Cr', l: '鉻', u: 'mg/L', std: [null, 0.05] }, // 標準值:0.05以下
	{ k: 'Cu', l: '銅', u: 'mg/L', std: [null, 0.03] }, // 標準值:0.03以下
	{ k: 'Zn', l: '鋅', u: 'mg/L', std: [null, 0.5] }, // 標準值:0.5以下
	{ k: 'Pb', l: '鉛', u: 'mg/L', std: [null, 0.01] }, // 標準值:0.01以下
	{ k: 'Hg', l: '汞', u: 'mg/L', std: [null, 0.001] }, // 標準值:0.001以下
];

export default {
	name: 'waterQuality',
	props: [
		'STATION_NAME',
		'lon',
		'lat',
		'SAMPLE_DATE',
		'TEM_AIR',
		'TEM_WATER',
		'SALINITY',
		'PH',
		'DO_S',
		'CHL_a',
		'Cd',
		'Cr',
		'Cu',
		'Zn',
		'Pb',
		'Hg',
	],
	computed: {
		locStr() {
			return `經度 ${this.lon.toFixed(5)} 緯度 ${this.lat.toFixed(5)}`;
		},
	},
	data: () => ({}),
	methods: {
		getViewType() {
			return view;
		},
		isShow(key, info) {
			if (typeof info.show !== 'function') return true;
			return info.show(this[key], this);
		},
		isStdOk(key, info) {
			let val = this[key];
			if (val == null || val === undefined) return true;
			if (typeof val !== 'number') return true;
			let std = info.std;
			if (!Array.isArray(std)) return true;
			if (std.length == 2) {
				if (std[0] == null) return val <= std[1];
				return std[0] <= val && val <= std[1];
			}
			return std[0] <= val;
		},
		getData(key, info) {
			const data = this;
			let val = data[key] || null;
			if (info.parse) {
				val = info.parse(val, data);
			} else {
				val = val || '--';
				if (val === 'ND') val = '--';
			}
			let unit = info.u ? ` ${info.u}` : '';
			return `${val}${unit}`;
		},
		getStd(key, info) {
			let std = info.std;
			if (!Array.isArray(std)) return '';
			if (std.length == 2) {
				if (std[0] == null) return `(標準值: ${std[1]}以下)`;
				return `(標準值: ${std[0]}-${std[1]})`;
			}
			return `(標準值: ${std[0]}以上)`;
		},
	},
	mounted() {},
};
</script>

<style lang="scss" scoped>
.header {
	margin: 0.5rem;
}

.location, .row {
	margin: 0.1rem 0.5rem;
}

.row.stderr {
	font-weight: 700;
	color: #f00;
}

.table {
	display: flex;
	flex-wrap: wrap;
	// line-height: 150%;
	// margin: 0 0 1rem 0;
	width: 100%;
	margin-top: .4rem;
	.link {
		color: darken($primary, 20);
		font-weight: bold;
		justify-content: flex-start;
	}
	&__col.stderr {
		font-weight: 700;
		color: #f00;
	}
	&__col {
		width: auto;
		flex: 1 0 100%;
		display: flex;
		align-items: flex-start;
		box-sizing: border-box;

		transition: all 0.2s ease;
		&:not(:nth-last-of-type(1)) {
			border-bottom: 1px dashed rgba($info, 0.7);
		}
		&:nth-of-type(odd) {
			background-color: rgba($info, 0.1);
		}
		&:hover {
			background-color: rgba($primary, 0.1);
		}

		&__title,
		&__content,
		&__content-file {
			padding: 0.1rem 0.5rem;
			text-align: left;
		}
		&__title {
			align-self: stretch;
			flex: 0 0 30%;
		}
		&__content {
			flex: 1 1 85%;
			background-color: transparent;
			display: flex;
			flex-direction: column;
			word-break: break-all;
			overflow: hidden;
		}
		&__content-file {
			a {
				margin: 0.5rem 0;
				color: rgba($primary, 1);
				display: flex;
				align-items: center;
			}
		}
	}
}
</style>
