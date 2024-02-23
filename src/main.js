import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import PortalVue from 'portal-vue';
import './index.css';
import moment from 'moment';
import ko from 'moment/dist/locale/ko';
import ResizeTextarea from 'resize-textarea-vue3';
import { AppInterface } from './utils/WebView/AndroidInterface';

window.appInterface = new AppInterface(store);

moment.locale('ko', ko);
const app = createApp(App).use(router).use(store).use(PortalVue).use(ResizeTextarea).mount('#app');
