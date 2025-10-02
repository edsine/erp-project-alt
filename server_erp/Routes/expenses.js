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
router.post('/', async (req, res) => {
  try {
    const {
      day, month, week, voucher, transactionDetails,
      amount, category, costCentre, subCostCentre, bankDebited, date
    } = req.body

    const query = `
      INSERT INTO expenses (day, month, week, voucher, transaction_details, amount, 
                           category, cost_centre, sub_cost_centre, bank_debited, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const [result] = await db.execute(query, [
      day, month, week, voucher, transactionDetails, amount,
      category, costCentre, subCostCentre, bankDebited, date
    ])

    res.json({ id: result.insertId, message: 'Expense record created successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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