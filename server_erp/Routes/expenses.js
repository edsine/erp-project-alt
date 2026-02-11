// routes/expenses.js
const express = require('express')
const router = express.Router()
const db = require('../db')

// Get all expense records
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query
    let query = 'SELECT * FROM expenses WHERE 1=1'
    const params = []

    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?'
      params.push(startDate, endDate)
    }

    if (search) {
      query += ' AND (transaction_details LIKE ? OR voucher LIKE ? OR category LIKE ?)'
      const searchParam = `%${search}%`
      params.push(searchParam, searchParam, searchParam)
    }

    const [rows] = await db.execute(query, params)
    res.json(rows)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new expense record
// router.post('/', async (req, res) => {
//   try {
//     const {
//       day, month, week, voucher, transactionDetails,
//       amount, category, costCentre, subCostCentre, bankDebited, date
//     } = req.body

//     const query = `
//       INSERT INTO expenses (day, month, week, voucher, transaction_details, amount, 
//                            category, cost_centre, sub_cost_centre, bank_debited, date)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `

//     const [result] = await db.execute(query, [
//       day, month, week, voucher, transactionDetails, amount,
//       category, costCentre, subCostCentre, bankDebited, date
//     ])

//     res.json({ id: result.insertId, message: 'Expense record created successfully' })
//   } catch (error) {
//     res.status(500).json({ error: error.message })
//   }
// })


// router.post('/requisitions/:id/pay', async (req, res) => {
//   const connection = await db.getConnection();

//   try {
//     const requisitionId = req.params.id;
//     const { user_id, bankDebited, category, costCentre, subCostCentre, voucher } = req.body;

//     await connection.beginTransaction();

//     // Verify finance user
//     const [userRows] = await connection.query(
//       'SELECT role FROM users WHERE id = ?',
//       [user_id]
//     );

//     if (userRows.length === 0 || userRows[0].role.toLowerCase() !== 'finance') {
//       return res.status(403).json({ message: 'Only finance users can process payments' });
//     }

//     // Get requisition details
//     const [reqRows] = await connection.query(
//       'SELECT * FROM requisitions WHERE id = ? AND approved_by_chairman = 1',
//       [requisitionId]
//     );

//     if (reqRows.length === 0) {
//       return res.status(404).json({ message: 'Requisition not found or not approved' });
//     }

//     const requisition = reqRows[0];

//     // Update requisition status + paid flag
//     await connection.query(
//       `UPDATE requisitions 
//        SET status = "completed", paid_by_finance = 1 
//        WHERE id = ?`,
//       [requisitionId]
//     );

//     // Prepare Expense Data
//     const today = new Date();

//     const day = today.getDate();
//     const month = today.toLocaleString('default', { month: 'long' });
//     const week = Math.ceil(day / 7);

//     // Insert into Expenses
//     await connection.query(
//       `INSERT INTO expense_records 
//   (day, month, week, voucher, transaction_details, amount, category, cost_centre, sub_cost_centre, bank_debited, date, requisition_id)
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         day,
//         month,
//         week,
//         voucher,
//         requisition.description,
//         requisition.total_amount,
//         category,
//         costCentre,
//         subCostCentre,
//         bankDebited,
//         today,
//         requisitionId
//       ]
//     );


//     await connection.commit();

//     res.status(200).json({
//       success: true,
//       message: 'Payment processed and expense recorded'
//     });

//   } catch (err) {
//     await connection.rollback();
//     console.error(err);
//     res.status(500).json({ message: 'Error processing payment' });
//   }
// });


// Update expense record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      day, month, week, voucher, transactionDetails,
      amount, category, costCentre, subCostCentre, bankDebited
    } = req.body

    const query = `
      UPDATE expenses 
      SET day = ?, month = ?, week = ?, voucher = ?, transaction_details = ?,
          amount = ?, category = ?, cost_centre = ?, sub_cost_centre = ?, bank_debited = ?
      WHERE id = ?
    `

    await db.execute(query, [
      day, month, week, voucher, transactionDetails, amount,
      category, costCentre, subCostCentre, bankDebited, id
    ])

    res.json({ message: 'Expense record updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete expense record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM expenses WHERE id = ?', [id])
    res.json({ message: 'Expense record deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router