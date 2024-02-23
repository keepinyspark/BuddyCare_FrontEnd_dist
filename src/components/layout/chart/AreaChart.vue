<script lang="ts">
import { defineComponent, onMounted, PropType, ref, toRef, watch } from 'vue';
import * as echarts from 'echarts/core';
import { GridComponent } from 'echarts/components';
import { LineChart } from 'echarts/charts';
import { UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { ChartDataTypes } from '@src/types/types';
import { defaultColorList, PeriodType } from '@components/layout/health/ChartView.vue';
import { defaultDayXLine, defaultMonthXLine, defaultWeekXLine } from '@components/layout/chart/chart-sertting';

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition]);

export default defineComponent({
	name: 'AreaChart',
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
							let temp = originData[i].data.map((t: any) => t.period.substring(8, 12));
							xLines = xLines.concat(temp);
						}
						let result = xLines.filter((element, index) => {
							return xLines.indexOf(element) === index;
						});

						// result = result.map((t: any) => `${t.slice(0, 2)}:${t.slice(2, 4)}`);
						result = result.map((t: any) => `${t.slice(0, 2)}`);
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

			if (props.dataType && props.checkList) {
				if (props.checkList.length === 1) {
					let data = [];
					if (originData.length > 0 && originData[0].data && originData[0].data.length > 0) {
						data = originData[0].data.map((t: any) => t.value);
					}
					series.push({
						type: 'line',
						areaStyle: {
							color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
								{
									offset: 1,
									color: defaultColorList[props.dataType][props.checkList[0]],
								},
								{
									offset: 0,
									color: '#FFFFFF',
								},
							]),
						},
						itemStyle: {
							color: defaultColorList[props.dataType],
						},
						data: data.length === 0 ? [0] : data,
					});
				}
			}

			return series;
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
						end: 80,
						xAxisIndex: [0, 1],
					},
					{
						type: 'inside',
						start: 0,
						end: 80,
						xAxisIndex: [0, 1],
					},
				],
				xAxis: {
					data: getXLine(originData),
					axisLabel: {
						color: '#4E4B66',
						margin: 15,
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
				yAxis: {
					axisLine: {
						show: false,
					},
					axisTick: {
						show: false,
					},
					axisLabel: {
						color: '#AAB1BB',
						fontSize: 14,
					},
					min: getYMin(isEmpty),
					max: getYMax(isEmpty),
				},
				series: getSeries(originData),
			};
		};

		const getYMin = (isEmpty: boolean) => {
			if (props.dataType !== 'temperature' && !isEmpty) {
				return dataSum > 0 ? null : 0;
			}
			switch (props.dataType) {
				case 'temperature':
					return 34.5;
				case 'oxygen':
					return 50;
				case 'blood-pressure':
					return 0;
				case 'heart-rate':
					return 0;
				case 'stress':
					return 50;
				case 'working':
					return 0;
				default:
					return null;
			}
		};

		const getYMax = (isEmpty: boolean) => {
			if (props.dataType !== 'temperature' && !isEmpty) {
				return dataSum > 0 ? null : 10;
			}
			switch (props.dataType) {
				case 'temperature':
					return 37.5;
				case 'oxygen':
					return 100;
				case 'blood-pressure':
					return 200;
				case 'heart-rate':
					return 200;
				case 'stress':
					return 100;
				case 'working':
					return 2000;
				default:
					return null;
			}
		};

		let runConfigIdx = -1;
		const runConfig = () => {
			window.clearTimeout(runConfigIdx);
			runConfigIdx = window.setTimeout(() => {
				setConfig();
			}, 200);
		};

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
			console.log(`Chart AREA`);
		});

		return {
			chartRef,
			chartConfig,
		};
	},
});
</script>

<template>
	<v-chart class="chart" :option="chartConfig" autoresize />
</template>

<style scoped></style>
