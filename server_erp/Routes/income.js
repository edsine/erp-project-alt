const express = require('express')
const router = express.Router()
const db = require('../db')

// Get all income records
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query
    let query = 'SELECT * FROM income WHERE 1=1'
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

// Create new income record
router.post('/', async (req, res) => {
  try {
    const {
      day, month, week, voucher, transactionDetails,
      amount, category, costCentre, subCostCentre, bankCredited, date
    } = req.body

    const query = `
      INSERT INTO income (day, month, week, voucher, transaction_details, amount, 
                         category, cost_centre, sub_cost_centre, bank_credited, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const [result] = await db.execute(query, [
      day, month, week, voucher, transactionDetails, amount,
      category, costCentre, subCostCentre, bankCredited, date
    ])

    res.json({ id: result.insertId, message: 'Income record created successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update income record
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      day, month, week, voucher, transactionDetails,
      amount, category, costCentre, subCostCentre, bankCredited
    } = req.body

    const query = `
      UPDATE income 
      SET day = ?, month = ?, week = ?, voucher = ?, transaction_details = ?,
          amount = ?, category = ?, cost_centre = ?, sub_cost_centre = ?, bank_credited = ?
      WHERE id = ?
    `
    
    await db.execute(query, [
      day, month, week, voucher, transactionDetails, amount,
      category, costCentre, subCostCentre, bankCredited, id
    ])

    res.json({ message: 'Income record updated successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete income record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    await db.execute('DELETE FROM income WHERE id = ?', [id])
    res.json({ message: 'Income record deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router