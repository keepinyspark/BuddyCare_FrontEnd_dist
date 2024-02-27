<script lang="ts">
import { defineComponent, onMounted, onUpdated, PropType, ref, toRef, watch } from 'vue';
import * as echarts from 'echarts/core';
import { TitleComponent, ToolboxComponent, TooltipComponent, GridComponent, DataZoomComponent } from 'echarts/components';
import { BarChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';
import VChart from 'vue-echarts';
import { ChartDataTypes } from '@src/types/types';
import { colorList, defaultColorList, PeriodType } from '@components/layout/health/ChartView.vue';
import { defaultDayXLine, defaultMonthXLine, defaultWeekXLine } from '@components/layout/chart/chart-sertting';

echarts.use([TitleComponent, ToolboxComponent, TooltipComponent, GridComponent, DataZoomComponent, BarChart, CanvasRenderer]);

export default defineComponent({
	name: 'BarAreaChart',
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

						xLines = xLines.map((t: any) => `${t.slice(0, 2)}:${t.slice(2, 4)}`);
						// result = result.map((t: any) => `${t.slice(0, 2)}`);
						return xLines.length === 0 ? defaultDayXLine : xLines;
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

		const hexToRgbA = (hex: string) => {
			let c;
			if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
				c = hex.substring(1).split('');
				if (c.length == 3) {
					c = [c[0], c[0], c[1], c[1], c[2], c[2]];
				}
				c = '0x' + c.join('');
				return 'rgba(' + [(Number(c) >> 16) & 255, (Number(c) >> 8) & 255, Number(c) & 255].join(',') + ', 0.5)';
			}
			throw new Error('Bad Hex');
		};

		const getSeries = (originData: any) => {
			let series = [];

			if (props.dataType && props.checkList) {
				if (props.checkList.length === 1) {
					let wakeData = [];
					let lightData = [];
					let emptyData = [];
					let deepData = [];
					if (originData.length > 0 && originData[0].data && originData[0].data.length > 0) {
						let temp = originData[0].data;
						wakeData = temp.map((t: any) => (t.value === -2 ? 1 : 0));
						lightData = temp.map((t: any) => (t.value === -1 ? 1 : 0));
						deepData = temp.map((t: any) => (t.value === 0 ? 1 : 0));
						emptyData = temp.map((t: any) => {
							if (t.value === 0) {
								return 0;
							} else if (t.value === -1) {
								return 1;
							} else if (t.value === -2) {
								return 2;
							}
						});
					}

					series.push(
						{
							type: 'bar',
							stack: 'sleep',
							barWidth: '100%',
							itemStyle: {
								color: 'transparent', //defaultColorList[props.dataType],
							},
							data: emptyData.length === 0 ? [0] : emptyData,
						},
						{
							type: 'bar',
							stack: 'sleep',
							barWidth: '100%',
							itemStyle: {
								color: defaultColorList[props.dataType][props.checkList[0]],
							},
							data: deepData.length === 0 ? [0] : deepData,
						},
						{
							type: 'bar',
							stack: 'sleep',
							barWidth: '100%',
							itemStyle: {
								color: hexToRgbA(defaultColorList[props.dataType][props.checkList[0]]),
							},
							data: lightData.length === 0 ? [0] : lightData,
						},
						{
							type: 'bar',
							stack: 'sleep',
							barWidth: '100%',
							itemStyle: {
								color: defaultColorList[props.dataType][props.checkList[0]],
							},
							emphasis: {
								itemStyle: {
									borderColor: 'transparent',
									color: 'transparent',
								},
							},
							data: wakeData.length === 0 ? [0] : wakeData,
						},
					);
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
					splitLine: {
						show: false,
					},
					splitArea: {
						show: false,
					},
				},
				yAxis: {
					type: 'value',
					splitLine: {
						show: true,
					},
					axisLabel: {
						fontSize: 14,
						color: '#AAB1BB',
						formatter: function (value: any) {
							if (value == 0.5) {
								return '깊은잠';
							} else if (value == 1.5) {
								return '얕은잠';
							} else if (value == 2.5) {
								return '기상';
							}
						},
					},
					min: 0,
					max: 3,
				},
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
			console.log(`Chart BAR_AREA`);
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
