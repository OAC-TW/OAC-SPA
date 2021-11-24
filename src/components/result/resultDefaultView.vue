<template lang="pug">
.table
	template(v-for='(v, k) in data')
		.table__col(v-if='!/id|OBJECTID|objecid|Shape/gi.test(k)')
			.table__col__title {{ k }}
			.table__col__content {{ v }}
</template>

<script>
export default {
	name: 'resultDefaultView',
	props: {
		data: {
			type: Object,
			default: {},
		},
	},
	computed: {},
};
</script>

<style></style>
