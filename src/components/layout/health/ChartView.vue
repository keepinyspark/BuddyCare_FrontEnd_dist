<script lang="ts">
import { computed, nextTick, onMounted, onUnmounted, PropType, ref } from 'vue';
import KpButton from '@components/common/KpButton.vue';
import { ChartDataTypes, UserType } from '@src/types/types';
import KpDatePicker from '@components/common/KpDatePicker.vue';
import BarChart from '@components/layout/chart/BarChart.vue';
import BarChartForSleep from '@components/layout/chart/BarChartForSleep.vue';
import moment from 'moment';
import LineChart from '@components/layout/chart/LineChart.vue';
import AreaChart from '@components/layout/chart/AreaChart.vue';
import WaterfallChart from '@components/layout/chart/WaterfallChart.vue';
import BarAreaChart from '@components/layout/chart/BarAreaChart.vue';
import { getApiClient } from '@utils/api-client';
import LineChartTwoLine from '@components/layout/chart/LineChartTwoLine.vue';
import { getNumberFormat, getUserData, toNumber } from '@utils/common-utils';
import { loadLocalData } from '@utils/common-utils';
import { KEY_LIST } from '@src/constants-keys';
import { createGroupManager, getGroupManager, NotChatReadyException } from '@utils/group/group-instance';
import { GroupManagerEvent } from '@utils/group/group-base-manager';
import AppConfig from '@src/constants';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { cloneDeep, remove } from 'lodash';

export enum PeriodType {
	'DAY' = 0,
	'WEEK' = 1,
	'MONTH' = 2,
}

export enum ChartTypes {
	'BAR' = 'bar',
	'BARSLEEP' = 'bar-sleep',
	'LINE' = 'line',
	'TWOLINE' = 'line2',
	'AREA' = 'area',
	'WATERFALL' = 'waterfall',
	'BARAREA' = 'bar-area',
}

export const defaultColorList = {
	working: ['#1882FF', '#9519E1', '#00ADD2', '#E0BC00'],
	'heart-rate': ['#522ED2', '#9519E1', '#00ADD2', '#E0BC00'],
	temperature: ['#01BCAD', '#9519E1', '#00ADD2', '#E0BC00'],
	'blood-pressure': ['#EB2323', '#9519E1', '#00ADD2', '#E0BC00'],
	sleep: ['#FFA900', '#9519E1', '#00ADD2', '#E0BC00'],
	oxygen: ['#8AAC00', '#9519E1', '#00ADD2', '#E0BC00'],
	stress: ['#474747', '#9519E1', '#00ADD2', '#E0BC00'],
};

export const colorList = {
	working: ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	'heart-rate': ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	temperature: ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	'blood-pressure': ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	sleep: ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	oxygen: ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
	stress: ['#F43D7F', '#9519E1', '#00ADD2', '#E0BC00'],
};

export default {
	name: 'ChartView',
	components: { LineChartTwoLine, BarAreaChart, WaterfallChart, AreaChart, LineChart, BarChart, BarChartForSleep, KpDatePicker, KpButton },
	props: {
		dataType: {
			type: String as PropType<ChartDataTypes | ''>,
		},
	},
	setup(props) {
		const route = useRoute();
		const store = useStore();
		const selectPeriod = ref<PeriodType>(PeriodType.DAY);
		const compDataType = computed(() => props.dataType);
		const selectDate = ref<Date>(new Date());
		const dateList = ref<Date[]>([]);
		const checkList = ref<number[]>([0]);
		const format = ref<string>('');
		const chartType = ref<string>('');
		const userType = ref<string>('');
		const periodList = [
			{ type: PeriodType.DAY, label: '일' },
			{ type: PeriodType.WEEK, label: '주' },
			{ type: PeriodType.MONTH, label: '월' },
		];
		const chartDate = ref<any>([]);
		const goalData = ref();
		const workingOverviewData = ref({ working: '0', distance: '0', kcal: '0' });
		const heartOverviewData = ref({ avg: '0', min: '0', max: '0' });
		const tempOverviewData = ref({ avg: '0', min: '0', max: '0' });
		const oxygenOverviewData = ref<any>({ avg: '0', min: '0', max: '0', list: [] });
		const stressOverviewData = ref({ avg: '0', min: '0', max: '0' });
		const bloodOverviewData = ref<any>({ minAvg: 0, maxAvg: 0, list: [] });
		const sleepOverviewData = ref({ totalSleepMin: 0, deepSleepMin: 0, lightSleepMin: 0, awakeMin: 0 });
		const isManager = ref<boolean>(false);

		const setSelectPeriod = (select: PeriodType) => {
			selectPeriod.value = select;
			checkList.value = [0];
			onChangeDate(selectDate.value.toString());
		};

		const getSunday = (d: Date | string) => {
			let tempDate = new Date(d);
			let day = tempDate.getDay(),
				diff = tempDate.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
			tempDate.setDate(diff);
			tempDate.setDate(tempDate.getDate() - 1);
			return new Date(tempDate);
		};

		const onChangeDate = (date: string) => {
			selectDate.value = new Date(date);

			let list: Date[] = [];
			switch (selectPeriod.value) {
				case PeriodType.DAY:
					for (let i = 0; i < 4; i++) {
						let tempDate: Date = new Date(date);
						tempDate.setDate(selectDate.value.getDate() - i);
						list.push(tempDate);
					}
					dateList.value = list;
					format.value = 'MM.DD';
					break;
				case PeriodType.WEEK:
					for (let i = 0; i < 4; i++) {
						let tempDate: Date = new Date(getSunday(date));
						tempDate.setDate(tempDate.getDate() - i * 7);
						list.push(tempDate);
					}
					dateList.value = list;
					format.value = 'MM.DD';
					break;
				case PeriodType.MONTH:
					for (let i = 0; i < 4; i++) {
						let tempDate: Date = new Date(date);
						tempDate.setMonth(selectDate.value.getMonth() - i);
						list.push(tempDate);
					}
					dateList.value = list;
					format.value = 'YYYY년 MM월';
					break;
			}

			nextTick(() => {
				setChartType();
			});
		};

		const onCheck = (e: MouseEvent, index: number) => {
			let list = Array.from(checkList.value);
			if ((e.target as HTMLInputElement)?.checked) {
				if (list.indexOf(index) < 0) {
					list.push(index);
				}
			} else {
				if (list.length > 1) {
					list.splice(list.indexOf(index), 1);
				} else {
					(e.target as HTMLInputElement)?.click();
				}
			}
			checkList.value = list;
			nextTick(() => {
				setChartType();
			});
		};

		const setChartType = () => {
			switch (compDataType.value) {
				case 'working':
					getWorkingData();
					/*if (selectPeriod.value === PeriodType.DAY) {
					} else if (selectPeriod.value === PeriodType.WEEK) {
					} else if (selectPeriod.value === PeriodType.MONTH) {
					}*/
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.BAR;
					} else {
						chartType.value = ChartTypes.LINE;
					}
					break;
				case 'heart-rate':
					getHearRateData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.AREA;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.BAR;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.BAR;
						}
					} else {
						chartType.value = ChartTypes.LINE;
					}
					break;
				case 'temperature':
					getTemperatureData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.AREA;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.BAR;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.BAR;
						}
					} else {
						chartType.value = ChartTypes.LINE;
					}
					break;
				case 'blood-pressure':
					getBloodPressureData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.WATERFALL;
					} else {
						chartType.value = ChartTypes.TWOLINE;
					}
					break;
				case 'sleep':
					getSleepData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.BARAREA;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.BARSLEEP;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.BARSLEEP;
						}
					} else {
						chartType.value = ChartTypes.BARSLEEP;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.LINE;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.LINE;
						}
					}
					break;
				case 'oxygen':
					getOxygenData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.LINE;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.BAR;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.BAR;
						}
					} else {
						chartType.value = ChartTypes.LINE;
					}
					break;
				case 'stress':
					getStressData();
					if (checkList.value.length === 1) {
						chartType.value = ChartTypes.LINE;
						if (selectPeriod.value === PeriodType.WEEK) {
							chartType.value = ChartTypes.BAR;
						} else if (selectPeriod.value === PeriodType.MONTH) {
							chartType.value = ChartTypes.BAR;
						}
					} else {
						chartType.value = ChartTypes.LINE;
					}
					break;
			}
		};

		const getParameter = (index: number, flag?: boolean) => {
			let params: { userIdx: string; startDt: number; endDt: number; isGroup?: boolean } = {
				userIdx: getUserData().userIdx as string,
				startDt: 100000000000,
				endDt: 999999999999,
			};
			if (getUserData().userType === UserType.USER) {
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
			} else if (getUserData().userType === UserType.MANAGER) {
				params.userIdx = getGroupManager().getGroup(route.query.group as string)?.creatorInfo?.userIdx as string;
			} else if (getUserData().userType === UserType.USER_DEVICE) {
				if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
				}
			}
			if (selectPeriod.value === PeriodType.DAY) {
				params.startDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMMDD0000'));
				params.endDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMMDD9999'));
				if (flag) {
					params.startDt = Number(moment(dateList.value[checkList.value[index]]).subtract(1, 'day').format('YYYYMMDD1800'));
					params.endDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMMDD1200'));
				}
			} else if (selectPeriod.value === PeriodType.WEEK) {
				let tempDate: Date = new Date(dateList.value[checkList.value[index]]);
				tempDate.setDate(tempDate.getDate() + 6);
				params.startDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMMDD0000'));
				params.endDt = Number(moment(tempDate).format('YYYYMMDD9999'));
				params.isGroup = true;
			} else {
				params.startDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMM000000'));
				params.endDt = Number(moment(dateList.value[checkList.value[index]]).format('YYYYMM999999'));
				params.isGroup = true;
			}

			return params;
		};

		const getWorkingData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let working = 0,
					distance = 0,
					kcal = 0;

				if (selectPeriod.value === PeriodType.DAY && checkList.value.length === 1) {
					newChartData.map((t: any) => {
						t.data.map((d: any) => {
							distance = toNumber(d.distance) > distance ? toNumber(d.distance) : distance;
							kcal = toNumber(d.calorie) > kcal ? toNumber(d.calorie) : kcal;
							working = toNumber(d.totalStepCount) > working ? toNumber(d.totalStepCount) : working;
						});
					});
					chartDate.value = newChartData;

					workingOverviewData.value = {
						working: getNumberFormat(working),
						distance: getNumberFormat(distance),
						kcal: getNumberFormat(kcal),
					};
				} else {
					let avgLen = 0;
					if (selectPeriod.value === PeriodType.DAY) {
						newChartData.map((t: any) => {
							t.data.some((d: any) => {
								if (d.distance && d.calorie && d.totalStepCount) {
									distance += toNumber(d.distance);
									kcal += toNumber(d.calorie);
									working += toNumber(d.totalStepCount);
									avgLen++;
									return true;
								}
							});
						});
						chartDate.value = newChartData;
					} else {
						newChartData.map((t: any) => {
							t.data.map((d: any) => {
								distance += toNumber(d.distance);
								kcal += toNumber(d.calorie);
								working += toNumber(d.totalStepCount);
								avgLen++;
							});
						});
						chartDate.value = newChartData;
					}

					if (selectPeriod.value === PeriodType.DAY) {
						distance = distance / checkList.value.length;
						kcal = kcal / checkList.value.length;
						working = working / checkList.value.length;
					} else {
						distance = distance / avgLen;
						kcal = kcal / avgLen;
						working = working / avgLen;
					}

					workingOverviewData.value = {
						working: getNumberFormat(working),
						distance: getNumberFormat(distance),
						kcal: getNumberFormat(kcal),
					};
				}
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getActivity', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;
							// let data = Array.from(chartDate.value);

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											calorie: '0',
											distance: '0',
											period: period,
											userIdx: param.userIdx,
											value: '0',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											calorie: '0',
											distance: '0',
											period: period,
											userIdx: param.userIdx,
											value: '0',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											calorie: '0',
											distance: '0',
											period: period,
											userIdx: param.userIdx,
											value: '0',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}

							handleLoop();
						}
					});
			}
		};

		const getBloodPressureData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let minAvg = 0,
					maxAvg = 0,
					dataLen = 0;
				let listData: any[] = [];
				newChartData.map((t: any) => {
					// dataLen += t.data.length;
					t.data.map((d: any) => {
						if (d.valueLow !== '-' && d.valueHigh !== '-') {
							dataLen++;
							let valLow = toNumber(d.valueLow);
							let valHigh = toNumber(d.valueHigh);
							minAvg += valLow;
							maxAvg += valHigh;
							if (newChartData.length === 1) {
								if (listData.filter(f => f.time === `${d.period.substring(8, 10)}:${d.period.substring(10, 12)}`).length === 0) {
									listData.push({
										time: `${d.period.substring(8, 10)}:${d.period.substring(10, 12)}`,
										min: `${getNumberFormat(valLow)} mmHg`,
										max: `${getNumberFormat(valHigh)} mmHg`,
									});
								}
							}
						}
					});
				});

				if (dataLen < 1) {
					minAvg = 0;
					maxAvg = 0;
				} else {
					minAvg = Number((minAvg / dataLen).toFixed(0));
					maxAvg = Number((maxAvg / dataLen).toFixed(0));
				}

				chartDate.value = newChartData;

				bloodOverviewData.value = { minAvg: getNumberFormat(minAvg), maxAvg: getNumberFormat(maxAvg), list: listData };
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getBloodPressure', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;
							let data = Array.from(chartDate.value);

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											valueHigh: '-',
											valueLow: '-',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											valueHigh: '-',
											valueLow: '-',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											valueHigh: '-',
											valueLow: '-',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}
							handleLoop();
						}
					});
			}
		};

		const getHearRateData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let avg = 0,
					min = 1000,
					max = 0,
					dataLen = 0;
				newChartData.map((t: any) => {
					// dataLen += t.data.length;
					t.data.map((d: any) => {
						if (d.value !== '-') {
							dataLen++;
							let val = toNumber(d.value);
							avg += val;
							min = val < min ? val : min;
							max = val > max ? val : max;
						}
					});
				});
				if (min === 1000) {
					min = 0;
				}

				if (dataLen < 1) {
					avg = 0;
					min = 0;
				} else {
					avg = toNumber((avg / dataLen).toFixed(0));
				}

				chartDate.value = newChartData;

				heartOverviewData.value = { avg: getNumberFormat(avg), min: getNumberFormat(min), max: getNumberFormat(max) };
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getHeartRate', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;
							let data = Array.from(chartDate.value);

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}

							handleLoop();
						}
					});
			}
		};

		const getTemperatureData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let avg = 0,
					min = 1000,
					max = 0,
					dataLen = 0;
				newChartData.map((item: any) => {
					item.data.map((t: any) => {
						if (t.value !== '-') {
							dataLen++;
							let val = toNumber(t.value);
							avg += val;
							min = val < min ? val : min;
							max = val > max ? val : max;
						}
					});
				});

				if (dataLen < 1) {
					avg = 0;
					min = 0;
				} else {
					avg = Number((avg / dataLen).toFixed(0));
				}
				if (min === 1000) {
					min = 0;
				}

				chartDate.value = newChartData;

				tempOverviewData.value = { avg: getNumberFormat(avg), min: getNumberFormat(min), max: getNumberFormat(max) };
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getTemperature', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}

							handleLoop();
						}
					});
			}
		};

		const getSleepData = () => {
			sleepOverviewData.value = { totalSleepMin: 0, deepSleepMin: 0, lightSleepMin: 0, awakeMin: 0 };
			chartDate.value = [];
			const newChartData: any[] = [];

			nextTick(() => {
				for (let mi = 0; mi < checkList.value.length; mi++) {
					let param = getParameter(mi, true);
					getApiClient(AppConfig.API_URL, store)
						.post('/api/1/health/getSleepTime', param)
						.then(res => {
							if (res.data.resultCode === 0) {
								let responseDataOrigin = res.data.data;
								let responseData: any[] = [];
								for (let i = 0; i < responseDataOrigin.length; i++) {
									let now = moment(responseDataOrigin[i].period, 'YYYYMMDDHHmm');
									for (let j = 0; j <= responseDataOrigin[i].duration; j++) {
										let period = now.clone();
										period.add(1, 'minutes');

										let target = cloneDeep(responseDataOrigin[i]);
										responseData.push(
											Object.assign(target, {
												duration: 1,
												period: period.format('YYYYMMDDHHmm'),
											}),
										);
									}
								}

								let temp: any = { date: '', data: [] };
								temp.date = param.startDt;
								let data = Array.from(`chartDate.value`);
								if (selectPeriod.value === PeriodType.DAY) {
									if (checkList.value.length === 1) {
										temp.data = responseData;
										newChartData.push(temp);
									} else {
										const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
										for (let i = 0; i < 24; i++) {
											let period = mTheDay.format('YYYYMMDDHH00');
											let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
											if (filterData.length > 0) {
												temp.data.push(filterData[0]);
											} else {
												let dataSet = {
													period: period,
													userIdx: param.userIdx,
													value: '-',
												};
												temp.data.push(dataSet);
											}
											mTheDay.add(1, 'hour');
										}
										newChartData.push(temp);
									}
								} else if (selectPeriod.value === PeriodType.WEEK) {
									const mStartDt = moment(('' + param.startDt).substring(0, 8));
									const mEndDt = moment(('' + param.endDt).substring(0, 8));
									const durationDt = mEndDt.diff(mStartDt, 'days');
									for (let i = 0; i <= durationDt; i++) {
										let period = mStartDt.format('YYYYMMDD');
										let filterData = responseDataOrigin.filter((item: any) => item.period.toString() === period);
										if (filterData.length > 0) {
											temp.data.push(filterData[0]);
										} else {
											let dataSet = {
												period: period,
												userIdx: param.userIdx,
												value: '-',
											};
											temp.data.push(dataSet);
										}
										mStartDt.add(1, 'day');
									}
									newChartData.push(temp);
								} else {
									let thisMonth = new Date(dateList.value[checkList.value[mi]]);
									const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
									const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
									const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
									for (let i = 0; i <= mMonthDays; i++) {
										let period = mThisMonth.format('YYYYMMDD');
										let filterData = responseDataOrigin.filter((item: any) => item.period.toString() === period);
										if (filterData.length > 0) {
											temp.data.push(filterData[0]);
										} else {
											let dataSet = {
												period: period,
												userIdx: param.userIdx,
												value: '-',
											};
											temp.data.push(dataSet);
										}
										mThisMonth.add(1, 'day');
									}
									newChartData.push(temp);
								}

								remove(temp.data, d => (d ? false : true));

								chartDate.value = newChartData;

								if (temp.data.length > 0) {
									let overviewObj = temp.data.filter((f: any) => f.value !== '-');
									if (overviewObj.length > 0) {
										const { totalSleepMin, lightSleepMin, deepSleepMin, awakeMin } = overviewObj[0];
										if (totalSleepMin && lightSleepMin && deepSleepMin && awakeMin) {
											sleepOverviewData.value = {
												totalSleepMin: sleepOverviewData.value.totalSleepMin + (totalSleepMin ?? 0),
												lightSleepMin: sleepOverviewData.value.lightSleepMin + (lightSleepMin ?? 0),
												deepSleepMin: sleepOverviewData.value.deepSleepMin + (deepSleepMin ?? 0),
												awakeMin: sleepOverviewData.value.awakeMin + (awakeMin ?? 0),
											};
										}
									}
								}
							}
						});
				}
			});
		};

		const getOxygenData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let avg = 0,
					min = 1000,
					max = 0,
					dataLen = 0;
				let listData: any[] = [];
				newChartData.map((t: any) => {
					// dataLen += t.data.length;
					t.data.map((d: any) => {
						if (d.value !== '-') {
							dataLen++;
							let val = toNumber(d.value);
							avg += val;
							min = val < min ? val : min;
							max = val > max ? val : max;
							if (newChartData.length === 1) {
								if (listData.filter(f => f.time === `${d.period.substring(8, 10)}:${d.period.substring(10, 12)}`).length === 0) {
									listData.push({
										time: `${d.period.substring(8, 10)}:${d.period.substring(10, 12)}`,
										value: `${val}%`,
									});
								}
							}
						}
					});
				});

				if (dataLen < 1) {
					avg = 0;
					min = 0;
				} else {
					avg = Number((avg / dataLen).toFixed(0));
				}
				if (min === 1000) {
					min = 0;
				}

				chartDate.value = newChartData;

				oxygenOverviewData.value = { avg: getNumberFormat(avg), min: getNumberFormat(min), max: getNumberFormat(max), list: listData };
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getOxygen', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;
							let data = Array.from(chartDate.value);

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}

							handleLoop();
						}
					});
			}
		};

		const getStressData = () => {
			chartDate.value = [];
			const newChartData: any[] = [];

			const handleLoop = () => {
				let avg = 0,
					min = 1000,
					max = 0,
					dataLen = 0;
				newChartData.map((t: any) => {
					// dataLen += t.data.length;
					t.data.map((d: any) => {
						if (d.value !== '-') {
							dataLen++;
							let val = toNumber(d.value);
							avg += val;
							min = val < min ? val : min;
							max = val > max ? val : max;
						}
					});
				});

				if (dataLen < 1) {
					avg = 0;
					min = 0;
				} else {
					avg = Number((avg / dataLen).toFixed(0));
				}
				if (min === 1000) {
					min = 0;
				}
				chartDate.value = newChartData;

				stressOverviewData.value = { avg: getNumberFormat(avg), min: getNumberFormat(min), max: getNumberFormat(max) };
			};

			for (let mi = 0; mi < checkList.value.length; mi++) {
				let param = getParameter(mi);
				getApiClient(AppConfig.API_URL, store)
					.post('/api/1/health/getStress', param)
					.then(res => {
						if (res.data.resultCode === 0) {
							let responseData = res.data.data;

							let temp: any = { date: '', data: [] };
							temp.date = param.startDt;
							let data = Array.from(chartDate.value);

							if (selectPeriod.value === PeriodType.DAY) {
								const mTheDay = moment(param.startDt, 'YYYYMMDDHHmm');
								for (let i = 0; i < 24; i++) {
									let period = mTheDay.format('YYYYMMDDHH00');
									let filterData = responseData.filter((item: any) => moment(item.period, 'YYYYMMDDHHmm').format('YYYYMMDDHH00') === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mTheDay.add(1, 'hour');
								}
								newChartData.push(temp);
							} else if (selectPeriod.value === PeriodType.WEEK) {
								const mStartDt = moment(('' + param.startDt).substring(0, 8));
								const mEndDt = moment(('' + param.endDt).substring(0, 8));
								const durationDt = mEndDt.diff(mStartDt, 'days');
								for (let i = 0; i <= durationDt; i++) {
									let period = mStartDt.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mStartDt.add(1, 'day');
								}
								newChartData.push(temp);
							} else {
								let thisMonth = new Date(dateList.value[checkList.value[mi]]);
								const mThisMonth = moment(`${thisMonth.getFullYear()}/${thisMonth.getMonth() + 1}/1`, 'YYYY/M/D');
								const mLastThisMonth = mThisMonth.clone().add(1, 'month').add(-1, 'day');
								const mMonthDays = mLastThisMonth.diff(mThisMonth, 'days');
								for (let i = 0; i <= mMonthDays; i++) {
									let period = mThisMonth.format('YYYYMMDD');
									let filterData = responseData.filter((item: any) => item.period === period);
									if (filterData.length > 0) {
										temp.data.push(filterData[0]);
									} else {
										let dataSet = {
											period: period,
											userIdx: param.userIdx,
											value: '-',
										};
										temp.data.push(dataSet);
									}
									mThisMonth.add(1, 'day');
								}
								newChartData.push(temp);
							}

							handleLoop();
						}
					});
			}
		};

		const getUserType = () => {
			const userData = JSON.parse(loadLocalData(KEY_LIST.CONST.LOGIN_USER) as string);
			if (userData) userType.value = userData.userType;
		};

		// const handleGroupLoadComplete = () => {
		// 	onChangeDate(new Date().toString());
		// };

		const handleBinding = () => {
			onChangeDate(new Date().toString());
			// try {
			// 	const isReady = getGroupManager().isReady;
			// 	if (isReady) onChangeDate(new Date().toString());
			// 	else getGroupManager().addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			// } catch (e) {
			// 	if (e instanceof NotChatReadyException) {
			// 		const groupManager = createGroupManager();
			// 		groupManager.addEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
			// 		groupManager.launchChat();
			// 	} else {
			// 		throw e;
			// 	}
			// }
		};

		onMounted(() => {
			handleBinding();
			getUserType();

			let params: { userIdx: string } = {
				userIdx: getUserData().userIdx as string,
			};
			if (getUserData().userType === UserType.USER) {
				params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
			} else if (getUserData().userType === UserType.USER_DEVICE) {
				if (params.userIdx !== getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx) {
					params.userIdx = getGroupManager().getCurrentGroup()?.creatorInfo?.userIdx as string;
				}
			} else if (getUserData().userType === UserType.MANAGER) {
				params.userIdx = getGroupManager().getGroup(route.query.group as string)?.creatorInfo?.userIdx as string;
			}
			getApiClient(AppConfig.API_URL, store)
				.post('/api/1/goal/getGoalInfo', params)
				.then(res => {
					if (res.data.data) {
						let goalInfo = [];
						switch (compDataType.value) {
							case 'working':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'STEP');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								} else {
									goalData.value = getNumberFormat(10000);
								}
								break;
							case 'heart-rate':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'HEARTRATE');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								}
								break;
							case 'temperature':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'TEMPERATURE');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								}
								break;
							case 'blood-pressure':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'BLOODPRESSURE');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								}
								break;
							case 'sleep':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'SLEEP');
								if (goalInfo.length > 0) {
									goalData.value = goalInfo[goalInfo.length - 1].goalValue;
								} else {
									goalData.value = '480';
								}
								break;
							case 'oxygen':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'OXYGEN');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								}
								break;
							case 'stress':
								goalInfo = res.data.data.filter((t: any) => t.goalType === 'STRESS');
								if (goalInfo.length > 0) {
									goalData.value = getNumberFormat(goalInfo[goalInfo.length - 1].goalValue);
								}
								break;
						}
					}
				});
			const user = getUserData();
			if (user && user.userType) isManager.value = user.userType === UserType.MANAGER;
		});

		onUnmounted(() => {
			// getGroupManager().removeEventListener(GroupManagerEvent.LOAD_COMPLETE, handleGroupLoadComplete);
		});

		return {
			moment,
			PeriodType,
			selectPeriod,
			periodList,
			setSelectPeriod,
			selectDate,
			onChangeDate,
			dateList,
			checkList,
			format,
			UserType,
			userType,
			onCheck,
			colorList,
			isManager,
			chartType,
			ChartTypes,
			chartDate,
			goalData,
			compDataType,
			workingOverviewData,
			heartOverviewData,
			tempOverviewData,
			oxygenOverviewData,
			stressOverviewData,
			bloodOverviewData,
			sleepOverviewData,
			getNumberFormat,
		};
	},
};
</script>

<template>
	<section class="heath-view">
		<div class="period-btn-wrapper flex justify-center">
			<template v-for="item in periodList" :key="item.type">
				<kp-button
					:class="userType === UserType.MANAGER ? 'mr-[20px] last:mr-0' : ''"
					:btn-class="compDataType"
					:is-default="selectPeriod !== item.type"
					:on-click="() => setSelectPeriod(item.type)">
					{{ item.label }}
				</kp-button>
			</template>
		</div>
		<div class="data-wrapper mt-[30px]" :class="{ 'pb-[310px]': selectPeriod === PeriodType.DAY, 'pb-[440px]': selectPeriod !== PeriodType.DAY }">
			<kp-date-picker class="date-picker" :date="selectDate" @onChangeDate="onChangeDate" is-white />
			<div class="chart-wrapper" :key="new Date().getMilliseconds()">
				<bar-chart
					v-if="chartType === ChartTypes.BAR"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<bar-chart-for-sleep
					v-if="chartType === ChartTypes.BARSLEEP"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<line-chart
					v-if="chartType === ChartTypes.LINE"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<line-chart-two-line
					v-if="chartType === ChartTypes.TWOLINE"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<area-chart
					v-if="chartType === ChartTypes.AREA"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<waterfall-chart
					v-if="chartType === ChartTypes.WATERFALL"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<bar-area-chart
					v-if="chartType === ChartTypes.BARAREA"
					:data-type="compDataType"
					:select-period="selectPeriod"
					:date-list="dateList"
					:check-list="checkList.sort()"
					:data="chartDate" />
				<div>
					<ul
						class="chat-option"
						:class="{
							day: selectPeriod === PeriodType.DAY,
							week: selectPeriod === PeriodType.WEEK,
							month: selectPeriod === PeriodType.MONTH,
							[compDataType ? compDataType : '']: true,
							isManager,
						}">
						<li v-for="(item, index) in dateList" :key="index">
							<label class="container">
								{{ moment(new Date(item)).format(format) }}
								<template v-if="selectPeriod === PeriodType.WEEK"
									>~ {{ moment(new Date(item).setDate(new Date(item).getDate() + 6)).format(format) }}
								</template>
								<input type="checkbox" @click="e => onCheck(e, index)" :checked="checkList.indexOf(index) > -1" />
								<span class="checkmark"></span>
							</label>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<template v-if="compDataType === 'working'">
			<div class="working-info flex justify-center flex-col items-center py-[15px]">
				<p class="title">걸음수</p>
				<p class="main-info">
					{{ workingOverviewData.working }} <span>/ {{ goalData }}</span>
				</p>
			</div>
			<div class="working-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ workingOverviewData.distance }}<span>km</span></p>
					<label>거리</label>
				</div>
				<div class="sub-info">
					<p>{{ workingOverviewData.kcal }}<span>kcal</span></p>
					<label>소모</label>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'heart-rate'">
			<div class="heart-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ heartOverviewData.avg }}<span>BPM</span></p>
					<label>평균</label>
				</div>
				<div class="sub-info">
					<p>{{ heartOverviewData.min }}<span>BPM</span></p>
					<label>최저</label>
				</div>
				<div class="sub-info">
					<p>{{ heartOverviewData.max }}<span>BPM</span></p>
					<label>최고</label>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'temperature'">
			<div class="temperature-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ tempOverviewData.avg }}<span>°C</span></p>
					<label>평균</label>
				</div>
				<div class="sub-info">
					<p>{{ tempOverviewData.min }}<span>°C</span></p>
					<label>최저</label>
				</div>
				<div class="sub-info">
					<p>{{ tempOverviewData.max }}<span>°C</span></p>
					<label>최고</label>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'stress'">
			<div class="stress-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ stressOverviewData.avg }}<span>%</span></p>
					<label>평균</label>
				</div>
				<div class="sub-info">
					<p>{{ stressOverviewData.min }}<span>%</span></p>
					<label>최소</label>
				</div>
				<div class="sub-info">
					<p>{{ stressOverviewData.max }}<span>%</span></p>
					<label>최고</label>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'blood-pressure'">
			<div class="blood-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ Number(bloodOverviewData.maxAvg).toFixed(0) }}<span>mmHg</span></p>
					<label>평균 수축기</label>
				</div>
				<div class="sub-info">
					<p>{{ Number(bloodOverviewData.minAvg).toFixed(0) }}<span>mmHg</span></p>
					<label>평균 이완기</label>
				</div>
			</div>
			<div class="blood-info flex flex-col justify-center items-center px-[25px]" v-if="checkList.length === 1 && selectPeriod === PeriodType.DAY">
				<div class="data-table row flex">
					<div class="header w-[60px] min-w-[60px] px-0">시간</div>
					<div class="header w-[60px] min-w-[60px] px-0">수축기</div>
					<div class="header w-[60px] min-w-[60px] px-0">이완기</div>
				</div>
				<div class="data-table row data flex" v-for="(item, index) in bloodOverviewData.list" :key="index">
					<div>{{ item.time }}</div>
					<div>{{ item.max }}</div>
					<div>{{ item.min }}</div>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'sleep'">
			<div class="sleep-info flex justify-center flex-col items-center py-[15px]">
				<p class="title">수면시간</p>
				<p class="main-info">
					{{ Math.floor(sleepOverviewData.totalSleepMin / checkList.length / 60) }}<label>시</label>
					{{ Math.floor((sleepOverviewData.totalSleepMin / checkList.length) % 60) }}<label>분</label>
					<span
						>/ {{ isNaN(Math.floor(goalData / 60)) ? 0 : Math.floor(goalData / 60) }}<label>시</label> {{ isNaN(goalData % 60) ? 0 : goalData % 60
						}}<label>분</label></span
					>
				</p>
			</div>
			<div class="sleep-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>
						{{ Math.floor(sleepOverviewData.deepSleepMin / checkList.length / 60) }}<span class="">시</span
						>{{ Math.floor((sleepOverviewData.deepSleepMin / checkList.length) % 60) }}<span>분</span>
					</p>
					<label>깊은 수면</label>
				</div>
				<div class="sub-info">
					<p>
						{{ Math.floor(sleepOverviewData.lightSleepMin / checkList.length / 60) }}<span>시</span
						>{{ Math.floor((sleepOverviewData.lightSleepMin / checkList.length) % 60) }}<span>분</span>
					</p>
					<label>얕은 수면</label>
				</div>
				<div class="sub-info">
					<p>{{ getNumberFormat(sleepOverviewData.awakeMin / checkList.length) }}<span>분</span></p>
					<label>기상</label>
				</div>
			</div>
		</template>
		<template v-if="compDataType === 'oxygen'">
			<div class="oxygen-info flex justify-center items-center py-[17px]">
				<div class="sub-info">
					<p>{{ oxygenOverviewData.avg }}<span>%</span></p>
					<label>평균</label>
				</div>
				<div class="sub-info">
					<p>{{ oxygenOverviewData.min }}<span>%</span></p>
					<label>최소</label>
				</div>
				<div class="sub-info">
					<p>{{ oxygenOverviewData.max }}<span>%</span></p>
					<label>최대</label>
				</div>
			</div>
			<div class="oxygen-info flex flex-col justify-center items-center px-[25px]" v-if="checkList.length === 1 && selectPeriod === PeriodType.DAY">
				<div class="data-table row flex">
					<div class="header w-[60px] min-w-[60px] px-0">시간</div>
					<div class="header w-[60px] min-w-[60px] px-0">값</div>
				</div>
				<div class="data-table row data flex" v-for="(item, index) in oxygenOverviewData.list" :key="index">
					<div>{{ item.time }}</div>
					<div>{{ item.value }}</div>
				</div>
			</div>
		</template>
	</section>
</template>

<style scoped></style>
