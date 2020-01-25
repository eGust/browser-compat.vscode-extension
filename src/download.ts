import { fetchCaniuseData } from './caniuse_data';

(async () => {
  try {
    console.info('Downloading caniuse data');
    await fetchCaniuseData();
    console.info('DONE!');
  } catch (e) {
    console.error('FAILED:', e);
  }
})();
