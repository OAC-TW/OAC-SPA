<template lang="pug">
div(v-if='riskTable()')
	div.riskHeader
		h2 {{ RegName }}
		div
			span 圖例:
			el-tag(
				:class='risk2Color(3)'
				effect='dark'
			) 高度風險
			el-tag(
				:class='risk2Color(2)'
				effect='dark'
			) 中度風險
			el-tag(
				:class='risk2Color(1)'
				effect='dark'
			) 低度風險

	div.riskTable
		.mmChange(
			@click='mmOffset(monthCount)',
		)
			el-tooltip(effect='dark', content='切換月份', placement='top')
				el-button()
					font-awesome-icon(icon='exchange-alt', fixed-width)

		template(v-for='(v, k) in riskTable()')
			.tag-group
				span.tag-group__title {{ k }}
				span.tags
					el-tag(
						v-for='(risk, idx) in row(v)'
						:key='idx'
						:class='risk2Color(risk)'
						effect='dark'
					) {{ (getMonth + offset + idx) % 12 + 1 }}月

	div.note
		div
			span 備註1:
			| 颱風警報期間禁止海域遊憩活動
		div
			span 備註2:
			| 上述風險等級表係依據一般民眾狀態狀態所分析評定，各人體能與技能不同，且海象變化迅速，低風險海域仍可能發生危害，民眾從事水域遊憩活動宜特別注意安全。
		div
			span 資料來源:
			| 風險海域劃設與管理策略研擬研究報告書

</template>

<script>
import Vue from 'vue';

export default {
	name: 'riskTable',
	data: () => ({
		tab: null,
		offset: 0,
	}),
	props: {
		RegName: {
			type: String,
		},
		TableID: {
			type: String,
			default: '',
		},
	},
	computed: {
		getMonth() {
			return new Date().getMonth();
		},
		monthCount() {
			return 4;
		},
	},
	methods: {
		risk2Color(v) {
			switch (v) {
				case 3:
					return 'danger';
				case 2:
					return 'warning';
				case 1:
					return 'success';
				default:
					return '';
			}
		},
		mmOffset(v) {
			this.offset = (this.offset + v) % 12;
		},
		row(row) {
			const count = this.monthCount;
			const mm = this.getMonth;
			const of = this.offset;
			const base = (mm + of) % 12;
			let out = row.slice(base, base + count);
			if (out.length < count)
				out = out.concat(row.slice(0, count - out.length));
			return out;
		},
		async tryInitTab(num) {
			if (this.$getRiskTable) {
				this.tab = this.$getRiskTable(num);
				return;
			}
			const table = await (await fetch('https://ocean.taiwan.gov.tw/dataonline/MaritimeRiskTable.json')).json();
			Vue.prototype.$getRiskTable = (num) => {
				return table[num];
			};
			// console.log('[getRiskTable]', this, this.$getRiskTable, table);
			this.tab = this.$getRiskTable(num);
		},
		riskTable() {
			this.tryInitTab(this.TableID);
			return this.tab;
		},
	},
};
</script>

<style lang="scss" scoped>
.riskHeader {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	margin: 1rem 0.5rem;
}
.riskHeader > h2 {
	margin: 0 0 1rem 0;
}
.riskTable {
	margin: 0.5rem;
}
.note {
	margin-block-start: 1rem;
	margin-block-end: 1rem;
}
.note > div > span {
	margin-right: 0.5rem;
}
.mmChange {
	text-align: center;
	margin-bottom: 0.5rem;
}
.tag-group {
	display: flex;
	justify-content: space-between;
	// border-top: #00000000 solid 1px;
	border-bottom: #a5a5a5 solid 1px;
	// margin-bottom: 1px;
	padding: 2px 0;
}
.tag-group:first-child, .tag-group:nth-child(2) {
	border-top: #a5a5a5 solid 1px;
}
.tag-group__title {
	align-self: center;
}
.el-tag.danger {
	// background-color: #f14668;
	background-color: #f5204b;
	border-color: transparent;
	color: #fff;
}
.el-tag.warning {
	background-color: #ffdd57;
	border-color: transparent;
	color: rgba(0, 0, 0, 0.7);
}
.el-tag.success {
	background-color: #48c774;
	border-color: transparent;
	color: #1f1f1f;
}
</style>
