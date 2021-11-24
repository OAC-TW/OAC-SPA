<template lang="pug">
.page-header
	.page-header__other(v-if='right2left')
		slot

	.page-header__main
		el-button(
			v-if='useBack && !right2left',
			style='padding: 0 1rem',
			title='返回',
			type='text',
			@click='$emit("back")',
		)
			font-awesome-icon(icon='chevron-left', size='lg')

		h2(:style='(!useBack || right2left)? "margin: 0 auto;": ""') {{ title }}

		el-button(
			v-if='useBack && right2left',
			style='padding: 0 1rem;',
			title='返回',
			type='text',
			@click='$emit("back")',
		)
			font-awesome-icon(icon='chevron-right', size='lg')

	.page-header__other(v-if='!right2left')
		slot
</template>

<script>
export default {
	name: 'pageheader',
	props: {
		title: {
			type: String,
			require: true,
		},
		useBack: {
			type: Boolean,
			default: true,
		},
		right2left: {
			type: Boolean,
			default: false,
		},
	},
	data: () => ({}),
};
</script>

<style lang="scss">
.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;

	// border-bottom:1px solid #d7d7d7;
	// margin-bottom:1rem;

	&__main {
		flex: 1 0 200px;
		display: flex;
	}
	&__other {
		flex: 0 1 auto;
	}
}
</style>
