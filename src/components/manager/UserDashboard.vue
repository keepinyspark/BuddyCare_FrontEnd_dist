<script lang="ts">
import { defineComponent, PropType, ref } from 'vue';
import ChatManagerDashBoard from '@components/chat/ChatManagerDashBoard.vue';
import LocationMap from '@components/layout/LocationMap.vue';
import UserInfo from '@components/manager/UserInfo.vue';
import HealthInfo from '@components/manager/HealthInfo.vue';
import { Group } from '@utils/group/dto/group';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default defineComponent({
	name: 'UserDashboard',
	props: {
		currentGroup: {
			type: Object as PropType<Group>,
			required: true,
		},
		isUpdateData: {
			type: Boolean,
			required: true,
		},
		setDashboardUpdateTime: {
			type: Function,
			required: false,
		},
	},
	components: { HealthInfo, UserInfo, LocationMap, ChatManagerDashBoard },
	setup(props) {
		const store = useStore();
		const router = useRouter();
		const isOpenInfo = ref<boolean>(false);
		const goToLocation = (groupIdx?: string) => {
			if (groupIdx) {
				router.push(`/map?groupIdx=${groupIdx}`);
			} else {
				router.push('/map');
			}
		};

		const setCollapseInfo = () => {
			isOpenInfo.value = !isOpenInfo.value;
		};

		return { goToLocation, isOpenInfo, setCollapseInfo };
	},
});
</script>

<template>
	<!-- 유저 -->
	<user-info :current-group="currentGroup" :need-watch="true" @click.prevent.stop="setCollapseInfo" />
	<div class="w-full mt-[20px] flex flex-wrap justify-between" v-if="isOpenInfo">
		<!-- 기기 -->
		<div class="device-info-wrapper dash-board-manager-health h-[250px] mb-[20px]">
			<div class="contents-wrapper grid grid-cols-3 gap-[10px]">
				<health-info
					:key="currentGroup.groupIdx"
					:current-group="currentGroup"
					:is-update-data="isUpdateData"
					:set-dashboard-update-time="setDashboardUpdateTime" />
				<div
					class="board detail-info map rounded-[10px]"
					@click="
						() => {
							goToLocation(currentGroup.groupIdx);
						}
					">
					<location-map :uuid="currentGroup.groupIdx" :key="currentGroup.groupIdx" :current-group="currentGroup" />
				</div>
			</div>
		</div>
		<!-- 채팅 -->
		<chat-manager-dash-board class="dash-board-manager-chat" :selected-group="currentGroup"></chat-manager-dash-board>
	</div>
</template>

<style scoped></style>
