import { createRouter, createWebHistory } from 'vue-router';
import VisitorHome from '@/views/visitor-home.vue';
import SendPage from '@/views/send.vue';

const routes = [
    {
        path: '/',
        redirect: '/visitor-home'
    },
    {
        path: '/visitor-home',
        name: 'VisitorHome',
        component: VisitorHome
    },
    {
        path: '/send',
        name: 'Send',
        component: SendPage
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router; 