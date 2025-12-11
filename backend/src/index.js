
const app = require('./server');
const bookingExpiry = require('./workers/bookingExpiry');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

bookingExpiry.start();
