<template lang="pug">
.table
	.table__col
		.table__col__title 區域範圍
		.table__col__content {{ data["區域範圍"] || "--" }}
	.table__col
		.table__col__title 限制活動
		.table__col__content {{ data["限制活動"] || "--" }}
	.table__col
		.table__col__title 需要申請
		.table__col__content 
			div(v-for='v in applyList') {{ v }}
	.table__col
		.table__col__title 禁止採捕
		.table__col__content {{ data["禁止採捕"] || "--" }}
	.table__col
		.table__col__title 違規罰則
		.table__col__content {{ data["違規罰則"] || "--" }}
	.table__col
		.table__col__title 公告法令
		.table__col__content 
			template(v-for='l in lawArr')
				a.link(:href='l.value', type='primary', target='_blank', rel='noopener') {{ l.label ? l.label.trim() : "" }}
</template>

<script>
export default {
	name: 'laws',
	props: {
		data: {
			type: Object,
			default: {},
		},
	},
	computed: {
		/**
		 * @returns Array<{label,value}>
		 */
		lawArr() {
			return Object.keys(this.data)
				.map((k) => {
					if (/公告法令/g.test(k)) {
						return {
							label: this.data[k],
							value: this.data[`公告連結${k.match(/\d$/)[0]}`] || '',
						};
					}
				})
				.filter((t) => t);
		},
		/**
		 * @returns Array<string>
		 */
		applyList() {
			return (
				this.data['需要申請'] &&
				this.data['需要申請'].split('。').filter((t) => t)
			);
		},
	},
};
</script>

<style></style>
