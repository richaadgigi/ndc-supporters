import axios from 'axios';

const altApi = axios.create({
  baseURL: '/api/altproxy',
  headers: { 'Content-Type': 'application/json' },
});

export default altApi;
