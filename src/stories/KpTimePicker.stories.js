import KpTimePicker from '../components/common/KpTimePicker.vue';

export default {
	/* 👇 The title prop is optional.
	 * See https://storybook.js.org/docs/vue/configure/overview#configure-story-loading
	 * to learn how to generate automatic titles
	 */
	title: 'Components/picker',
	component: KpTimePicker,
};

export const Default = () => ({
	components: { KpTimePicker },
	template: '<kp-time-picker />',
});
