import moment from 'moment';

export const getInsertTemperatureParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.period / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.period % 60)
			.toString()
			.padStart(2, '0');

		return { period: Number(`${yyyymmdd}${hh}${mm}`), temperature: item.temperatureValue };
	});
};

export const getInsertBloodPressureParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.period / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.period % 60)
			.toString()
			.padStart(2, '0');

		return { period: Number(`${yyyymmdd}${hh}${mm}`), bloodPressure: item.highBloodPressureValue, bloodPressureLow: item.lowBloodPressureValue };
	});
};

export const getInsertHeartRateParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.period / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.period % 60)
			.toString()
			.padStart(2, '0');

		return { period: Number(`${yyyymmdd}${hh}${mm}`), heartRate: item.heartRate };
	});
};

export const getInsertStressParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.period / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.period % 60)
			.toString()
			.padStart(2, '0');

		return { period: Number(`${yyyymmdd}${hh}${mm}`), stressRate: item.stressValue };
	});
};

export const getInsertActivityParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.time / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.time % 60)
			.toString()
			.padStart(2, '0');

		return {
			period: Number(`${yyyymmdd}${hh}${mm}`),
			stepCount: item.stepCount,
			totalStepCount: data.totalStepCount,
			calorie: data.totalCalories,
			distance: data.totalDistance,
		};
	});
};

export const getInsertOxygenParam = (data: any) => {
	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const yyyymmdd = moment(defaultDate).format('YYYYMMDD');

	return data?.items.map((item: any, index: number) => {
		const hh = Math.floor(item.period / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.period % 60)
			.toString()
			.padStart(2, '0');

		return { period: Number(`${yyyymmdd}${hh}${mm}`), oxygen: item.oxygenValue };
	});
};

export const getInsertSleepParam = (data: any) => {
	let yesterdayIndex = -1;
	data?.items?.map((item: any, index: number) => {
		if (index < data?.items.length - 1) {
			if (item.startTime > data?.items[index + 1].startTime) {
				yesterdayIndex = index;
			}
		}
	});

	const defaultDate = new Date(`${data.year}-${data.month.toString().padStart(2, '0')}-${data.day.toString().padStart(2, '0')}`);
	const today = new Date(defaultDate);
	const yesterday = new Date(defaultDate.setDate(defaultDate.getDate() - 1));
	return data?.items?.map((item: any, index: number) => {
		let yyyymmdd = moment(today).format('YYYYMMDD');
		if (index <= yesterdayIndex) {
			yyyymmdd = moment(yesterday).format('YYYYMMDD');
		}
		const hh = Math.floor(item.startTime / 60)
			.toString()
			.padStart(2, '0');
		const mm = Math.floor(item.startTime % 60)
			.toString()
			.padStart(2, '0');

		return {
			period: Number(`${yyyymmdd}${hh}${mm}`),
			sleepStartTimeHour: data.sleepStartTimeHour,
			sleepStartTimeMin: data.sleepStartTimeMinute,
			sleepEndTimeHour: data.sleepEndTimeHour,
			sleepEndTimeMin: data.sleepEndTimeMins,
			totalSleepMin: data.totalSleepMins,
			lightSleepCount: data.lightSleepCount,
			lightSleepMin: data.lightSleepMins,
			deepSleepCount: data.deepSleepCount,
			deepSleepMin: data.deepSleepMins,
			awakeCount: data.awakeCount,
			awakeMin: data.awakeMins,
			remMin: data.remMins,
			sleepScore: data.sleepScore,
			level: item.level * -1,
			duration: item.duration,
			startTime: item.startTime,
			endTime: item.endTime,
		};
	});
};
