<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { getSDKLogList } from '@utils/sdk-log/api/sdk-log-api';
import { getApiClient } from '@utils/api-client';
import moment from 'moment';

export default defineComponent({
	name: 'LogViewer',
	setup() {
		const logs = ref<any[]>([]);

		const getHealthType = (type: string) => {
			switch (type) {
				case 'body_temp':
					return '체온';
				case 'bool_pressure':
					return '혈압';
				case 'heart_rate':
					return '심박수';
				case 'stress':
					return '스트레스';
				case 'sport_activity':
					return '결음수';
				case 'oxygen':
					return '산소포화도';
				case 'sleep':
					return '수면';
			}
		};

		onMounted(() => {
			let params = {};
			getSDKLogList(getApiClient(), params).then(res => {
				logs.value = res.data;
			});
		});
		return { moment, logs, getHealthType };
	},
});
</script>

<template>
	<div style="position: absolute; background: #eeeeee; z-index: 10000; padding: 10px">
		<ul>
			<li v-for="(item, index) in logs" :key="index" style="padding: 10px 0; border-bottom: 1px solid black">
				<h5 style="font-weight: bold">{{ moment.utc(item.dateReg).local().format('YYYY MMMM Do, a hh:mm:ss ') }}</h5>
				<h5 style="font-weight: bold">{{ getHealthType(item.type) }}</h5>
				<div>{{ JSON.parse(item.logData) }}</div>
			</li>
		</ul>
	</div>
</template>

<style scoped></style>
