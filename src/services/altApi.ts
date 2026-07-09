import axios from 'axios';

const altApi = axios.create({
  baseURL: 'https://ndcaltapi.xnyder.com',
  headers: { 'Content-Type': 'application/json' },
});

export default altApi;
