<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import LayoutHeader from '@components/layout/header/LayoutHeader.vue';
import RefreshButton from '@components/layout/RefreshButton.vue';
import LocationMap from '@components/layout/LocationMap.vue';
import KpDatePicker from '@components/common/KpDatePicker.vue';
import { getApiClient } from '@utils/api-client';
import moment from 'moment';
import { AndroidEventType, UserType } from '@src/types/types';
import { getUserData } from '@utils/common-utils';
import { getGroupManager } from '@utils/group/group-instance';
import { useStore } from 'vuex';
import AppConfig from '@src/constants';
import { dfsXyConv } from '@src/utils/convertXyLatLon';
import KpImage from '@components/common/KpButton.vue';
import { ChatUtilEvent, getChatUtils } from '../../utils/group/chat-utils';
import { GroupManagerEvent } from '../../utils/group/group-base-manager';
import { useRoute } from 'vue-router';
import { Moment } from 'moment/moment';
import { SET_SYNC_UPDATE_TIME } from '../../store/actions';

export default defineComponent({
	name: 'LocationView',
	components: { KpDatePicker, LocationMap, RefreshButton, LayoutHeader },
	setup() {
		const route = useRoute();
		const store = useStore();
		const map = ref<naver.maps.Map | null>(null);
		const locationUpdateTime = ref<string | Moment>(store.state.syncUpdateTime ? moment(store.state.syncUpdateTime) : '');
		const defaultLatLng = [37.5666805, 126.9784147];
		const selectDate = ref<Date>(new Date());
		const mapMarkers = ref<any>({});
		const mapInfoWindow = ref<any>({});
		const userType = ref<string>('USER');
		const searchCount = ref<number>(0);
		const computedRouteQuery = computed(() => route.query);

		const setAsyncApiCallCount = () => {
			if (getUserData().userType === UserType.MANAGER) {
				if (route.query.groupIdx) {
					searchCount.value = 1;
				} else {
					searchCount.value = getGroupManager().getGroupList().length;
				}
			} else {
				searchCount.value = 1;
			}
		};
		const getUpdateData = () => {
			setAsyncApiCallCount();
			nextTick(() => {
				getSyncLocationData();
			});
		};

		const onChangeDate = (date: string) => {
			selectDate.value = new Date(date);
			nextTick(() => {
				searchLocation();
			});
		};

		const getClickHandler = (userIdx: string, seq: number) => {
			return (e: any) => {
				let marker = mapMarkers.value[userIdx][seq],
					infoWindow = mapInfoWindow.value[userIdx][seq];

				if (infoWindow.getMap()) {
					infoWindow.close();
				} else {
					infoWindow.open(map.value, marker);
				}
			};
		};

		const getSyncLocationData = () => {
			if (getUserData().userType === UserType.USER_DEVICE) {
				window.appInterface.getGpsInfo();
				getLocationData();
			} else {
				searchLocation();
			}
		};

		const setUpdateTime = (localTime: Moment) => {
			store.commit(SET_SYNC_UPDATE_TIME, localTime.toDate());
			if (locationUpdateTime.value === '') {
				locationUpdateTime.value = localTime;
			} else {
				if ((locationUpdateTime.value as Moment).isBefore(localTime)) {
					locationUpdateTime.value = localTime;
				}
			}
		};

		const getLocationData = (userIdx?: string, userName?: string) => {
			selectDate.value.setHours(0);
			selectDate.value.setMinutes(0);
			let startTime = moment(selectDate.value).utc(false).format('YYYYMMDDHHMM');
			selectDate.value.setHours(23);
			selectDate.value.setMinutes(59);
			let endTime = moment(selectDate.value).utc(false).format('YYYYMMDDHHMM');
			let params = {
				searchStartDt: startTime,
				searchEndDt: endTime,
				userIdx: getUserData().userIdx,
			};

			if (userIdx) {
				params.userIdx = userIdx;
			} else {
				if (getUserData().userType === UserType.USER) {
					params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
				} else if (getUserData().userType === UserType.USER_DEVICE) {
					if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
						params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx;
					}
				}
			}

			for (const [key, value] of Object.entries(mapMarkers.value)) {
				(value as [])?.map((item: any) => {
					item.setMap(null);
				});
			}
			for (const [key, value] of Object.entries(mapInfoWindow.value)) {
				(value as [])?.map((item: any) => {
					item.setMap(null);
				});
			}
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/location/getLocation', params)
				.then(res => {
					if (res.data.resultCode === 0) {
						searchCount.value = --searchCount.value;
						let coords = res.data.data.reverse();
						let markers = [];
						let infoWindows = [];

						const userData = getUserData();

						if (map.value) {
							for (let i = 0; i < coords.length; i++) {
								let marker;
								if (getUserData().userType === UserType.MANAGER) {
									if (coords[i].stateConnect === 'Y') {
										marker = new naver.maps.Marker({
											position: new naver.maps.LatLng(coords[i].lat, coords[i].lng),
											map: map.value,
											icon: {
												content: `<div class='manager-marker-window'>` + userName + `</div>`,
											},
										});
									} else {
										marker = new naver.maps.Marker({
											position: new naver.maps.LatLng(coords[i].lat, coords[i].lng),
											map: map.value,
											icon: {
												content: `<div class='manager-marker-window disconnect'>` + userName + `</div>`,
											},
										});
									}
								} else {
									if (
										getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx !== undefined &&
										getUserData().userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx
									) {
										// 보호자 ? 일반 사용자
										marker = new naver.maps.Marker({
											position: new naver.maps.LatLng(coords[i].lat, coords[i].lng),
											map: map.value,
											icon:
												i === coords.length - 1
													? 'images/common/current-marker.svg'
													: coords[i].stateConnect === 'Y'
													? 'images/common/default-marker.svg'
													: 'images/common/disconnect-marker.svg',
										});
									} else {
										// 기기 사용자
										marker = new naver.maps.Marker({
											position: new naver.maps.LatLng(coords[i].lat, coords[i].lng),
											map: map.value,
											icon:
												i === coords.length - 1
													? 'images/common/current-marker.svg'
													: coords[i].stateConnect === 'Y'
													? 'images/common/default-marker.svg'
													: 'images/common/disconnect-marker.svg',
										});
									}
								}

								let infoDesc = `위치기록: ${moment(coords[i].dateReg).format('MM.DD a HH:mm')}`;
								if (i === 0) {
									let localTime = moment.utc(coords[0].dateReg).local();
									setUpdateTime(localTime);
									map.value.setCenter({ lat: coords[0].lat, lng: coords[0].lng });
									infoDesc = `현재위치: ${moment(coords[0].dateReg).format('MM.DD a HH:mm')}`;
								}
								if (coords[i].stateConnect === 'N') {
									infoDesc = `연결끊김: ${moment(coords[0].dateReg).format('MM.DD a HH:mm')}`;
								}
								if (userType.value === 'MANAGER') infoDesc = `${moment(coords[i].dateReg).format('MM.DD a HH:mm')}`;
								let infoWindow = new naver.maps.InfoWindow({
									content: `<div class='info-window'>` + infoDesc + '</div>',
									borderWidth: 0,
									disableAnchor: true,
									backgroundColor: 'transparent',
								});

								markers.push(marker);
								infoWindows.push(infoWindow);

								naver.maps.Event.addListener(markers[i], 'click', getClickHandler(params.userIdx, i));
							}

							mapMarkers.value = {
								...mapMarkers.value,
								[params.userIdx]: markers,
							};
							mapInfoWindow.value = {
								...mapInfoWindow.value,
								[params.userIdx]: infoWindows,
							};

							map.value.refresh();
							if (markers.length > 0) map.value.setCenter(markers[markers.length - 1].getPosition());
						}
					}
				});
		};

		const searchLocation = () => {
			if (getUserData().userType === UserType.MANAGER) {
				getGroupManager()
					.getGroupList()
					.map((t: any) => {
						if (route.query.groupIdx) {
							if (route.query.groupIdx === t.groupIdx) {
								getLocationData(t.creatorInfo.userIdx, t.creatorInfo.username);
							}
						} else {
							getLocationData(t.creatorInfo.userIdx, t.creatorInfo.username);
						}
					});
			} else {
				getLocationData();
			}
		};

		const handleMapInit = (nMap: naver.maps.Map) => {
			map.value = null;
			nextTick(() => {
				map.value = nMap;
				map.value.setOptions({
					zoom: 16,
					mapDataControl: true,
					disableKineticPan: true,
					scaleControl: true,
					draggable: true,
					pinchZoom: true,
					scrollWheel: true,
					keyboardShortcuts: true,
					disableDoubleTapZoom: false,
					disableDoubleClickZoom: false,
					disableTwoFingerTapZoom: false,
				});
			});
		};

		const handleGroupLoadComplete = () => {
			searchLocation();
		};

		const handleChatConnect = () => {
			getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
		};

		watch(
			() => computedRouteQuery.value,
			() => {
				searchLocation();
			},
		);

		watch(
			() => map.value,
			() => {
				if (map.value?.getCenter() && map.value?.getCenter().y === defaultLatLng[0] && map.value?.getCenter().x === defaultLatLng[1]) {
					searchLocation();
				}
			},
		);

		onMounted(() => {
			window.appInterface.addEventListener(AndroidEventType.SYNC_DATA, searchLocation);
			window.appInterface.addEventListener(AndroidEventType.INSERT_LOCATION, searchLocation);
			userType.value = getUserData().userType;
			// map.value = new naver.maps.Map('map', {
			// 	center: new naver.maps.LatLng(defaultLatLng[0], defaultLatLng[1]),
			// 	zoom: 16,
			// });
			getChatUtils().addEventListener(ChatUtilEvent.CONNECT, handleChatConnect);

			setAsyncApiCallCount();
		});

		onUnmounted(() => {
			map.value = null;
			getChatUtils().removeEventListener(ChatUtilEvent.CONNECT, handleChatConnect);
			getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			window.appInterface.removeEventListener(AndroidEventType.SYNC_DATA, searchLocation);
		});

		return {
			selectDate,
			onChangeDate,
			getUpdateData,
			userType,
			handleMapInit,
			updateTime: computed(() => {
				if (searchCount.value <= 0) {
					return locationUpdateTime.value === '' ? '' : (locationUpdateTime.value as Moment).format('MM.DD a HH:mm');
				}
				return '';
			}),
		};
	},
});
</script>

<template>
	<layout-header title="위치" />
	<section class="location-board">
		<kp-date-picker class="date-picker" :date="selectDate" @onChangeDate="onChangeDate" />
		<div :class="userType === 'MANAGER' ? 'manager-map-wrapper' : 'map-wrapper'">
			<location-map :on-init-map="handleMapInit" />
			<div v-if="userType === 'MANAGER' && updateTime" class="manager-update flex items-center px-[10px] cursor-pointer" @click="getUpdateData">
				<div class="update-text mr-[10px]">{{ updateTime }}</div>
				<img class="fill-white" :src="'images/icon/ico-btn-refresh-white.svg'" />
			</div>
			<div v-else class="only-update-btn flex items-center cursor-pointer" @click="getUpdateData">
				<img class="fill-white" :src="'images/icon/ico-btn-refresh-white.svg'" />
			</div>
		</div>
		<div v-if="userType !== 'MANAGER'" class="flex items-center justify-between px-[20px] py-[15px]" @click="getUpdateData">
			<div class="flex flex-row flex items-center">
				<refresh-button @click="getUpdateData" />
				<span class="update-label ml-[10px]">지금 업데이트</span>
			</div>
			<div class="update-time">{{ updateTime }}</div>
		</div>
	</section>
</template>

<style scoped></style>
