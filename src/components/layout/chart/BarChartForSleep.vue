<script lang="ts">
import { defineComponent, nextTick, onMounted, onUpdated, PropType, ref, toRef, watch } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import { GridComponent, DataZoomComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { ChartDataTypes } from '@src/types/types';
import { colorList, defaultColorList, PeriodType } from '@components/layout/health/ChartView.vue';
import { defaultDayXLine, defaultMonthXLine, defaultWeekXLine } from '@components/layout/chart/chart-sertting';
import moment from 'moment';

use([GridComponent, BarChart, CanvasRenderer, DataZoomComponent]);

export default defineComponent({
	name: 'BarChartForSleep',
	components: { VChart },
	props: {
		dataType: {
			type: String as PropType<ChartDataTypes | ''>,
		},
		selectPeriod: {
			type: Number,
		},
		dateList: {
			type: Array as PropType<Date[]>,
		},
		checkList: {
			type: Array as PropType<number[]>,
		},
		data: {
			type: Array as PropType<any>,
			require: true,
		},
	},
	setup(props) {
		const chartConfig = ref<any | undefined>(undefined);
		const chartRef = ref<any | null>(null);
		const dates = toRef(props, 'dateList');
		const checks = toRef(props, 'checkList');
		const period = toRef(props, 'selectPeriod');
		const dataList = toRef(props, 'data');
		let dataSum = 0;

		const getSortData = () => {
			dataSum = 0;
			let sortDataList = Array.from(dataList.value);
			sortDataList.sort((a: any, b: any) => {
				if (a.date < b.date) {
					return 1;
				}
				if (a.date > b.date) {
					return -1;
				}
				return 0;
			});
			for (let index = 0; index < sortDataList.length; index++) {
				const element = sortDataList[index] as any;
				if (element.data && element.data.length > 0) {
					for (let j = 0; j < element.data.length; j++) {
						const el2 = element.data[j];
						dataSum += Number(el2.value) || 0;
					}
				}
			}
			return sortDataList;
		};

		const getXLine = (originData: any) => {
			if (originData && originData.length > 0) {
				switch (period.value) {
					case PeriodType.DAY:
						let xLines: any[] = [];
						for (let i = 0; i < originData.length; i++) {
							let targetDate = moment(originData[i].date.toString().slice(0, 8));
							targetDate.add(1, 'day');
							xLines = xLines.concat(targetDate.format('MMDD'));
						}
						let result = xLines.filter((element, index) => {
							return xLines.indexOf(element) === index;
						});

						result = result.map((t: any) => `${t.slice(0, 2)}.${t.slice(2, 4)}`);
						return result.length === 0 ? defaultDayXLine : result;
					case PeriodType.WEEK:
						return defaultWeekXLine;
					case PeriodType.MONTH:
						return defaultMonthXLine;
				}
			} else {
				switch (period.value) {
					case PeriodType.DAY:
						return defaultDayXLine;
					case PeriodType.WEEK:
						return defaultWeekXLine;
					case PeriodType.MONTH:
						return defaultMonthXLine;
				}
			}
			return [];
		};

		const getSeries = (originData: any) => {
			let series = [];

			switch (period.value) {
				case PeriodType.DAY:
					if (props.dataType && props.checkList) {
						for (let i = 0; i < props.checkList.length; i++) {
							let data = [];
							if (originData.length > 0 && originData[i] && originData[i].data && originData[i].data.length > 0) {
								let totalSleepData = originData[i].data.filter((f: { totalSleepMin: any }) => f.totalSleepMin);
								for (let j = 0; j < props.checkList.length; j++) {
									if (i === j) {
										if (totalSleepData.length > 0) {
											data.push(totalSleepData[0].totalSleepMin);
										} else {
											data.push('-');
										}
									} else {
										data.push('-');
									}
								}
							} else {
								for (let j = 0; j < props.checkList.length; j++) {
									data.push('-');
								}
							}
							series.push({
								type: 'bar',
								barWidth: 8,
								itemStyle: {
									color: colorList[props.dataType][props.checkList[series.length]],
									borderRadius: [20, 20, 0, 0],
								},
								data: data,
							});
						}
					}
					break;
				case PeriodType.WEEK:
					if (props.dataType && props.checkList) {
						for (let i = 0; i < props.checkList.length; i++) {
							let startDate = moment((dates.value as Date[])[props.checkList[i]]);
							let data = [];
							if (originData.length > 0 && originData[i] && originData[i].data && originData[i].data.length > 0) {
								for (let j = 0; j < 7; j++) {
									if (originData[0].data.filter((f: { period: string }) => f.period === startDate.format('YYYYMMDD')).length > 0) {
										data.push(originData[0].data.filter((f: { period: string }) => f.period === startDate.format('YYYYMMDD'))[0].value);
									} else {
										data.push('-');
									}
									startDate.add(1, 'day');
								}
							}
							series.push({
								type: 'bar',
								barWidth: 8,
								itemStyle: {
									color: colorList[props.dataType][props.checkList[series.length]],
									borderRadius: [20, 20, 0, 0],
								},
								data: data,
							});
						}
					}
					break;
				case PeriodType.MONTH:
					if (props.dataType && props.checkList) {
						for (let i = 0; i < props.checkList.length; i++) {
							let startDate = moment((dates.value as Date[])[props.checkList[i]]).date(1);
							let data = [];
							if (originData.length > 0 && originData[i] && originData[i].data && originData[i].data.length > 0) {
								for (let j = 0; j < originData[i].data.length; j++) {
									if (originData[0].data.filter((f: { period: string }) => f.period === startDate.format('YYYYMMDD')).length > 0) {
										data.push(originData[0].data.filter((f: { period: string }) => f.period === startDate.format('YYYYMMDD'))[0].value);
									} else {
										data.push('-');
									}
									startDate.add(1, 'day');
								}
							}
							series.push({
								type: 'bar',
								barWidth: 8,
								itemStyle: {
									color: colorList[props.dataType][props.checkList[series.length]],
									borderRadius: [20, 20, 0, 0],
								},
								data: data,
							});
						}
					}
					break;
			}

			return series;
		};

		const getYLine = () => {
			return {
				axisLine: {
					show: false,
				},
				axisTick: {
					show: false,
				},
				axisLabel: {
					color: '#AAB1BB',
					fontSize: 14,
					formatter: function (value: any) {
						const hh = Math.floor(Number(value) / 60).toString();
						const mm = Math.floor(Number(value) % 60)
							.toString()
							.padStart(2, '0');
						return `${hh}:${mm}`;
					},
				},
			};
		};

		const setConfig = () => {
			let originData = getSortData();
			let isEmpty = true;
			originData.map((item: any) => {
				if (item.data.length > 0) {
					isEmpty = false;
				}
			});
			chartConfig.value = {
				grid: [
					{
						left: 0,
						right: 0,
						height: '60%',
						containLabel: true,
					},
				],
				dataZoom: [
					{
						show: false,
						start: 0,
						end: 100,
						xAxisIndex: [0, 1],
					},
					{
						type: 'inside',
						start: 0,
						end: 100,
						xAxisIndex: [0, 1],
					},
				],
				xAxis: {
					data: getXLine(originData),
					axisLabel: {
						color: '#4E4B66',
						margin: 20,
						align: 'center',
						fontSize: 14,
					},
					axisTick: {
						show: false,
					},
					axisLine: {
						show: false,
					},
					z: 10,
				},
				yAxis: getYLine(),
				series: getSeries(originData),
			};
		};

		let runConfigIdx = -1;
		const runConfig = () => {
			window.clearTimeout(runConfigIdx);
			runConfigIdx = window.setTimeout(() => {
				setConfig();
			}, 200);
		};

		watch(
			() => period.value,
			() => {
				runConfig();
			},
		);

		watch(
			() => dataList.value,
			() => {
				runConfig();
			},
		);

		watch(
			() => dates.value,
			() => {
				runConfig();
			},
		);

		watch(
			() => checks.value,
			() => {
				runConfig();
			},
		);

		onMounted(() => {
			runConfig();
			console.log(`Chart BAR(sleep)`);
		});

		return {
			chartRef,
			chartConfig,
		};
	},
});
</script>

<template>
	<v-chart class="chart" :option="chartConfig" />
</template>

<style scoped></style>
