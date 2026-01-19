const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./Routes/Auth');
const memoRoutes = require('./Routes/memo');
const requisitionsRoutes = require('./Routes/requisition');
const TaskRoutes = require('./Routes/tasks');
const filesRoutes = require('./Routes/files');
const leaveRoutes = require('./Routes/leave');
const ReportRoutes = require('./Routes/Reprts');
// const activityRoutes = require('./Routes/activityRoutes'); 
const directMemosRoutes = require('./Routes/directMemos');
 const financeRoutes = require('./Routes/Finance') 


const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api', authRoutes);
app.use('/api', memoRoutes);
app.use('/api', requisitionsRoutes);
app.use('/api', TaskRoutes);
app.use('/api', filesRoutes);
app.use('/api', leaveRoutes);
app.use('/api', ReportRoutes);
// app.use('/api', activityRoutes);
app.use('/api/direct-memos', directMemosRoutes);
app.use('/api/finance', financeRoutes); 





const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
