<template lang="pug">
.pages
	//- 無資料
	.empty(v-if='!items')
		slot(name='empty') 無資料!

	template(v-for='(v, i) in currPage')
		slot(
			v-bind:itemIdx='i + itemOffset'
			v-bind='v'
		)
			p {{ `${i} - ${v}` }}

	div.pagination
		slot(
			name='pagination'
			:page-size='split',
			:total='items.length',
			:current-page.sync='currentPage',
		)
			el-pagination(
				:hide-on-single-page='true',
				background,
				layout='prev, pager, next, slot, jumper',
				:pager-count='(isMobile) ? 3 : 5',
				:page-size='split',
				:total='items.length',
				@current-change="handleCurrentChange"
				:current-page.sync="currentPageModel"
			)
				//- div.dummy(v-if='isMobile')
				div.dummy

</template>

<script>
export default {
	name: 'splitPages',
	props: {
		isMobile: {
			type: Boolean,
		},

		items: {
			type: Array,
			default: [],
		},
		split: {
			type: Number,
			default: 10,
		},

		// start from 1
		currentPage: {
			type: Number,
			default: 1,
		},
	},
	data: () => ({
		// currentPage: 1,
	}),
	computed: {
		currentPageModel: {
			get() {
				return this.currentPage;
			},
			set(v) {
				console.log('[currentPageModel]set', this, v);
				this.$emit('pageChange', v);
			},
		},
		currPage() {
			let start = (this.currentPage - 1) * this.split;
			let end = start + this.split;
			return this.items.slice(start, end);
		},
		itemOffset() {
			return (this.currentPage - 1) * this.split;
		},
	},
	methods: {
		handleCurrentChange(val) {
			console.log(`[currentPage]: ${val}`);
		},
	},
	created() {
		console.log('[created]currentPage', this, this.currentPage);
	},
};
</script>

<style lang="scss">
.pagination {
	text-align: center;
}
</style>
