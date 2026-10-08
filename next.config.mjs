export default {
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] }];
  },
};
