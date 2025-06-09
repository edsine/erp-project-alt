const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./Routes/auth');
const memoRoutes = require('./Routes/memo');
const requisitionsRoutes = require('./Routes/requisition');
const TaskRoutes = require('./Routes/tasks');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api', memoRoutes);
app.use('/api', requisitionsRoutes);
app.use('/api', TaskRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
