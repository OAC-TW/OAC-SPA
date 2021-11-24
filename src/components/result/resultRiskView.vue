<template lang="pug">
div
	.table
		.table__col
			.table__col__title {{ '海域名稱' }}
			.table__col__content {{ data['海域名稱'] || '--' }}
		.table__col
			.table__col__title {{ '主管機關' }}
			.table__col__content {{ data['主管機關'] || '--' }}
		.table__col
			.table__col__title {{ '縣市區' }}
			.table__col__content {{ `${data['縣市']} ${data['行政區'] || ''}` || '--' }}
		.table__col
			.table__col__title {{ '區內熱點' }}
			.table__col__content {{ data['區內熱點'] || '--' }}

	hr
	riskTable(
		:RegName='data["海域名稱"]',
		:TableID='data["編號1"]',
	)

</template>

<script>
import riskTable from './riskTable';

export default {
	name: 'resultRiskView',
	components: {
		riskTable,
	},
	data: () => ({}),
	props: {
		data: {
			type: Object,
			default: {},
		},
	},
	computed: {},
	methods: {},
};
</script>

<style></style>
