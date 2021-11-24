<template lang="pug">

//- filter
div.picker
	el-date-picker(
		popper-class="date-picker"
		v-model="startModel"
		type="date"
		align="center"
		placeholder="開始日期"
		start-placeholder="開始日期"
		end-placeholder="結束日期"
		format="yyyy/MM/dd"
		value-format="yyyy/MM/dd"
		:picker-options="{ disabledDate: startCheck }"
	)

	.to
		font-awesome-icon(icon='angle-double-down', fixed-width, size='lg')

	el-date-picker(
		popper-class="date-picker"
		v-model="endModel"
		type="date"
		align="center"
		placeholder="結束日期"
		format="yyyy/MM/dd"
		value-format="yyyy/MM/dd"
		:picker-options="{ disabledDate: endCheck }"
	)

	slot

</template>

<script>
import { mapGetters, mapMutations, mapActions } from 'vuex';

const checkTime = process.env.NODE_ENV === 'production'
	? () => {}
	: (ranges, data, idx) => {
			if (!Array.isArray(ranges)) {
				console.log('[checkTime]not Array', data, ranges);
				return;
			}
			ranges.forEach((v, i) => {
				if (!Array.isArray(v)) {
					console.log('[checkTime]not Array', data, v, ranges);
					return;
				}
				if (v.length != 2) {
					console.log('[checkTime]length error', data, v, ranges);
					return;
				}
				if (v[0] != v[0]) console.log('[checkTime]NaN error', data, v, ranges);
				if (v[1] != v[1]) console.log('[checkTime]NaN error', data, v, ranges);
			});
	  };
const checkData = process.env.NODE_ENV === 'production'
	? () => {}
	: (data, idx) => {
			if (!data.date) console.error('[checkData]time error:', data);
	  };

// input "2021/03/01~2021/07/31,2021/01/01~2021/02/15"
// return [ [1614528000000, 1627747199999], [1609430400000, 1613404799999] ]
let parseTimeRange = (rangeStr) => {
	let out = [];
	rangeStr?.split(',').forEach((v) => {
		let ts = v.split('~').map((v) => v.replaceAll('/', '-'));
		let t0 = (ts[0].indexOf('T') > -1) ? Date.parse(ts[0]) : Date.parse(`${ts[0]}T00:00:00.000+08:00`);
		let t1 = (ts[0].indexOf('T') > -1) ? Date.parse(ts[0]) : Date.parse(`${ts[0]}T23:59:59.999+08:00`);
		if (ts.length >= 2) {
			if (ts[0] != ts[1]) {
				t1 = (ts[1].indexOf('T') > -1) ? Date.parse(ts[1]) : Date.parse(`${ts[1]}T23:59:59.999+08:00`);
			}
		}
		out.push([t0, t1]);
	});
	return out;
};

// timeArr = [ [$start0, $end0], [$start2, $end1] ]
// n^3, need speed up...?
let filterByTime = (dataArr, timeArr) => {
	let match = [];
	let exist = [];
	timeArr.forEach((ts, idx) => {
		let t0 = ts[0];
		let t1 = ts[1];
		dataArr.filter((v, i) => {
			if (exist.indexOf(i) >= 0) return;

			checkData(v, i);
			let ranges = parseTimeRange(v.date); // TODO: do not hardcoded
			checkTime(ranges, v, i);
			let isMatch = false;
			ranges.forEach((r) => {
				if (isMatch) return;
				let r0 = r[0];
				let r1 = r[1];
				if (r0 <= t0 && t0 <= r1) {
					isMatch = true;
				} else if (r0 <= t1 && t1 <= r1) {
					isMatch = true;
				} else if (t0 <= r0 && r1 <= t1) {
					isMatch = true;
				}
			});

			if (isMatch) {
				match.push(v);
				exist.push(i);
			}
		});
	});
	return match;
};

const padding = (n) => {
	if (n < 10) return '0' + n;
	return n;
};

const toDateStr = (t) => {
		const yyyy = t.getFullYear();
		const mm = t.getMonth() + 1;
		const dd = t.getDate();
		return `${yyyy}/${padding(mm)}/${padding(dd)}`;
};

const formatTime = (t, dateOnly) => {
	const yyyy = t.getFullYear();
	const MM = padding(t.getMonth() + 1);
	const dd = padding(t.getDate());
	if (dateOnly) return `${yyyy}/${MM}/${dd}`;
	const hh = padding(t.getHours());
	const mm = padding(t.getMinutes());
	const ss = padding(t.getSeconds());
	return `${yyyy}/${MM}/${dd} ${hh}:${mm}:${ss}`;
};
const formatDate = (timeStr, dateOnly) => {
	let slice = parseTimeRange(timeStr);
	let out = [];
	slice.forEach((v) => {
		let t0 = new Date(v[0]);
		if (v[0] == v[1]) {
			out.push(`${formatTime(t0, dateOnly)}}`);
		} else {
			let t1 = new Date(v[1]);
			out.push(`${formatTime(t0, dateOnly)} ~ ${formatTime(t1, dateOnly)}`);
		}
	});
	return out.join(',');
};

export default {
	name: 'datePicker',
	components: {},
	props: {
		isMobile: {
			type: Boolean,
		},
		value: {
			type: Array,
			default: [],
		},
		initDate: {
			type: String,
		},
	},
	data: () => {
		const now = new Date();
		return {
			selectDateRange: [],
			start: new Date(toDateStr(now)),
			end: null,
		};
	},
	computed: {
		...mapGetters({
			openedPanel: 'openedPanel',
			navWidth: 'navWidth',
		}),
		startModel: {
			get() {
				return this.start;
			},
			set(v) {
				console.log('[startModel]set', this, v);
				this.start = (v === null)? new Date() : new Date(v);
				if (this.start > this.end) this.end = this.start;
				this.updateValue2();
			},
		},
		endModel: {
			get() {
				return this.end;
			},
			set(v) {
				console.log('[endModel]set', this, v);
				this.end = (v === null)? null : new Date(v);
				this.updateValue2();
			},
		},
	},
	methods: {
		updateValue2() {
			let startStr = toDateStr(this.start);
			let endStr = '';
			if (this.end === null) {
				const t = new Date()
				const yyyy = t.getFullYear() + 50;
				const mm = t.getMonth() + 1;
				let lastDayOfMonth = new Date(yyyy, mm, 0).getDate();
				endStr = `${yyyy}/${mm}/${lastDayOfMonth}`;
			} else {
				endStr = toDateStr(this.end);
			}
			this.selectDateRange = parseTimeRange(`${startStr}~${endStr}`);
			console.log('[DatePicker][update]', this, startStr, endStr, `${startStr}-${endStr}`, this.selectDateRange);

			this.$emit('input', this.selectDateRange);
		},
		startCheck(v) {
			// return v < now;
			return false;
		},
		endCheck(v) {
			return v < this.start;
		},
	},
	mounted() {
		// console.log('[datePicker]', this, this.isMobile, this.initDate);
		if (this.initDate) {
			let ts = this.initDate.split('~');
			this.start = new Date(ts[0]);
			if (ts[1]) this.end = new Date(ts[1]) || null;
			this.updateValue2();
		}
	},
	parseTimeRange,
	filterByTime,
	formatTime,
	formatDate,
};
</script>

<style lang="scss" scoped>
.to {
	width: 100%;
	text-align: center;
	margin: .2rem;
}
/deep/ {
	.date-picker {
		max-width: 100%;
		overflow: auto;
	}
	.el-date-editor.el-input {
		width: 100%;
	}
	.el-checkbox.is-bordered {
		margin-right: 0.1rem;
		margin-top: 0.1rem;
	}
	.el-checkbox.is-bordered + .el-checkbox.is-bordered {
		margin-left: 0.1rem;
	}
	.el-checkbox.is-bordered.is-checked {
		background-color: $primary;
		.el-checkbox__label {
			color: $white;
		}
	}
	.el-checkbox__input {
		display: none;
	}
}
</style>
