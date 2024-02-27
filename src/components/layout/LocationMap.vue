<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, onUpdated, PropType, ref, toRef, watch } from 'vue';
import { getUserData } from '@utils/common-utils';
import { UserType } from '@src/types/types';
import { getGroupManager } from '@utils/group/group-instance';
import { getApiClient } from '@utils/api-client';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import { Group } from '@utils/group/dto/group';

export default defineComponent({
	name: 'LocationMap',
	props: {
		uuid: {
			type: String as PropType<string>,
			required: false,
		},
		currentGroup: {
			type: Object as PropType<Group>,
			required: false,
		},
		onInitMap: {
			type: Function as PropType<(data: naver.maps.Map) => void>,
			required: false,
		},
		isGroupEmpty: {
			type: Boolean,
			require: false,
			default: false,
		},
	},
	setup(props) {
		const store = useStore();
		let map: naver.maps.Map | null = null;
		const mapEl = ref<HTMLDivElement>();
		const defaultLatLng = [37.5666805, 126.9784147];
		const group = computed(() => props.currentGroup);
		const isEmptyFlag = toRef(props, 'isGroupEmpty');
		const mapMarker = ref<any>(null);
		const hardRefresh = ref<boolean>(false);

		const getLocationData = () => {
			let params = {
				userIdx: props.uuid ? group.value?.creatorInfo?.userIdx : getUserData().userIdx,
			};
			if (getUserData().userType === UserType.USER) {
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
			} else if (getUserData().userType === UserType.USER_DEVICE) {
				if (getGroupManager().getCurrentGroup()) {
					if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
						params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
					}
				}
			}
			if (params.userIdx) {
				if (!props.onInitMap) {
					getApiClient(AppConfig.API_URL, store)
						.post('/api/1/location/getLocation', params)
						.then(res => {
							if (res.data.resultCode === 0) {
								let coords = res.data.data;
								if (map && coords.length > 0) {
									try {
										if (getUserData().userType === UserType.USER_DEVICE) {
											mapMarker.value = new naver.maps.Marker({
												position: new naver.maps.LatLng(coords[0].lat, coords[0].lng),
												map: map,
												icon: 'images/common/current-marker-small.svg',
											});
											map.setCenter({ lat: coords[0].lat, lng: coords[0].lng });
										} else {
											if (coords[0].stateConnect === 'Y') {
												mapMarker.value = new naver.maps.Marker({
													position: new naver.maps.LatLng(coords[0].lat, coords[0].lng),
													map: map,
													icon: 'images/common/current-marker-small.svg',
												});
												map.setCenter({ lat: coords[0].lat, lng: coords[0].lng });
											} else if (coords[0].stateConnect === 'N') {
												mapMarker.value = new naver.maps.Marker({
													position: new naver.maps.LatLng(coords[0].lat, coords[0].lng),
													map: map,
													icon: 'images/common/current-marker-small.svg',
												});
												map.setCenter({ lat: coords[0].lat, lng: coords[0].lng });
											}
										}
									} catch (e) {
										console.error(e);
									}
								}
							}
						});
				}
			}
		};

		// const handleGroupLoadComplete = () => {
		// 	getLocationData();
		// };

		const handleBinding = () => {
			getLocationData();
		};

		watch(
			() => isEmptyFlag.value,
			() => {
				if (isEmptyFlag.value) {
					if (mapMarker.value) {
						mapMarker.value.setMap(null);
						if (map) {
							map.setCenter({ lat: defaultLatLng[0], lng: defaultLatLng[1] });
						}
					}
				}
			},
		);

		watch(
			() => mapMarker.value,
			() => {
				if (mapMarker.value) {
					hardRefresh.value = !hardRefresh.value;
				}
			},
		);

		onUpdated(() => {
			handleBinding();
		});

		onMounted(() => {
			if (mapEl.value) mapEl.value.innerHTML = '';
			map = new naver.maps.Map(props.uuid ? `map_${props.uuid as string}` : 'map', {
				center: new naver.maps.LatLng(defaultLatLng[0], defaultLatLng[1]),
				zoom: 16,
				mapDataControl: false,
				disableKineticPan: false,
				scaleControl: false,
				draggable: false,
				pinchZoom: false,
				scrollWheel: false,
				keyboardShortcuts: false,
				disableDoubleTapZoom: true,
				disableDoubleClickZoom: true,
				disableTwoFingerTapZoom: true,
			});

			nextTick(() => {
				if (props.onInitMap) props.onInitMap(map);
				handleBinding();
			});

			// let marker = [];
			// for (let i = 0; i < 10; i++) {
			// 	let marker = new naver.maps.Marker({
			// 		position: new naver.maps.LatLng(
			// 			(Math.random() * (375801 - 373535) + 373535) / 10000,
			// 			(Math.random() * (1271747 - 1264736) + 1264736) / 10000,
			// 		),
			// 		map: map.value,
			// 	});
			// }
		});

		onUnmounted(() => {
			if (map) map.destroy();
			mapEl.value?.remove();
			// try {
			// 	getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			// } catch (e) {
			// 	console.warn(e);
			// }
		});

		return {
			mapEl,
			mapMarker,
		};
	},
});
</script>

<template>
	<div :id="uuid ? `map_${uuid}` : 'map'" class="map rounded-[10px] h-full" ref="mapEl"></div>
</template>

<style scoped></style>
